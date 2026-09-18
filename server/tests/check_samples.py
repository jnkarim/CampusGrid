import json
import math
import sys
import time
from pathlib import Path


# =========================================================
# ADD SERVER ROOT TO PYTHON PATH
# =========================================================

SERVER_ROOT = Path(__file__).resolve().parents[1]

if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))


# =========================================================
# CAMPUSGRID IMPORTS
# =========================================================

from app.graph import campusgrid_graph
from app.schemas import OptimizeRequest


# =========================================================
# SETTINGS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

SAMPLE_FILE = BASE_DIR / "public_sample_cases.json"

# Official numeric comparison tolerance
TOLERANCE = 0.01

# Gemini free-tier protection
# Current quota is low enough that rapid consecutive calls
# can trigger HTTP 429 / RESOURCE_EXHAUSTED.
RATE_LIMIT_DELAY = 15

# If Gemini explicitly rate-limits us, wait longer.
RATE_LIMIT_RETRY_DELAY = 50

MAX_RETRIES = 3


# =========================================================
# HELPERS
# =========================================================

def numbers_equal(a, b):
    """
    Compare numeric values using the allowed tolerance.
    """

    return math.isclose(
        float(a),
        float(b),
        rel_tol=0.0,
        abs_tol=TOLERANCE,
    )


def compare_adjustments(
    actual,
    expected,
):
    """
    Compare machine-readable directive adjustments.

    Explanation text is deliberately NOT compared because
    free-text wording does not need to match exactly.
    """

    if actual is None or expected is None:
        return (
            actual is None
            and expected is None
        )

    if not isinstance(actual, dict):
        return False

    if not isinstance(expected, dict):
        return False

    # Exact adjustment shape
    if set(actual.keys()) != set(
        expected.keys()
    ):
        return False

    for key in expected:

        actual_value = actual[key]
        expected_value = expected[key]

        # ---------------------------------------------
        # Hours must match exactly
        # ---------------------------------------------

        if key == "hours":

            if actual_value != expected_value:
                return False

        # ---------------------------------------------
        # Numeric values use tolerance
        # ---------------------------------------------

        elif (
            isinstance(
                expected_value,
                (int, float),
            )
            and not isinstance(
                expected_value,
                bool,
            )
        ):

            if not numbers_equal(
                actual_value,
                expected_value,
            ):
                return False

        # ---------------------------------------------
        # Other values exact match
        # ---------------------------------------------

        else:

            if actual_value != expected_value:
                return False

    return True


def compare_directives(
    actual_batch,
    expected_list,
):
    """
    Compare CampusGrid's LLM interpretation against
    the official public reference semantics.
    """

    actual_list = (
        actual_batch.directives
    )

    # ---------------------------------------------
    # Directive count
    # ---------------------------------------------

    if len(actual_list) != len(
        expected_list
    ):
        return False, (
            f"Directive count mismatch: "
            f"{len(actual_list)} != "
            f"{len(expected_list)}"
        )

    # ---------------------------------------------
    # Compare each note
    # ---------------------------------------------

    for index, expected in enumerate(
        expected_list
    ):

        actual = actual_list[index]

        # note_index
        if (
            actual.note_index
            != expected["note_index"]
        ):
            return False, (
                f"note_index mismatch "
                f"at directive {index}: "
                f"{actual.note_index} != "
                f"{expected['note_index']}"
            )

        # applies
        if (
            actual.applies
            != expected["applies"]
        ):
            return False, (
                f"applies mismatch "
                f"at directive {index}: "
                f"{actual.applies} != "
                f"{expected['applies']}"
            )

        # directive_type
        if (
            actual.directive_type
            != expected["directive_type"]
        ):
            return False, (
                f"directive_type mismatch "
                f"at directive {index}: "
                f"{actual.directive_type} != "
                f"{expected['directive_type']}"
            )

        # structured_adjustment
        if not compare_adjustments(
            actual.structured_adjustment,
            expected[
                "structured_adjustment"
            ],
        ):
            return False, (
                f"structured_adjustment mismatch "
                f"at directive {index}\n"
                f"Actual: "
                f"{actual.structured_adjustment}\n"
                f"Expected: "
                f"{expected['structured_adjustment']}"
            )

    return (
        True,
        "Directive semantics match",
    )


