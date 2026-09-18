from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.graph import campusgrid_graph

from app.schemas import (
    OptimizeRequest,
    OptimizeResponse,
    DirectiveInterpretation,
    HourlyPlanEntry,
)

from app.guardrails.validator import GuardrailError
from app.optimizer.optimizer import OptimizationError
from app.validation.plan_validator import PlanValidationError

# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="CampusGrid",
    description="LLM-assisted campus energy optimization API",
    version="1.0.0",
)


# =========================================================
# CORS
#
# Required because React/Vite frontend runs on a different
# origin from FastAPI during development and deployment.
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST VALIDATION ERROR HANDLER
#
# FastAPI normally returns HTTP 422 for request validation.
# CampusGrid returns HTTP 400 for malformed or structurally
# invalid requests.
# =========================================================


@app.exception_handler(RequestValidationError)
async def request_validation_handler(
    request: Request,
    exc: RequestValidationError,
):
    return JSONResponse(
        status_code=400,
        content={"detail": ("Malformed or structurally invalid request.")},
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
    return {"status": "ok"}


# =========================================================
# OPTIMIZE ENERGY
# =========================================================


@app.post(
    "/optimize-energy",
    response_model=OptimizeResponse,
)
def optimize_energy(request: OptimizeRequest):
    try:

        # =================================================
        # STEP 1
        # Run complete CampusGrid LangGraph workflow
        #
        # Request
        #   ↓
        # Gemini interpretation
        #   ↓
        # Deterministic guardrails
        #   ↓
        # PuLP optimizer
        #   ↓
        # Final plan validation
        # =================================================

        graph_result = campusgrid_graph.invoke({"request": request})

        # =================================================
        # STEP 2
        # Extract validated directive interpretations
        # =================================================

        validated_directives = graph_result["validated_directives"]

        # =================================================
        # STEP 3
        # Extract optimization result
        # =================================================

        optimization_result = graph_result["optimization_result"]

        # =================================================
        # STEP 4
        # Convert directives to official API schema
        # =================================================

        directive_interpretation = [
            DirectiveInterpretation(**directive.model_dump())
            for directive in validated_directives.directives
        ]

        # =================================================
        # STEP 5
        # Convert hourly plan to official API schema
        # =================================================

        hourly_plan = [
            HourlyPlanEntry(**row) for row in optimization_result["hourly_plan"]
        ]

        # =================================================
        # STEP 6
        # Count applicable directives
        # =================================================

        applicable_count = sum(
            1 for directive in validated_directives.directives if directive.applies
        )

        # =================================================
        # STEP 7
        # Deterministic human-readable plan summary
        # =================================================

        plan_summary = (
            f"CampusGrid optimized the 24-hour schedule "
            f"after applying {applicable_count} "
            f"operator directive(s). "
            f"Total grid usage is "
            f"{optimization_result['total_grid_kwh']:.2f} kWh "
            f"at a total cost of "
            f"{optimization_result['total_cost_bdt']:.2f} BDT."
        )

        # =================================================
        # STEP 8
        # Return official response
        # =================================================

        return OptimizeResponse(
            scenario_id=request.scenario_id,
            directive_interpretation=(directive_interpretation),
            hourly_plan=hourly_plan,
            total_grid_kwh=(optimization_result["total_grid_kwh"]),
            total_cost_bdt=(optimization_result["total_cost_bdt"]),
            peak_grid_kwh=(optimization_result["peak_grid_kwh"]),
            plan_summary=plan_summary,
        )

    # =====================================================
    # SAFE ERROR HANDLING
    # =====================================================

    except GuardrailError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Operator directive interpretation " "failed deterministic validation."
            ),
        )

    except OptimizationError:
        raise HTTPException(
            status_code=422,
            detail=("No valid optimization schedule " "could be produced."),
        )

    except PlanValidationError:
        raise HTTPException(
            status_code=500,
            detail=("Generated schedule failed " "final validation."),
        )

    except HTTPException:
        raise

    except Exception as exc:
        import traceback

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )