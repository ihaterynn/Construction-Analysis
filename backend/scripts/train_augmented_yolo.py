#!/usr/bin/env python3
"""
Train YOLO with the augmented dataset (32 images instead of 2)
This should provide much better results with proper data diversity.
"""

from ultralytics import YOLO
import os

def train_with_augmented_data():
    """Train YOLO model with the augmented dataset."""
    
    print("Training YOLO with Augmented Dataset")
    print("=" * 50)
    
    # Use YOLOv8n (nano) for better performance with small datasets
    model = YOLO("yolov8s.pt")
    
    # Training configuration optimized for augmented small dataset
    results = model.train(
        data="../../data/config.yaml",
        epochs=100,                # Reduced epochs for better convergence
        batch=2,                   # Smaller batch size for stability
        imgsz=640,
        lr0=0.0005,               # Lower learning rate for stability
        lrf=0.01,                 # Final learning rate
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3,
        warmup_momentum=0.8,
        warmup_bias_lr=0.1,
        box=7.5,
        cls=0.5,
        dfl=1.5,
        # Data augmentation (moderate since we already augmented)
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=5.0,              # Reduced since we have rotated images
        translate=0.1,
        scale=0.2,
        shear=0.0,
        perspective=0.0,
        flipud=0.2,               # Reduced since we have flipped images
        fliplr=0.2,               # Reduced since we have flipped images
        mosaic=0.5,               # Enable mosaic with more images
        mixup=0.1,                # Light mixup
        copy_paste=0.1,           # Light copy-paste
        # Regularization
        dropout=0.1,
        # Validation and saving
        val=True,
        save=True,
        save_period=25,
        patience=30,              # Early stopping patience
        project="runs/detect",
        name="augmented_train",
        exist_ok=True,
        verbose=True,
        device="0"                # Use GPU if available
    )
    
    print("✅ Training complete with augmented dataset!")
    print(f"📊 Results: {results}")
    
    # Test the model quickly
    print("\n🔍 Quick test on training image...")
    test_results = model("../../data/images/original/Floor Plan Page_49.jpg")
    
    result = test_results[0]
    boxes = result.boxes
    
    if boxes is not None and len(boxes) > 0:
        print(f"✅ Model detects {len(boxes)} objects")
        for i, box in enumerate(boxes):
            conf = box.conf[0].item()
            print(f"  Detection {i+1}: Confidence = {conf:.3f}")
    else:
        print("⚠️ No detections in test")
    
    return "runs/detect/augmented_train/weights/best.pt"

if __name__ == "__main__":
    model_path = train_with_augmented_data()
    print(f"\n🎯 New model saved to: {model_path}")
    print(f"📋 Next step: Update backend config to use this model")