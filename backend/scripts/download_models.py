#!/usr/bin/env python3
"""
Download YOLOv8 and Qwen2-VL base models into backend/models/
"""

import os
from pathlib import Path
from ultralytics import YOLO
from transformers import Qwen2VLForConditionalGeneration, AutoTokenizer, AutoProcessor

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
YOLO_WEIGHTS = MODEL_DIR / "yolov8s.pt"
VLM_DIR = MODEL_DIR / "vlm"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
VLM_DIR.mkdir(parents=True, exist_ok=True)

# --- YOLOv8 ---
print("Downloading YOLOv8 weights...")
yolo_model = YOLO("yolov8s.pt")  # This auto-downloads

# Find the downloaded weights file in the current directory
current_yolo_weights = Path("yolov8s.pt")
if current_yolo_weights.exists() and not YOLO_WEIGHTS.exists():
    print(f"Moving YOLO weights to {YOLO_WEIGHTS}")
    import shutil
    shutil.move(str(current_yolo_weights), str(YOLO_WEIGHTS))
elif YOLO_WEIGHTS.exists():
    print("YOLO weights already exist.")
    # Clean up the downloaded file if it exists
    if current_yolo_weights.exists():
        current_yolo_weights.unlink()
else:
    print("YOLO weights downloaded successfully.")

# --- Qwen2-VL ---
print("Downloading Qwen2-VL base model...")
model_name = "Qwen/Qwen2-VL-7B-Instruct"

# Download and cache the model components (they'll be cached by HuggingFace)
print("Downloading model...")
vlm_model = Qwen2VLForConditionalGeneration.from_pretrained(
    model_name, 
    device_map="cpu",  # Use CPU to avoid memory issues
    torch_dtype="auto"
)
print("Downloading tokenizer...")
vlm_tokenizer = AutoTokenizer.from_pretrained(model_name)
print("Downloading processor...")
vlm_processor = AutoProcessor.from_pretrained(model_name)

print("Model components downloaded and cached successfully!")
print("Note: Models are cached in HuggingFace cache directory and will be loaded from there.")

print(f"Models downloaded successfully into {MODEL_DIR}")