# =========================================================
# LANGGRAPH WITH GEMINI RATE-LIMIT RETRY
# =========================================================

def run_graph_with_retry(
    request: OptimizeRequest,
):
    """
    Run CampusGrid LangGraph.

    If Gemini returns HTTP 429 / RESOURCE_EXHAUSTED,
    wait and retry.

    This retry logic is for the local public sample
    test runner only.
    """

    for attempt in range(
        1,
        MAX_RETRIES + 1,
    ):

        try:

            return campusgrid_graph.invoke(
                {
                    "request": request
                }
            )

        except Exception as exc:

            message = str(exc)

            is_rate_limit = (
                "429" in message
                or "RESOURCE_EXHAUSTED"
                in message
                or "quota" in message.lower()
            )

            # Not a rate-limit problem.
            # Let the real error propagate.
            if not is_rate_limit:
                raise

            # Last attempt failed.
            if attempt >= MAX_RETRIES:
                raise

            print(
                f"     Gemini rate limit hit "
                f"(attempt {attempt}/"
                f"{MAX_RETRIES})."
            )

            print(
                f"     Waiting "
                f"{RATE_LIMIT_RETRY_DELAY} "
                f"seconds before retry..."
            )

            time.sleep(
                RATE_LIMIT_RETRY_DELAY
            )

    raise RuntimeError(
        "Unexpected retry state."
    )


# =========================================================
# LOAD PUBLIC SAMPLE FILE
# =========================================================

if not SAMPLE_FILE.exists():

    raise FileNotFoundError(
        f"Sample file not found: "
        f"{SAMPLE_FILE}"
    )


with open(
    SAMPLE_FILE,
    "r",
    encoding="utf-8",
) as file:

    sample_pack = json.load(
        file
    )


if "cases" not in sample_pack:

    raise ValueError(
        "Sample JSON does not contain "
        "a 'cases' array."
    )


cases = sample_pack["cases"]


# =========================================================
# HEADER
# =========================================================

print()
print(
    "========================================"
)
print(
    "CampusGrid Public Sample Test"
)
print(
    "========================================"
)

print(
    f"Cases found: {len(cases)}"
)

print(
    f"Gemini delay between cases: "
    f"{RATE_LIMIT_DELAY}s"
)

print()


# =========================================================
# TEST COUNTERS
# =========================================================

passed = 0
failed = 0


# =========================================================
# RUN ALL PUBLIC CASES
# =========================================================

