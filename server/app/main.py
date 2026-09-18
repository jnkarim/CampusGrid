from fastapi import FastAPI, HTTPException

from app.schemas import OptimizeRequest, OptimizeResponse

app = FastAPI(
    title="CampusGrid",
    description="LLM-assisted campus energy optimization API",
    version="1.0.0",
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/optimize-energy", response_model=OptimizeResponse)
def optimize_energy(request: OptimizeRequest):

    raise HTTPException(
        status_code=501,
        detail="CampusGrid optimization pipeline is not implemented yet.",
    )
