from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.yolo_service import YoloService
from app.models.schemas import DetectResponse

router = APIRouter()
service = YoloService()


@router.post("/", response_model=DetectResponse)
async def detect(file: UploadFile = File(...)):
    content = await file.read()
    try:
        result = service.infer_bytes(content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
