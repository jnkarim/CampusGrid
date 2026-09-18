# CampusGrid

**CampusGrid** is an LLM-assisted campus energy optimization system built for the **BUP CSE Fest 2026 Hackathon — Smart Campus Energy Optimization Challenge**.

It accepts a 24-hour energy scenario plus 1–3 natural-language operator notes, interprets those notes into machine-checkable directives with Gemini, validates them deterministically, optimizes the hourly schedule with PuLP, validates the final plan again, and returns a structured JSON response.

---

## Architecture

```text
24-Hour Energy Data + Operator Notes
                |
                v
        Gemini LLM Interpreter
                |
                v
     Deterministic Guardrails
                |
                v
        LangGraph Workflow
                |
                v
          PuLP Optimizer
                |
                v
       Final Plan Validator
                |
                v
        FastAPI JSON Response
```

The LLM is used only for natural-language interpretation. All directive validation, optimization, energy accounting, and final schedule verification are deterministic.

---

## Key Features

- LLM-based interpretation of operator notes
- Supports all six official directive types:
  - `solar_reduction`
  - `minimum_battery_reserve`
  - `no_charge_window`
  - `no_discharge_window`
  - `max_grid_window`
  - `no_op`
- Deterministic guardrails for LLM output
- 24-hour linear-programming optimization with PuLP
- Battery state, rate-limit, energy-balance, solar, grid-cap, and reserve validation
- End-of-day battery neutrality
- Final deterministic schedule replay
- LangGraph orchestration
- FastAPI public API
- React + Vite + Tailwind CSS dashboard
- Recharts-based energy visualization
- Public sample-case test runner

---

## Tech Stack

### Backend
- Python 3.11
- FastAPI
- Uvicorn
- Pydantic
- LangChain
- LangGraph
- `langchain-google-genai`
- Gemini 3.5 Flash Lite
- PuLP
- python-dotenv

### Frontend
- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React

---

## Project Structure

```text
CampusGrid/
|
|-- client/
|   |-- src/
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- .env
|   |-- package.json
|   `-- vite.config.js
|
|-- server/
|   |-- app/
|   |   |-- llm/
|   |   |   |-- interpreter.py
|   |   |   |-- models.py
|   |   |   `-- prompts.py
|   |   |-- guardrails/
|   |   |   `-- validator.py
|   |   |-- optimizer/
|   |   |   `-- optimizer.py
|   |   |-- validation/
|   |   |   `-- plan_validator.py
|   |   |-- graph.py
|   |   |-- main.py
|   |   `-- schemas.py
|   |
|   |-- tests/
|   |   |-- check_samples.py
|   |   `-- public_sample_cases.json
|   |
|   |-- .env
|   |-- .env.example
|   |-- requirements.txt
|   |-- test_graph.py
|   `-- test_optimizer.py
|
|-- .gitignore
`-- README.md
```

---

## Environment Variables

Create:

```text
server/.env
```

with:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

Do **not** commit real API keys or `.env` files.

For the frontend, create:

```text
client/.env
```

with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For deployment, replace the value with the public backend URL.

---

# Local Quickstart

## 1. Backend

From the repository root:

```powershell
cd server
```

Create a virtual environment:

```powershell
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create `server/.env`:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

Start the API:

