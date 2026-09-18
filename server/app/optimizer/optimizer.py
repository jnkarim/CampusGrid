from typing import Any

import pulp

from app.llm.models import LLMInterpretationBatch
from app.schemas import OptimizeRequest


class OptimizationError(Exception):
    pass


EPSILON = 1e-7


def build_effective_constraints(
    request: OptimizeRequest,
    interpretations: LLMInterpretationBatch,
) -> dict[str, Any]:
    """
    Convert validated directives into deterministic
    hour-by-hour optimization constraints.
    """

    hour_map = {item.hour: item for item in request.hours}

    # Base values
    effective_solar = {hour: float(hour_map[hour].solar_kwh) for hour in range(24)}

    minimum_reserve = {
        hour: float(request.battery.minimum_energy_kwh) for hour in range(24)
    }

    no_charge = {hour: False for hour in range(24)}

    no_discharge = {hour: False for hour in range(24)}

    max_grid = {hour: None for hour in range(24)}

    # Apply every validated directive

    for directive in interpretations.directives:

        if not directive.applies:
            continue

        directive_type = directive.directive_type
        adjustment = directive.structured_adjustment

        if adjustment is None:
            continue

        hours = adjustment["hours"]

        # SOLAR REDUCTION

        if directive_type == "solar_reduction":

            factor = float(adjustment["factor"])

            for hour in hours:
                effective_solar[hour] *= factor

        # MINIMUM BATTERY RESERVE

        elif directive_type == "minimum_battery_reserve":

            reserve = float(adjustment["minimum_energy_kwh"])

            for hour in hours:
                minimum_reserve[hour] = max(
                    minimum_reserve[hour],
                    reserve,
                )

        elif directive_type == "no_charge_window":

            for hour in hours:
                no_charge[hour] = True

        elif directive_type == "no_discharge_window":

            for hour in hours:
                no_discharge[hour] = True

        elif directive_type == "max_grid_window":

            grid_limit = float(adjustment["max_grid_kwh"])

            for hour in hours:

                existing_limit = max_grid[hour]

                if existing_limit is None:
                    max_grid[hour] = grid_limit
                else:
                    max_grid[hour] = min(
                        existing_limit,
                        grid_limit,
                    )

    return {
        "effective_solar": effective_solar,
        "minimum_reserve": minimum_reserve,
        "no_charge": no_charge,
        "no_discharge": no_discharge,
        "max_grid": max_grid,
    }


def optimize_schedule(
    request: OptimizeRequest,
    interpretations: LLMInterpretationBatch,
) -> dict:
    """
    Solve the 24-hour CampusGrid energy optimization problem.
    """

    effective = build_effective_constraints(
        request,
        interpretations,
    )

    hour_map = {item.hour: item for item in request.hours}

    battery = request.battery

    # Optimization problem

    problem = pulp.LpProblem(
        "CampusGrid_Energy_Optimization",
        pulp.LpMinimize,
    )

    # Decision variables

    grid = {
        h: pulp.LpVariable(
            f"grid_{h}",
            lowBound=0,
        )
        for h in range(24)
    }

    solar_used = {
        h: pulp.LpVariable(
            f"solar_used_{h}",
            lowBound=0,
            upBound=effective["effective_solar"][h],
        )
        for h in range(24)
    }

    charge = {
        h: pulp.LpVariable(
            f"charge_{h}",
            lowBound=0,
            upBound=battery.max_charge_kwh_per_hour,
        )
        for h in range(24)
    }

    discharge = {
        h: pulp.LpVariable(
            f"discharge_{h}",
            lowBound=0,
            upBound=battery.max_discharge_kwh_per_hour,
        )
        for h in range(24)
    }

    battery_energy = {
        h: pulp.LpVariable(
            f"battery_energy_{h}",
            lowBound=0,
            upBound=battery.capacity_kwh,
        )
        for h in range(24)
    }

    problem += pulp.lpSum(grid[h] * hour_map[h].tariff_bdt_per_kwh for h in range(24))

    for h in range(24):

        demand = float(hour_map[h].demand_kwh)

        problem += (
            grid[h] + solar_used[h] + discharge[h] == demand + charge[h]
        ), f"energy_balance_{h}"

        # Battery state transition

        if h == 0:

            problem += (
                battery_energy[h]
                == battery.initial_energy_kwh + charge[h] - discharge[h]
            ), f"battery_transition_{h}"

        else:

            problem += (
                battery_energy[h] == battery_energy[h - 1] + charge[h] - discharge[h]
            ), f"battery_transition_{h}"

        # Minimum battery reserve

        problem += (
            battery_energy[h] >= effective["minimum_reserve"][h]
        ), f"minimum_reserve_{h}"

        if effective["no_charge"][h]:

            problem += (charge[h] == 0), f"no_charge_{h}"

        # No-discharge directive

        if effective["no_discharge"][h]:

            problem += (discharge[h] == 0), f"no_discharge_{h}"

        # Maximum grid directive

        grid_limit = effective["max_grid"][h]

        if grid_limit is not None:

            problem += (grid[h] <= grid_limit), f"max_grid_{h}"

    # End-of-day battery neutrality

    problem += (
        battery_energy[23] == battery.initial_energy_kwh
    ), "final_battery_neutrality"

    solver = pulp.PULP_CBC_CMD(msg=False)

    problem.solve(solver)

    status = pulp.LpStatus[problem.status]

    if status != "Optimal":

        raise OptimizationError(f"Optimization failed. Solver status: {status}")

    hourly_plan = []

    running_energy = float(battery.initial_energy_kwh)

    for h in range(24):

        grid_value = max(
            0.0,
            float(pulp.value(grid[h]) or 0),
        )

        solar_value = max(
            0.0,
            float(pulp.value(solar_used[h]) or 0),
        )

        charge_value = max(
            0.0,
            float(pulp.value(charge[h]) or 0),
        )

        discharge_value = max(
            0.0,
            float(pulp.value(discharge[h]) or 0),
        )

        net_battery = charge_value - discharge_value

        if abs(net_battery) <= EPSILON:

            battery_action = "idle"
            battery_kwh = 0.0
            net_battery = 0.0

        elif net_battery > 0:

            battery_action = "charge"
            battery_kwh = net_battery

        else:

            battery_action = "discharge"
            battery_kwh = -net_battery

        running_energy += net_battery

        hourly_plan.append(
            {
                "hour": h,
                "grid_kwh": round(
                    grid_value,
                    6,
                ),
                "solar_used_kwh": round(
                    solar_value,
                    6,
                ),
                "battery_action": battery_action,
                "battery_kwh": round(
                    battery_kwh,
                    6,
                ),
                "battery_energy_after_kwh": round(
                    running_energy,
                    6,
                ),
            }
        )

    total_grid_kwh = sum(item["grid_kwh"] for item in hourly_plan)

    total_cost_bdt = sum(
        item["grid_kwh"] * float(hour_map[item["hour"]].tariff_bdt_per_kwh)
        for item in hourly_plan
    )

    peak_grid_kwh = max(item["grid_kwh"] for item in hourly_plan)

    return {
        "hourly_plan": hourly_plan,
        "total_grid_kwh": round(
            total_grid_kwh,
            6,
        ),
        "total_cost_bdt": round(
            total_cost_bdt,
            6,
        ),
        "peak_grid_kwh": round(
            peak_grid_kwh,
            6,
        ),
    }
