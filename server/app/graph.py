from typing import NotRequired, TypedDict

from app.schemas import OptimizeRequest
from app.llm.models import LLMInterpretationBatch

from app.llm.interpreter import (
    interpret_operator_notes,
)

from app.guardrails.validator import (
    validate_directives,
)

from app.optimizer.optimizer import (
    optimize_schedule,
)

from app.validation.plan_validator import (
    validate_plan,
)

from langgraph.graph import (
    StateGraph,
    START,
    END,
)


class CampusGridState(TypedDict):

    request: OptimizeRequest

    llm_result: NotRequired[LLMInterpretationBatch]

    validated_directives: NotRequired[LLMInterpretationBatch]

    optimization_result: NotRequired[dict]


def interpret_node(state: CampusGridState):

    request = state["request"]

    result = interpret_operator_notes(request)

    return {"llm_result": result}


def guardrail_node(state: CampusGridState):

    request = state["request"]
    llm_result = state["llm_result"]

    validated = validate_directives(
        request,
        llm_result,
    )

    return {"validated_directives": validated}


def optimizer_node(state: CampusGridState):

    request = state["request"]

    directives = state["validated_directives"]

    result = optimize_schedule(
        request,
        directives,
    )

    return {"optimization_result": result}


def final_validation_node(state: CampusGridState):

    request = state["request"]

    directives = state["validated_directives"]

    result = state["optimization_result"]

    validate_plan(
        request,
        directives,
        result,
    )

    return {}


def build_campusgrid_graph():

    builder = StateGraph(CampusGridState)

    builder.add_node(
        "interpret_notes",
        interpret_node,
    )

    builder.add_node(
        "validate_directives",
        guardrail_node,
    )

    builder.add_node(
        "optimize_schedule",
        optimizer_node,
    )

    builder.add_node(
        "validate_plan",
        final_validation_node,
    )

    builder.add_edge(
        START,
        "interpret_notes",
    )

    builder.add_edge(
        "interpret_notes",
        "validate_directives",
    )

    builder.add_edge(
        "validate_directives",
        "optimize_schedule",
    )

    builder.add_edge(
        "optimize_schedule",
        "validate_plan",
    )

    builder.add_edge(
        "validate_plan",
        END,
    )

    return builder.compile()


campusgrid_graph = build_campusgrid_graph()
