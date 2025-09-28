from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from app.services.vlm_service import VLMService

router = APIRouter()
service = VLMService()


class VLMRequest(BaseModel):
    instruction: str


@router.post("/query")
async def query(file: UploadFile = File(...), instruction: str = Form(...)):
    content = await file.read()
    try:
        answer = service.answer_bytes(content, instruction)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload_adapter")
async def reload_adapter(path: str = Form(...)):
    try:
        service.load_adapter(path)
        return {"status": "adapter_loaded", "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
