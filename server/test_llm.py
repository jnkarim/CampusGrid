from app.llm.interpreter import interpret_operator_notes
from app.schemas import OptimizeRequest


hours = []

for hour in range(24):
    hours.append(
        {
            "hour": hour,
            "demand_kwh": 100,
            "solar_kwh": 50,
            "tariff_bdt_per_kwh": 10,
        }
    )


request = OptimizeRequest(
    scenario_id="TEST-001",

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


result = interpret_operator_notes(request)

print(
    result.model_dump_json(indent=2)
)