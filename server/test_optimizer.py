from app.guardrails.validator import validate_directives
from app.llm.interpreter import interpret_operator_notes
from app.optimizer.optimizer import optimize_schedule
from app.schemas import OptimizeRequest
from app.validation.plan_validator import validate_plan


hours = []

for hour in range(24):

    # Cheap electricity at night
    if hour < 6:
        tariff = 5

    # Expensive evening
    elif 17 <= hour <= 21:
        tariff = 20

    else:
        tariff = 10

    # Solar mainly during daytime
    if 8 <= hour <= 16:
        solar = 50
    else:
        solar = 0

    hours.append(
        {
            "hour": hour,
            "demand_kwh": 100,
            "solar_kwh": solar,
            "tariff_bdt_per_kwh": tariff,
        }
    )


request = OptimizeRequest(
    scenario_id="TEST-OPT-001",

    operator_notes=[
        (
            "Expect an 80% reduction in rooftop solar "
            "from 1 PM until 3 PM."
        ),
        (
            "The cafeteria will introduce a new menu "
            "next week."
        ),
    ],

    hours=hours,

    battery={
        "capacity_kwh": 200,
        "initial_energy_kwh": 100,
        "minimum_energy_kwh": 40,
        "max_charge_kwh_per_hour": 50,
        "max_discharge_kwh_per_hour": 50,
    },
)


# 1. Gemini
llm_result = interpret_operator_notes(
    request
)

# 2. Guardrail
validated = validate_directives(
    request,
    llm_result,
)

# 3. Optimizer
result = optimize_schedule(
    request,
    validated,
)


print("\nDIRECTIVES:")
print(
    validated.model_dump_json(indent=2)
)

print("\nHOURLY PLAN:")

for row in result["hourly_plan"]:
    print(row)


print("\nTOTALS:")
print(
    "Total grid:",
    result["total_grid_kwh"],
)

print(
    "Total cost:",
    result["total_cost_bdt"],
)

print(
    "Peak grid:",
    result["peak_grid_kwh"],
)

validate_plan(
    request,
    validated,
    result,
)

print(
    "\nFINAL PLAN VALIDATION PASSED"
)