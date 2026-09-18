import math

from app.llm.models import LLMInterpretationBatch
from app.schemas import OptimizeRequest


class GuardrailError(Exception):
    pass


ALLOWED_DIRECTIVES = {
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op",
}


def validate_hours(hours):

    if not isinstance(hours, list):
        raise GuardrailError(
            "hours must be a list."
        )

    if len(hours) == 0:
        raise GuardrailError(
            "hours cannot be empty."
        )

    if not all(
        isinstance(hour, int)
        and not isinstance(hour, bool)
        for hour in hours
    ):
        raise GuardrailError(
            "Every hour must be an integer."
        )

    if not all(
        0 <= hour <= 23
        for hour in hours
    ):
        raise GuardrailError(
            "Hours must be between 0 and 23."
        )

    if len(hours) != len(set(hours)):
        raise GuardrailError(
            "Hours must be unique."
        )

    if hours != sorted(hours):
        raise GuardrailError(
            "Hours must be sorted ascending."
        )


def validate_number(
    value,
    field_name,
    minimum=None,
    maximum=None,
):

    if (
        not isinstance(value, (int, float))
        or isinstance(value, bool)
    ):
        raise GuardrailError(
            f"{field_name} must be numeric."
        )

    value = float(value)

    if not math.isfinite(value):
        raise GuardrailError(
            f"{field_name} must be finite."
        )

    if (
        minimum is not None
        and value < minimum
    ):
        raise GuardrailError(
            f"{field_name} cannot be below {minimum}."
        )

    if (
        maximum is not None
        and value > maximum
    ):
        raise GuardrailError(
            f"{field_name} cannot exceed {maximum}."
        )


def validate_directives(
    request: OptimizeRequest,
    result: LLMInterpretationBatch,
):

    directives = result.directives

    if len(directives) != len(
        request.operator_notes
    ):
        raise GuardrailError(
            "LLM must return exactly one directive "
            "for each operator note."
        )

    for expected_index, directive in enumerate(
        directives
    ):

        # Correct order/index
        if directive.note_index != expected_index:
            raise GuardrailError(
                "Directive note_index is invalid "
                "or out of order."
            )

        directive_type = directive.directive_type

        if directive_type not in ALLOWED_DIRECTIVES:
            raise GuardrailError(
                "Unsupported directive type."
            )

        adjustment = directive.structured_adjustment


        if directive_type == "no_op":

            if directive.applies is not False:
                raise GuardrailError(
                    "no_op must have applies=false."
                )

            if adjustment is not None:
                raise GuardrailError(
                    "no_op must have "
                    "structured_adjustment=null."
                )

            continue

        if directive.applies is not True:
            raise GuardrailError(
                f"{directive_type} must have "
                "applies=true."
            )

        if not isinstance(adjustment, dict):
            raise GuardrailError(
                f"{directive_type} requires "
                "structured_adjustment."
            )

        # SOLAR REDUCTION

        if directive_type == "solar_reduction":

            allowed_keys = {
                "hours",
                "factor",
            }

            if set(adjustment.keys()) != allowed_keys:
                raise GuardrailError(
                    "Invalid solar_reduction shape."
                )

            validate_hours(
                adjustment["hours"]
            )

            validate_number(
                adjustment["factor"],
                "factor",
                minimum=0,
                maximum=1,
            )

        # MINIMUM BATTERY RESERVE

        elif (
            directive_type
            == "minimum_battery_reserve"
        ):

            allowed_keys = {
                "hours",
                "minimum_energy_kwh",
            }

            if set(adjustment.keys()) != allowed_keys:
                raise GuardrailError(
                    "Invalid minimum_battery_reserve shape."
                )

            validate_hours(
                adjustment["hours"]
            )

            validate_number(
                adjustment[
                    "minimum_energy_kwh"
                ],
                "minimum_energy_kwh",
                minimum=0,
                maximum=request.battery.capacity_kwh,
            )

        # NO CHARGE

        elif directive_type == "no_charge_window":

            allowed_keys = {
                "hours"
            }

            if set(adjustment.keys()) != allowed_keys:
                raise GuardrailError(
                    "Invalid no_charge_window shape."
                )

            validate_hours(
                adjustment["hours"]
            )

        # NO DISCHARGE

        elif (
            directive_type
            == "no_discharge_window"
        ):

            allowed_keys = {
                "hours"
            }

            if set(adjustment.keys()) != allowed_keys:
                raise GuardrailError(
                    "Invalid no_discharge_window shape."
                )

            validate_hours(
                adjustment["hours"]
            )

        # MAX GRID

        elif directive_type == "max_grid_window":

            allowed_keys = {
                "hours",
                "max_grid_kwh",
            }

            if set(adjustment.keys()) != allowed_keys:
                raise GuardrailError(
                    "Invalid max_grid_window shape."
                )

            validate_hours(
                adjustment["hours"]
            )

            validate_number(
                adjustment["max_grid_kwh"],
                "max_grid_kwh",
                minimum=0,
            )

    return result