from app.graph import campusgrid_graph
from app.schemas import OptimizeRequest


# =========================================================
# CREATE 24-HOUR TEST DATA
# =========================================================

hours = []

for hour in range(24):

    # Cheap electricity at night
    if hour < 6:
        tariff = 5

    # Expensive electricity in the evening
    elif 17 <= hour <= 21:
        tariff = 20

    else:
        tariff = 10

    # Solar available during daytime
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


# =========================================================
# CREATE TEST REQUEST
# =========================================================

request = OptimizeRequest(
    scenario_id="TEST-GRAPH-001",

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


# =========================================================
# RUN LANGGRAPH
# =========================================================

print("\nRunning CampusGrid LangGraph...\n")

result = campusgrid_graph.invoke(
    {
        "request": request
    }
)


# =========================================================
# DIRECTIVE RESULTS
# =========================================================

print("========================================")
print("DIRECTIVES")
print("========================================")

print(
    result[
        "validated_directives"
    ].model_dump_json(indent=2)
)


# =========================================================
# OPTIMIZATION RESULT
# =========================================================

optimization_result = result[
    "optimization_result"
]


print("\n========================================")
print("HOURLY PLAN")
print("========================================")

for row in optimization_result["hourly_plan"]:
    print(row)


# =========================================================
# TOTALS
# =========================================================

print("\n========================================")
print("TOTALS")
print("========================================")

print(
    "Total grid:",
    optimization_result["total_grid_kwh"],
    "kWh"
)

print(
    "Total cost:",
    optimization_result["total_cost_bdt"],
    "BDT"
)

print(
    "Peak grid:",
    optimization_result["peak_grid_kwh"],
    "kWh"
)


# =========================================================
# FINAL CHECK
# =========================================================

final_battery = optimization_result[
    "hourly_plan"
][-1]["battery_energy_after_kwh"]

print(
    "Final battery:",
    final_battery,
    "kWh"
)


print("\n========================================")
print("LANGGRAPH COMPLETE ✅")
print("========================================")