for case_number, case in enumerate(
    cases,
    start=1,
):

    case_id = case["id"]

    label = case.get(
        "label",
        "",
    )

    case_input = case[
        "input"
    ]

    expected = case[
        "expected_output"
    ]

    print(
        f"Running {case_id}: "
        f"{label}"
    )

    try:

        # =============================================
        # STEP 1
        # Validate official request against
        # CampusGrid request schema
        # =============================================

        request = OptimizeRequest(
            **case_input
        )

        # =============================================
        # STEP 2
        # Run complete LangGraph workflow
        #
        # Gemini
        #   ↓
        # Guardrail
        #   ↓
        # Optimizer
        #   ↓
        # Final Validator
        # =============================================

        result = run_graph_with_retry(
            request
        )

        # =============================================
        # STEP 3
        # Extract results
        # =============================================

        actual_directives = result[
            "validated_directives"
        ]

        optimization_result = result[
            "optimization_result"
        ]

        # =============================================
        # STEP 4
        # Check directive interpretation
        # =============================================

        (
            directives_ok,
            directive_message,
        ) = compare_directives(
            actual_directives,
            expected[
                "directive_interpretation"
            ],
        )

        if not directives_ok:

            raise AssertionError(
                directive_message
            )

        # =============================================
        # STEP 5
        # Check optimization cost
        #
        # Equivalent optimal hourly schedules are
        # allowed, so we check optimal cost rather
        # than exact hourly action sequence.
        # =============================================

        actual_cost = (
            optimization_result[
                "total_cost_bdt"
            ]
        )

        expected_cost = (
            expected[
                "total_cost_bdt"
            ]
        )

        if not numbers_equal(
            actual_cost,
            expected_cost,
        ):

            raise AssertionError(
                f"Cost mismatch: "
                f"{actual_cost} != "
                f"{expected_cost}"
            )

        # =============================================
        # STEP 6
        # Check hourly plan length
        # =============================================

        hourly_plan = (
            optimization_result[
                "hourly_plan"
            ]
        )

        if len(hourly_plan) != 24:

            raise AssertionError(
                "hourly_plan does not "
                "contain exactly 24 entries."
            )

        # =============================================
        # STEP 7
        # Check hours 0 through 23
        # =============================================

        returned_hours = [
            row["hour"]
            for row in hourly_plan
        ]

        if returned_hours != list(
            range(24)
        ):

            raise AssertionError(
                "hourly_plan hours are not "
                "0 through 23 in order."
            )

        # =============================================
        # STEP 8
        # Check end-of-day battery neutrality
        # =============================================

        final_battery = (
            hourly_plan[-1][
                "battery_energy_after_kwh"
            ]
        )

        initial_battery = (
            request.battery
            .initial_energy_kwh
        )

        if not numbers_equal(
            final_battery,
            initial_battery,
        ):

            raise AssertionError(
                "End-of-day battery "
                "neutrality failed: "
                f"{final_battery} != "
                f"{initial_battery}"
            )

        # =============================================
        # STEP 9
        # Check total grid
        # =============================================

        calculated_grid = sum(
            row["grid_kwh"]
            for row in hourly_plan
        )

        actual_grid = (
            optimization_result[
                "total_grid_kwh"
            ]
        )

        if not numbers_equal(
            calculated_grid,
            actual_grid,
        ):

            raise AssertionError(
                "total_grid_kwh does not "
                "match hourly_plan."
            )

        # =============================================
        # STEP 10
        # Check peak grid
        # =============================================

        calculated_peak = max(
            row["grid_kwh"]
            for row in hourly_plan
        )

        actual_peak = (
            optimization_result[
                "peak_grid_kwh"
            ]
        )

        if not numbers_equal(
            calculated_peak,
            actual_peak,
        ):

            raise AssertionError(
                "peak_grid_kwh does not "
                "match hourly_plan."
            )

        # =============================================
        # PASS
        # =============================================

        passed += 1

        print(
            f"PASS {case_id} "
            f"cost={actual_cost:.2f} BDT"
        )

    except Exception as exc:

        # =============================================
        # FAIL
        # =============================================

        failed += 1

        print(
            f"FAIL {case_id}"
        )

        print(
            f"     "
            f"{type(exc).__name__}: "
            f"{exc}"
        )

    print()

    # =================================================
    # THROTTLE GEMINI BETWEEN CASES
    #
    # Do not sleep after the final case.
    # =================================================

    if case_number < len(cases):

        print(
            f"Waiting {RATE_LIMIT_DELAY}s "
            f"before next Gemini request..."
        )

        print()

        time.sleep(
            RATE_LIMIT_DELAY
        )


# =========================================================
# SUMMARY
# =========================================================

print(
    "========================================"
)

print(
    "RESULT"
)

print(
    "========================================"
)

print(
    f"Passed: "
    f"{passed}/{len(cases)}"
)

print(
    f"Failed: "
    f"{failed}/{len(cases)}"
)

print()


# =========================================================
# FINAL RESULT
# =========================================================

if failed == 0:

    print(
        "ALL PUBLIC SAMPLE CASES "
        "PASSED ✅"
    )

else:

    print(
        "SOME PUBLIC SAMPLE CASES "
        "FAILED ❌"
    )

    raise SystemExit(1)