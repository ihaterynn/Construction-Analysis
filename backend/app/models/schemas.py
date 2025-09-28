from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Box(BaseModel):
    x: int
    y: int
    w: int
    h: int

class DetectResponse(BaseModel):
    boxes: List[Box]
    classes: List[str]
    scores: List[float]

class AnalysisResult(BaseModel):
    id: str
    filename: str
    upload_date: datetime
    processing_time: int
    detection_result: DetectResponse
    image_url: str
    status: str = "completed"

class AnalysisListResponse(BaseModel):
    analyses: List[AnalysisResult]

class FeedbackIn(BaseModel):
    id: str
    image_path: str
    boxes: List[Box]
    classes: List[str]
    instruction: str = "Count all the light bulb symbols."
    output: str = ""  # textual ground-truth; optional
