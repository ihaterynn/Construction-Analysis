from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import detection, vlm, feedback, training, analysis

app = FastAPI(title="Floorplan HITL API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detection.router, prefix="/detect", tags=["detect"])
app.include_router(vlm.router, prefix="/vlm", tags=["vlm"])
app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
app.include_router(training.router, prefix="/training", tags=["training"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])


@app.get("/health")
async def health():
    return {"status": "ok"}
