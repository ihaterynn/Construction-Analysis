from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime
from app.models.schemas import AnalysisResult, AnalysisListResponse, DetectResponse
from app.services.analysis_service import AnalysisService
import uuid
import json

router = APIRouter()
analysis_service = AnalysisService()

@router.get("/", response_model=AnalysisListResponse)
async def get_analyses(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "date"
):
    """Get all analysis results with optional filtering and sorting"""
    try:
        analyses = analysis_service.get_all_analyses(search, status, sort_by)
        return AnalysisListResponse(analyses=analyses)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{analysis_id}", response_model=AnalysisResult)
async def get_analysis(analysis_id: str):
    """Get a specific analysis by ID"""
    try:
        analysis = analysis_service.get_analysis_by_id(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=AnalysisResult)
async def save_analysis(
    filename: str = Form(...),
    detection_result: str = Form(...),
    processing_time: str = Form(...),
    image_file: UploadFile = File(...)
):
    """Save a new analysis result"""
    try:
        # Parse the detection result JSON string
        detection_data = json.loads(detection_result)
        detection_obj = DetectResponse(**detection_data)
        
        # Read image data
        image_data = await image_file.read()
        
        analysis_id = str(uuid.uuid4())
        analysis = analysis_service.save_analysis(
            analysis_id=analysis_id,
            filename=filename,
            detection_result=detection_obj,
            processing_time=int(processing_time),
            image_data=image_data
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete an analysis"""
    try:
        success = analysis_service.delete_analysis(analysis_id)
        if not success:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"message": "Analysis deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{analysis_id}/image")
async def get_analysis_image(analysis_id: str):
    """Get the original image for an analysis"""
    try:
        image_data = analysis_service.get_analysis_image(analysis_id)
        if not image_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return Response(content=image_data, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))