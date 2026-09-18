import json
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.llm.models import LLMInterpretationBatch
from app.llm.prompts import SYSTEM_PROMPT
from app.schemas import OptimizeRequest

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")


def get_llm():

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    return ChatGoogleGenerativeAI(
        model=model_name,
        api_key=api_key,
        temperature=0,
        max_retries=2,
    )


# Interpret operator notes


def interpret_operator_notes(request: OptimizeRequest) -> LLMInterpretationBatch:

    llm = get_llm()

    structured_llm = llm.with_structured_output(
        LLMInterpretationBatch, method="json_schema"
    )

    # Battery information that may be needed by the LLM
    battery_data = {
        "capacity_kwh": request.battery.capacity_kwh,
        "initial_energy_kwh": request.battery.initial_energy_kwh,
        "minimum_energy_kwh": request.battery.minimum_energy_kwh,
        "max_charge_kwh_per_hour": request.battery.max_charge_kwh_per_hour,
        "max_discharge_kwh_per_hour": request.battery.max_discharge_kwh_per_hour,
    }

    # Preserve original note indexes
    notes = [
        {
            "note_index": index,
            "text": note,
        }
        for index, note in enumerate(request.operator_notes)
    ]

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"""
Interpret the operator notes below.

Battery information:
{json.dumps(battery_data, indent=2)}

Operator notes:
{json.dumps(notes, indent=2)}

Return exactly one directive interpretation
for every operator note.
"""),
    ]

    result = structured_llm.invoke(messages)

    return result
