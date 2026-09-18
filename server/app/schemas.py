from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator

# REQUEST MODELS


class HourData(BaseModel):
    hour: int = Field(ge=0, le=23)
    demand_kwh: float = Field(ge=0)
    solar_kwh: float = Field(ge=0)
    tariff_bdt_per_kwh: float = Field(ge=0)


class BatteryData(BaseModel):
    capacity_kwh: float = Field(gt=0)
    initial_energy_kwh: float = Field(ge=0)
    minimum_energy_kwh: float = Field(ge=0)
    max_charge_kwh_per_hour: float = Field(ge=0)
    max_discharge_kwh_per_hour: float = Field(ge=0)


class OptimizeRequest(BaseModel):
    scenario_id: str

    operator_notes: List[str] = Field(min_length=1, max_length=3)

    hours: List[HourData]

    battery: BatteryData

    @model_validator(mode="after")
    def validate_request(self):

        # Exactly 24 hourly entries
        if len(self.hours) != 24:
            raise ValueError("hours must contain exactly 24 entries")

        hour_numbers = [item.hour for item in self.hours]

        # Must contain each hour 0-23 exactly once
        if sorted(hour_numbers) != list(range(24)):
            raise ValueError("hours must contain unique hour values from 0 to 23")

        # Notes cannot be empty
        for note in self.operator_notes:
            if not note.strip():
                raise ValueError("operator_notes cannot contain empty strings")

        return self


# RESPONSE MODELS


DirectiveType = Literal[
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op",
]


class DirectiveInterpretation(BaseModel):
    note_index: int
    applies: bool
    directive_type: DirectiveType
    structured_adjustment: Optional[dict] = None
    explanation: str


class HourlyPlanEntry(BaseModel):
    hour: int
    grid_kwh: float
    solar_used_kwh: float

    battery_action: Literal["charge", "discharge", "idle"]

    battery_kwh: float
    battery_energy_after_kwh: float


class OptimizeResponse(BaseModel):
    scenario_id: str

    directive_interpretation: List[DirectiveInterpretation]

    hourly_plan: List[HourlyPlanEntry]

    total_grid_kwh: float
    total_cost_bdt: float
    peak_grid_kwh: float

    plan_summary: str
