from typing import List, Dict
from pydantic import BaseModel
from app.core.config import settings
from app.models.schemas import Box, DetectResponse
import io
from PIL import Image
import logging
import numpy as np

log = logging.getLogger(__name__)

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except Exception:
    ULTRALYTICS_AVAILABLE = False

try:
    from sahi import AutoDetectionModel
    from sahi.predict import get_sliced_prediction
    SAHI_AVAILABLE = True
except Exception:
    SAHI_AVAILABLE = False
    log.warning("SAHI not available. Install with: pip install sahi")

class YoloService:
    def __init__(self, weights: str = None):
        self.weights = weights or settings.yolo_weights
        self.model = None
        self.sahi_model = None
        
        if ULTRALYTICS_AVAILABLE:
            try:
                self.model = YOLO(self.weights)
                
                # Initialize SAHI model if available and enabled
                if SAHI_AVAILABLE and settings.use_sahi_inference:
                    self.sahi_model = AutoDetectionModel.from_pretrained(
                        model_type='yolov8',
                        model_path=self.weights,
                        confidence_threshold=0.01,  # Match training confidence
                        device="cpu",  # or "cuda:0" if you have GPU
                        image_size=512  # Match training image size
                    )
                    log.info("SAHI model initialized for sliced inference")
                else:
                    log.info("Using standard YOLO inference (SAHI disabled)")
                    
            except Exception as e:
                log.warning("Could not load YOLO model: %s", e)
                self.model = None

    def _pil_from_bytes(self, image_bytes: bytes):
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

    def _standard_inference(self, img: Image.Image) -> DetectResponse:
        """Standard YOLO inference without slicing."""
        img_w, img_h = img.size
        log.info(f"Input image size: {img_w}x{img_h}")
        
        if self.model is None:
            return DetectResponse(boxes=[], classes=[], scores=[])

        # Use same image size as training (512) for consistency
        # Keep low conf for model prediction but filter later
        results = self.model.predict(source=img, imgsz=512, conf=0.01, iou=0.3, verbose=False)
        res = results[0]
        boxes = []
        classes = []
        scores = []
        
        if hasattr(res, "boxes") and res.boxes is not None:
            all_detections = []
            for box in res.boxes:
                xyxy = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0].cpu().numpy()) if hasattr(box, "conf") else 0.0
                cls = int(box.cls[0].cpu().numpy()) if hasattr(box, "cls") else -1
                
                # Filter out low confidence detections (below 60%)
                if conf < 0.6:
                    continue
                
                # Ensure coordinates are within image bounds
                xmin = max(0, min(int(xyxy[0]), img_w - 1))
                ymin = max(0, min(int(xyxy[1]), img_h - 1))
                xmax = max(xmin + 1, min(int(xyxy[2]), img_w))
                ymax = max(ymin + 1, min(int(xyxy[3]), img_h))
                
                # Log coordinate info for debugging
                log.info(f"Detection: conf={conf:.3f}, coords=({xmin},{ymin},{xmax},{ymax}), size={xmax-xmin}x{ymax-ymin}")
                
                box_area = (xmax - xmin) * (ymax - ymin)
                
                all_detections.append({
                    'box': Box(x=xmin, y=ymin, w=xmax - xmin, h=ymax - ymin),
                    'class': str(cls),
                    'score': conf,
                    'area': box_area
                })
            
            if all_detections:
                all_detections.sort(key=lambda x: x['score'], reverse=True)
                min_area = max(25, (img_w * img_h) * 0.0001)
                filtered_detections = [d for d in all_detections if d['area'] > min_area]
                top_detections = filtered_detections[:10]
                
                for detection in top_detections:
                    boxes.append(detection['box'])
                    classes.append(detection['class'])
                    scores.append(detection['score'])
                    
        log.info(f"Final detections (60%+ confidence): {len(boxes)}")
        return DetectResponse(boxes=boxes, classes=classes, scores=scores)

    def _sahi_inference(self, img: Image.Image) -> DetectResponse:
        """SAHI sliced inference for large images with small objects."""
        if self.sahi_model is None:
            log.warning("SAHI model not available, falling back to standard inference")
            return self._standard_inference(img)
        
        try:
            # Convert PIL image to numpy array for SAHI
            img_array = np.array(img)
            
            # Use EXACT same parameters as training
            result = get_sliced_prediction(
                image=img_array,
                detection_model=self.sahi_model,
                slice_height=512,  # Exact match to training
                slice_width=512,   # Exact match to training
                overlap_height_ratio=0.3,  # Match training overlap
                overlap_width_ratio=0.3,   # Match training overlap
                postprocess_type="GREEDYNMM",
                postprocess_match_metric="IOS",
                postprocess_match_threshold=0.5,  # Standard threshold
                postprocess_class_agnostic=True,
                verbose=1  # See what's happening
            )
            
            # Convert SAHI results to our format with confidence filtering
            boxes = []
            classes = []
            scores = []
            
            log.info(f"Raw SAHI detections: {len(result.object_prediction_list)}")
            
            for detection in result.object_prediction_list:
                bbox = detection.bbox
                score = float(detection.score.value)
                
                # Apply 60% confidence threshold
                if score >= 0.3:
                    x_min, y_min, x_max, y_max = bbox.to_xyxy()
                    
                    boxes.append(Box(
                        x=int(x_min), 
                        y=int(y_min), 
                        w=int(x_max - x_min), 
                        h=int(y_max - y_min)
                    ))
                    classes.append(str(detection.category.id))
                    scores.append(score)
            
            # Sort by confidence and take reasonable number
            if boxes:
                # Create detection list
                all_detections = list(zip(boxes, classes, scores))
                # Sort by score (descending)
                all_detections.sort(key=lambda x: x[2], reverse=True)
                
                # Take top detections
                top_detections = all_detections[:20]
                
                boxes = [d[0] for d in top_detections]
                classes = [d[1] for d in top_detections]
                scores = [d[2] for d in top_detections]
                
                log.info(f"Final detections (60%+ confidence): {len(boxes)}")
                for i, (box, score) in enumerate(zip(boxes[:3], scores[:3])):
                    log.info(f"Detection {i+1}: score={score:.3f}, area={box.w*box.h}")
            
            return DetectResponse(boxes=boxes, classes=classes, scores=scores)
            
        except Exception as e:
            log.error(f"SAHI inference failed: {str(e)}, falling back to standard inference")
            return self._standard_inference(img)

    def infer_bytes(self, image_bytes: bytes) -> DetectResponse:
        """Main inference method that chooses between standard and SAHI inference."""
        img = self._pil_from_bytes(image_bytes)
        
        # Choose inference method based on configuration
        if settings.use_sahi_inference and SAHI_AVAILABLE and self.sahi_model is not None:
            log.info("Using SAHI sliced inference")
            return self._sahi_inference(img)
        else:
            log.info("Using standard YOLO inference")
            return self._standard_inference(img)
