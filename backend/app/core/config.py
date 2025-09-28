from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    project_root: str = "."
    model_dir: str = "models"
    data_dir: str = "data"
    yolo_weights: str = "../runs/detect/sahi_train2/weights/best.pt"
    qwen_model: str = "Qwen/Qwen2-VL-7B-Instruct"
    host: str = "0.0.0.0"
    port: int = 8000
    adapter_dir: str = "models/adapters"
    feedback_dir: str = "data/feedback"
    finetune_file: str = "data/finetune/train.jsonl"
    
    # SAHI Configuration - Optimized for full image detection
    use_sahi_inference: bool = True
    sahi_slice_height: int = 512
    sahi_slice_width: int = 512
    sahi_overlap_height_ratio: float = 0.4  # Increased overlap for better detection
    sahi_overlap_width_ratio: float = 0.4   # Increased overlap for better detection
    sahi_postprocess_type: str = "GREEDYNMM"
    sahi_postprocess_match_metric: str = "IOS"
    sahi_postprocess_match_threshold: float = 0.3  # Lower threshold for better merging
    sahi_postprocess_class_agnostic: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
Path(settings.data_dir).mkdir(parents=True, exist_ok=True)
Path(settings.adapter_dir).mkdir(parents=True, exist_ok=True)
Path(settings.feedback_dir).mkdir(parents=True, exist_ok=True)
Path(settings.model_dir).mkdir(parents=True, exist_ok=True)
