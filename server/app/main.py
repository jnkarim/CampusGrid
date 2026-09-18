from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas import (
    OptimizeRequest,
    OptimizeResponse,
    DirectiveInterpretation,
    HourlyPlanEntry,
)

from app.llm.interpreter import interpret_operator_notes

from app.guardrails.validator import (
    validate_directives,
    GuardrailError,
)

from app.optimizer.optimizer import (
    optimize_schedule,
    OptimizationError,
)

from app.validation.plan_validator import (
    validate_plan,
    PlanValidationError,
)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="CampusGrid",
    description=(
        "LLM-assisted campus energy optimization API"
    ),
    version="1.0.0",
)


# =========================================================
# REQUEST VALIDATION ERROR
#
# FastAPI normally returns 422 automatically.
# GridWise requires structurally invalid requests to use 400.
# =========================================================

@app.exception_handler(RequestValidationError)
async def request_validation_handler(
    request: Request,
    exc: RequestValidationError,
):

    return JSONResponse(
        status_code=400,
        content={
            "detail": "Malformed or structurally invalid request."
        },
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "service": "CampusGrid",
        "status": "running",
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "ok"
    }


# =========================================================
# OPTIMIZE ENERGY
# =========================================================

@app.post(
    "/optimize-energy",
    response_model=OptimizeResponse,
)
def optimize_energy(
    request: OptimizeRequest
):

    try:

        # -------------------------------------------------
        # STEP 1
        # LLM interprets operator notes
        # -------------------------------------------------

        llm_result = interpret_operator_notes(
            request
        )

        # -------------------------------------------------
        # STEP 2
        # Deterministic guardrail validates LLM output
        # -------------------------------------------------

        validated_directives = (
            validate_directives(
                request,
                llm_result,
            )
        )

        # -------------------------------------------------
        # STEP 3
        # Mathematical optimization
        # -------------------------------------------------

        optimization_result = (
            optimize_schedule(
                request,
                validated_directives,
            )
        )

        # -------------------------------------------------
        # STEP 4
        # Independently validate final plan
        # -------------------------------------------------

        validate_plan(
            request,
            validated_directives,
            optimization_result,
        )

        # -------------------------------------------------
        # STEP 5
        # Convert directives to API models
        # -------------------------------------------------

        directive_interpretation = [
            DirectiveInterpretation(
                **directive.model_dump()
            )
            for directive
            in validated_directives.directives
        ]

        # -------------------------------------------------
        # STEP 6
        # Convert hourly plan to API models
        # -------------------------------------------------

        hourly_plan = [
            HourlyPlanEntry(
                **row
            )
            for row
            in optimization_result[
                "hourly_plan"
            ]
        ]

        # -------------------------------------------------
        # STEP 7
        # Deterministic human-readable summary
        # -------------------------------------------------

        applicable_count = sum(
            1
            for directive
            in validated_directives.directives
            if directive.applies
        )

        plan_summary = (
            f"CampusGrid optimized the 24-hour schedule "
            f"after applying {applicable_count} "
            f"operator directive(s). "
            f"Total grid usage is "
            f"{optimization_result['total_grid_kwh']:.2f} kWh "
            f"at a total cost of "
            f"{optimization_result['total_cost_bdt']:.2f} BDT."
        )

        # -------------------------------------------------
        # STEP 8
        # Official API response
        # -------------------------------------------------

        return OptimizeResponse(
            scenario_id=request.scenario_id,

            directive_interpretation=(
                directive_interpretation
            ),

            hourly_plan=hourly_plan,

            total_grid_kwh=(
                optimization_result[
                    "total_grid_kwh"
                ]
            ),

            total_cost_bdt=(
                optimization_result[
                    "total_cost_bdt"
                ]
            ),

            peak_grid_kwh=(
                optimization_result[
                    "peak_grid_kwh"
                ]
            ),

            plan_summary=plan_summary,
        )

    # =====================================================
    # SAFE FAILURES
    # =====================================================

    except GuardrailError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Operator directive interpretation "
                "failed deterministic validation."
            ),
        )

    except OptimizationError:
        raise HTTPException(
            status_code=422,
            detail=(
                "No valid optimization schedule "
                "could be produced."
            ),
        )

    except PlanValidationError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Generated schedule failed "
                "final validation."
            ),
        )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail=(
                "CampusGrid encountered a controlled "
                "internal processing error."
            ),
        )