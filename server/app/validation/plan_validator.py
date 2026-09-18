import math

from app.llm.models import LLMInterpretationBatch
from app.optimizer.optimizer import build_effective_constraints
from app.schemas import OptimizeRequest


class PlanValidationError(Exception):
    pass


TOLERANCE = 1e-4
TOTAL_TOLERANCE = 0.01


def _validate_number(value, name):

    if (
        not isinstance(value, (int, float))
        or isinstance(value, bool)
    ):
        raise PlanValidationError(
            f"{name} must be numeric."
        )

    if not math.isfinite(float(value)):
        raise PlanValidationError(
            f"{name} must be finite."
        )

    return float(value)


def validate_plan(
    request: OptimizeRequest,
    interpretations: LLMInterpretationBatch,
    result: dict,
):
    """
    Independently replay and validate the complete
    24-hour CampusGrid optimization result.
    """

    hourly_plan = result.get(
        "hourly_plan"
    )

    if not isinstance(hourly_plan, list):
        raise PlanValidationError(
            "hourly_plan must be a list."
        )

    if len(hourly_plan) != 24:
        raise PlanValidationError(
            "hourly_plan must contain exactly 24 entries."
        )

    # -----------------------------------------------------
    # Validate hours
    # -----------------------------------------------------

    plan_hours = [
        row.get("hour")
        for row in hourly_plan
    ]

    if plan_hours != list(range(24)):
        raise PlanValidationError(
            "hourly_plan hours must be 0 through 23 "
            "in ascending order."
        )

    # -----------------------------------------------------
    # Apply validated directives again
    # -----------------------------------------------------

    effective = build_effective_constraints(
        request,
        interpretations,
    )

    hour_map = {
        item.hour: item
        for item in request.hours
    }

    battery = request.battery

    previous_energy = float(
        battery.initial_energy_kwh
    )

    recomputed_total_grid = 0.0
    recomputed_total_cost = 0.0
    recomputed_peak_grid = 0.0

    # =====================================================
    # Replay every hour
    # =====================================================

    for row in hourly_plan:

        hour = row["hour"]

        grid = _validate_number(
            row.get("grid_kwh"),
            f"grid_kwh at hour {hour}",
        )

        solar = _validate_number(
            row.get("solar_used_kwh"),
            f"solar_used_kwh at hour {hour}",
        )

        battery_kwh = _validate_number(
            row.get("battery_kwh"),
            f"battery_kwh at hour {hour}",
        )

        energy_after = _validate_number(
            row.get("battery_energy_after_kwh"),
            f"battery_energy_after_kwh at hour {hour}",
        )

        action = row.get(
            "battery_action"
        )

        # -------------------------------------------------
        # Non-negative output values
        # -------------------------------------------------

        if grid < -TOLERANCE:
            raise PlanValidationError(
                f"Negative grid import at hour {hour}."
            )

        if solar < -TOLERANCE:
            raise PlanValidationError(
                f"Negative solar use at hour {hour}."
            )

        if battery_kwh < -TOLERANCE:
            raise PlanValidationError(
                f"Negative battery_kwh at hour {hour}."
            )

        # -------------------------------------------------
        # Solar constraint
        # -------------------------------------------------

        max_solar = effective[
            "effective_solar"
        ][hour]

        if solar > max_solar + TOLERANCE:
            raise PlanValidationError(
                f"Solar usage exceeds available solar "
                f"at hour {hour}."
            )

        # -------------------------------------------------
        # Interpret battery action
        # -------------------------------------------------

        battery_charge = 0.0
        battery_discharge = 0.0

        if action == "idle":

            if abs(battery_kwh) > TOLERANCE:
                raise PlanValidationError(
                    f"Idle battery must have "
                    f"battery_kwh=0 at hour {hour}."
                )

        elif action == "charge":

            battery_charge = battery_kwh

            if (
                battery_charge
                > battery.max_charge_kwh_per_hour
                + TOLERANCE
            ):
                raise PlanValidationError(
                    f"Battery charge rate exceeded "
                    f"at hour {hour}."
                )

            if effective["no_charge"][hour]:
                raise PlanValidationError(
                    f"Charging is prohibited "
                    f"at hour {hour}."
                )

        elif action == "discharge":

            battery_discharge = battery_kwh

            if (
                battery_discharge
                > battery.max_discharge_kwh_per_hour
                + TOLERANCE
            ):
                raise PlanValidationError(
                    f"Battery discharge rate exceeded "
                    f"at hour {hour}."
                )

            if effective["no_discharge"][hour]:
                raise PlanValidationError(
                    f"Discharging is prohibited "
                    f"at hour {hour}."
                )

        else:
            raise PlanValidationError(
                f"Invalid battery_action "
                f"at hour {hour}."
            )

        # -------------------------------------------------
        # Battery transition
        # -------------------------------------------------

        expected_energy = (
            previous_energy
            + battery_charge
            - battery_discharge
        )

        if (
            abs(
                expected_energy
                - energy_after
            )
            > TOLERANCE
        ):
            raise PlanValidationError(
                f"Battery transition mismatch "
                f"at hour {hour}."
            )

        # -------------------------------------------------
        # Battery capacity
        # -------------------------------------------------

        if (
            energy_after
            > battery.capacity_kwh
            + TOLERANCE
        ):
            raise PlanValidationError(
                f"Battery capacity exceeded "
                f"at hour {hour}."
            )

        # -------------------------------------------------
        # Minimum reserve
        # -------------------------------------------------

        required_reserve = effective[
            "minimum_reserve"
        ][hour]

        if (
            energy_after
            < required_reserve
            - TOLERANCE
        ):
            raise PlanValidationError(
                f"Battery reserve violated "
                f"at hour {hour}."
            )

        # -------------------------------------------------
        # Maximum grid directive
        # -------------------------------------------------

        grid_limit = effective[
            "max_grid"
        ][hour]

        if (
            grid_limit is not None
            and grid
            > grid_limit + TOLERANCE
        ):
            raise PlanValidationError(
                f"Maximum grid limit violated "
                f"at hour {hour}."
            )

        # -------------------------------------------------
        # Energy balance
        #
        # grid + solar + discharge
        # =
        # demand + charge
        # -------------------------------------------------

        demand = float(
            hour_map[hour].demand_kwh
        )

        left_side = (
            grid
            + solar
            + battery_discharge
        )

        right_side = (
            demand
            + battery_charge
        )

        if (
            abs(left_side - right_side)
            > TOLERANCE
        ):
            raise PlanValidationError(
                f"Energy balance violated "
                f"at hour {hour}. "
                f"Left={left_side}, "
                f"Right={right_side}"
            )

        # -------------------------------------------------
        # Totals
        # -------------------------------------------------

        tariff = float(
            hour_map[hour]
            .tariff_bdt_per_kwh
        )

        recomputed_total_grid += grid

        recomputed_total_cost += (
            grid * tariff
        )

        recomputed_peak_grid = max(
            recomputed_peak_grid,
            grid,
        )

        previous_energy = energy_after

    # =====================================================
    # Final battery neutrality
    # =====================================================

    if (
        abs(
            previous_energy
            - battery.initial_energy_kwh
        )
        > TOTAL_TOLERANCE
    ):
        raise PlanValidationError(
            "Final battery energy must equal "
            "initial battery energy."
        )

    # =====================================================
    # Check reported totals
    # =====================================================

    reported_grid = _validate_number(
        result.get("total_grid_kwh"),
        "total_grid_kwh",
    )

    reported_cost = _validate_number(
        result.get("total_cost_bdt"),
        "total_cost_bdt",
    )

    reported_peak = _validate_number(
        result.get("peak_grid_kwh"),
        "peak_grid_kwh",
    )

    if (
        abs(
            reported_grid
            - recomputed_total_grid
        )
        > TOTAL_TOLERANCE
    ):
        raise PlanValidationError(
            "total_grid_kwh is incorrect."
        )

    if (
        abs(
            reported_cost
            - recomputed_total_cost
        )
        > TOTAL_TOLERANCE
    ):
        raise PlanValidationError(
            "total_cost_bdt is incorrect."
        )

    if (
        abs(
            reported_peak
            - recomputed_peak_grid
        )
        > TOTAL_TOLERANCE
    ):
        raise PlanValidationError(
            "peak_grid_kwh is incorrect."
        )

    return True