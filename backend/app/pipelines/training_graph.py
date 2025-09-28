from fastapi import APIRouter, HTTPException
from app.services.training_service import TrainingService

router = APIRouter()
service = TrainingService()


@router.post("/trigger")
def trigger_training():
    try:
        job = service.trigger_training()
        return {"job": job}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
