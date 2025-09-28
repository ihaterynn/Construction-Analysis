from fastapi import APIRouter, HTTPException
from app.models.schemas import FeedbackIn
from app.services.training_service import TrainingService

router = APIRouter()
train_svc = TrainingService()


@router.post("/")
async def submit_feedback(payload: FeedbackIn):
    try:
        train_svc.save_feedback(payload)
        return {"status": "saved", "id": payload.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
