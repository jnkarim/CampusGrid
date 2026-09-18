from typing import List, Literal

from pydantic import BaseModel, Field


DirectiveType = Literal[
    "solar_reduction",
    "minimum_battery_reserve",
    "no_charge_window",
    "no_discharge_window",
    "max_grid_window",
    "no_op",
]


class LLMDirective(BaseModel):
    note_index: int = Field(
        description="Zero-based index of the operator note."
    )

    applies: bool = Field(
        description=(
            "False only for no_op. "
            "True for every applicable directive."
        )
    )

    directive_type: DirectiveType

    structured_adjustment: dict | None = Field(
        description=(
            "Machine-readable adjustment for the selected directive. "
            "Must be null only for no_op."
        )
    )

    explanation: str = Field(
        description="Short explanation of the interpretation."
    )


class LLMInterpretationBatch(BaseModel):
    directives: List[LLMDirective] = Field(
        description=(
            "Exactly one interpretation for each operator note "
            "in note_index order."
        )
    )