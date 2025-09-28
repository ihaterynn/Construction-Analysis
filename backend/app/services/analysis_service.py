import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path
from app.models.schemas import AnalysisResult, DetectResponse
import base64

class AnalysisService:
    def __init__(self):
        # Use absolute paths relative to the backend directory
        backend_root = Path(__file__).parent.parent.parent
        self.data_dir = backend_root / "data" / "analyses"
        self.images_dir = backend_root / "data" / "images"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.analyses_file = self.data_dir / "analyses.json"
        
        # Initialize analyses file if it doesn't exist
        if not self.analyses_file.exists():
            self._save_analyses_data([])
    
    def _load_analyses_data(self) -> List[Dict[str, Any]]:
        """Load analyses data from JSON file"""
        try:
            with open(self.analyses_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _save_analyses_data(self, analyses: List[Dict[str, Any]]):
        """Save analyses data to JSON file"""
        with open(self.analyses_file, 'w') as f:
            json.dump(analyses, f, indent=2, default=str)
    
    def save_analysis(
        self, 
        analysis_id: str, 
        filename: str, 
        detection_result: DetectResponse, 
        processing_time: int,
        image_data: bytes
    ) -> AnalysisResult:
        """Save a new analysis result"""
        
        # Save image file
        image_filename = f"{analysis_id}.jpg"
        image_path = self.images_dir / image_filename
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # Create analysis record
        analysis_data = {
            "id": analysis_id,
            "filename": filename,
            "upload_date": datetime.now().isoformat(),
            "processing_time": processing_time,
            "detection_result": detection_result.dict(),
            "image_url": f"/analysis/{analysis_id}/image",
            "status": "completed"
        }
        
        # Load existing analyses and add new one
        analyses = self._load_analyses_data()
        analyses.append(analysis_data)
        self._save_analyses_data(analyses)
        
        return AnalysisResult(**analysis_data)
    
    def get_all_analyses(
        self, 
        search: Optional[str] = None, 
        status: Optional[str] = None, 
        sort_by: Optional[str] = "date"
    ) -> List[AnalysisResult]:
        """Get all analyses with optional filtering and sorting"""
        
        analyses = self._load_analyses_data()
        
        # Apply search filter
        if search:
            analyses = [
                a for a in analyses 
                if search.lower() in a["filename"].lower()
            ]
        
        # Apply status filter
        if status and status != "all":
            analyses = [a for a in analyses if a["status"] == status]
        
        # Apply sorting
        if sort_by == "date":
            analyses.sort(key=lambda x: x["upload_date"], reverse=True)
        elif sort_by == "filename":
            analyses.sort(key=lambda x: x["filename"])
        elif sort_by == "objects":
            analyses.sort(key=lambda x: len(x["detection_result"]["boxes"]), reverse=True)
        
        return [AnalysisResult(**analysis) for analysis in analyses]
    
    def get_analysis_by_id(self, analysis_id: str) -> Optional[AnalysisResult]:
        """Get a specific analysis by ID"""
        analyses = self._load_analyses_data()
        for analysis in analyses:
            if analysis["id"] == analysis_id:
                return AnalysisResult(**analysis)
        return None
    
    def delete_analysis(self, analysis_id: str) -> bool:
        """Delete an analysis"""
        analyses = self._load_analyses_data()
        original_length = len(analyses)
        analyses = [a for a in analyses if a["id"] != analysis_id]
        
        if len(analyses) < original_length:
            self._save_analyses_data(analyses)
            
            # Delete image file
            image_path = self.images_dir / f"{analysis_id}.jpg"
            if image_path.exists():
                image_path.unlink()
            
            return True
        return False
    
    def get_analysis_image(self, analysis_id: str) -> Optional[bytes]:
        """Get the image data for an analysis"""
        image_path = self.images_dir / f"{analysis_id}.jpg"
        if image_path.exists():
            with open(image_path, 'rb') as f:
                return f.read()
        return None