```powershell
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

---

## 2. Frontend

Open another terminal:

```powershell
cd client
npm install
npm run dev
```

The Vite frontend normally runs at:

```text
http://localhost:5173
```

---

# API Contract

## Health

```http
GET /health
```

Expected response:

```json
{
  "status": "ok"
}
```

Curl:

```bash
curl http://127.0.0.1:8000/health
```

---

## Optimize Energy

```http
POST /optimize-energy
Content-Type: application/json
```

A request contains:

- `scenario_id`
- `operator_notes`
- exactly 24 hourly entries
- battery configuration

Example request:

```json
{
  "scenario_id": "CAMPUSGRID-DEMO-001",
  "operator_notes": [
    "Expect an 80% reduction in rooftop solar from 1 PM until 3 PM.",
    "The cafeteria will introduce a new menu next week."
  ],
  "hours": [
    {"hour":0,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":5},
    {"hour":1,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":5},
    {"hour":2,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":5},
    {"hour":3,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":5},
    {"hour":4,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":5},
    {"hour":5,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":5},
    {"hour":6,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":10},
    {"hour":7,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":10},
    {"hour":8,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":9,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":10,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":11,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":12,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":13,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":14,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":15,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":16,"demand_kwh":100,"solar_kwh":50,"tariff_bdt_per_kwh":10},
    {"hour":17,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":20},
    {"hour":18,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":20},
    {"hour":19,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":20},
    {"hour":20,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":20},
    {"hour":21,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":20},
    {"hour":22,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":10},
    {"hour":23,"demand_kwh":100,"solar_kwh":0,"tariff_bdt_per_kwh":10}
  ],
  "battery": {
    "capacity_kwh": 200,
    "initial_energy_kwh": 100,
    "minimum_energy_kwh": 40,
    "max_charge_kwh_per_hour": 50,
    "max_discharge_kwh_per_hour": 50
  }
}
```

A successful response contains:

```json
{
  "scenario_id": "CAMPUSGRID-DEMO-001",
  "directive_interpretation": [],
  "hourly_plan": [],
  "total_grid_kwh": 0,
  "total_cost_bdt": 0,
  "peak_grid_kwh": 0,
  "plan_summary": "..."
}
```

The actual arrays and numeric values depend on the submitted scenario.

---

# Supported Directives

## `solar_reduction`

```json
{
  "hours": [13, 14],
  "factor": 0.2
}
```

`factor` is the fraction of solar that remains.  
Example: an 80% reduction means `factor = 0.2`.

## `minimum_battery_reserve`

```json
{
  "hours": [18, 19, 20],
  "minimum_energy_kwh": 120
}
```

## `no_charge_window`

```json
{
  "hours": [14, 15]
}
```

## `no_discharge_window`

```json
{
  "hours": [18, 19]
}
```

## `max_grid_window`

```json
{
  "hours": [19, 20],
  "max_grid_kwh": 150
}
```

## `no_op`

```json
null
```

Irrelevant notes use:

```json
{
  "applies": false,
  "directive_type": "no_op",
  "structured_adjustment": null
}
```

---

# Optimization Model

CampusGrid minimizes total grid electricity cost:

```text
sum(grid_kwh[h] * tariff_bdt_per_kwh[h])
```

for all 24 hours.

The optimizer enforces:

- hourly energy balance
- battery capacity bounds
- minimum reserve
- maximum hourly charge rate
- maximum hourly discharge rate
- effective solar availability
- no grid export
- directive-specific restrictions
- final battery energy equal to initial battery energy

---

# Deterministic Guardrails

The LLM output is treated as untrusted structured data.

Before optimization, CampusGrid validates:

- one interpretation for every operator note
- correct `note_index` ordering
- supported directive type only
- correct `applies` semantics
- exact `structured_adjustment` shape
- valid hours from `0` to `23`
- unique ascending hours
- `solar_reduction.factor` in `[0, 1]`
- finite, non-negative reserve/grid-cap values
- battery reserve not above battery capacity

If LLM output is malformed or unsupported, the API fails in a controlled way rather than silently inventing constraints.

---

# Final Plan Validation

After PuLP creates the schedule, CampusGrid replays the plan and checks:

- exactly 24 hourly rows
- hours 0 through 23
- non-negative grid and solar values
- solar usage does not exceed effective solar
- correct battery action semantics
- battery state transitions
- battery minimum and capacity
- hourly charge/discharge limits
- applicable no-charge/no-discharge windows
- applicable grid caps
- energy balance every hour
- end-of-day battery neutrality
- recalculated total grid consumption
- recalculated total cost
- recalculated peak grid usage

---

# Testing

## LangGraph workflow

```powershell
cd server
python test_graph.py
```

Expected ending:

```text
LANGGRAPH COMPLETE ✅
```

## Optimizer and final validator

```powershell
python test_optimizer.py
```

Expected ending:

```text
FINAL PLAN VALIDATION PASSED
```

## Public sample pack

```powershell
python tests\check_samples.py
```

Current verified result:

```text
Passed: 10/10
Failed: 0/10

ALL PUBLIC SAMPLE CASES PASSED ✅
```

The local public-sample runner deliberately spaces model calls to avoid hosted-model rate-limit bursts.

---

# HTTP Error Handling

CampusGrid uses controlled failures:

| Status | Meaning |
|---|---|
| `200` | Successful health or optimization response |
| `400` | Malformed or structurally invalid request |
| `422` | Well-formed request that cannot produce a valid schedule |
| `500` | Controlled internal processing failure |

Raw stack traces and secrets should not be exposed in production responses.

---

# Deployment

## Backend

The API must bind to `0.0.0.0` when deployed.

Example production command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Recommended environment variables:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash-lite
```

### Live API

```text
TODO: add deployed backend URL
```

### Health Endpoint

```text
TODO: add deployed /health URL
```

### Swagger

```text
TODO: add deployed /docs URL
```

---

# Docker Fallback

If using the provided Docker fallback, the container should expose the API on `0.0.0.0` and must receive secrets through environment variables rather than baking them into the image.

Example:

```bash
docker pull YOUR_REGISTRY/CampusGrid:latest
```

```bash
docker run \
  -p 8000:8000 \
  -e GEMINI_API_KEY="YOUR_KEY" \
  -e GEMINI_MODEL="gemini-3.5-flash-lite" \
  YOUR_REGISTRY/CampusGrid:latest
```

Docker image:

```text
TODO: add exact registry tag or digest
```

---

# Security

- API keys are loaded from environment variables.
- `.env` files must not be committed.
- No live campus, personal, utility-account, or billing data is used.
- Raw stack traces and secret values should not be exposed through API responses.
- Public challenge data is synthetic.

---

# Known Limitations

- The system depends on the configured Gemini API being available.
- Hosted model rate limits and quotas may affect bursts of repeated requests.
- The optimizer assumes the challenge's published battery model and does not add battery-efficiency losses that are not part of the specification.
- The frontend is a demonstration dashboard; the judging contract is the HTTP API.
- Public sample cases are validation examples and are not the hidden evaluation set.

---

# Dependencies / External Tools

CampusGrid uses open-source frameworks and external services including:

- FastAPI
- Uvicorn
- Pydantic
- LangChain
- LangGraph
- Google Gemini API
- PuLP / CBC
- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React

---

# Submission Links

| Item | Link |
|---|---|
| Live API | `TODO` |
| GitHub Repository | `TODO` |
| Docker Image | `TODO` |
| Demo Video | `TODO` |

---

## Team

```text
Team Name: TODO
Members:
- TODO
- TODO
- TODO
```

---

## CampusGrid

**Natural-language operator intent → deterministic validation → mathematical optimization → verified energy schedule.**
