from ultralytics import YOLO
import os
import argparse
import shutil
from pathlib import Path
from sahi_preprocess import slice_dataset, create_sliced_yaml

def prepare_sliced_dataset(use_sahi: bool, project_root: str):
    """Prepare sliced dataset if SAHI is enabled."""
    if not use_sahi:
        return "data/config.yaml"
    
    print("Preparing SAHI sliced dataset...")
    
    # Define paths
    input_dir = os.path.join(project_root, "data", "images")
    output_dir = os.path.join(project_root, "data", "sliced_dataset")
    original_yaml = os.path.join(project_root, "data", "config.yaml")
    
    # Create sliced dataset
    slice_dataset(
        input_dir=input_dir,
        output_dir=output_dir,
        slice_height=512,
        slice_width=512,
        overlap_height_ratio=0.3,
        overlap_width_ratio=0.3
    )
    
    # Create YAML config for sliced dataset
    sliced_yaml_path = create_sliced_yaml(output_dir, original_yaml)
    
    return str(sliced_yaml_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune YOLO model with optional SAHI preprocessing")
    parser.add_argument("--use-sahi", action="store_true", help="Enable SAHI slicing for training")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--device", default=0, help="Device to use (0 for GPU, 'cpu' for CPU)")
    parser.add_argument("--model", default="yolov8s.pt", help="Model to use")
    
    args = parser.parse_args()
    
    # Get the project root directory (two levels up from this script)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Prepare dataset (sliced or original)
    config_path = prepare_sliced_dataset(args.use_sahi, project_root)
    
    print(f"Using config file: {config_path}")
    
    # Verify the config file exists
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found at: {config_path}")
    
    # Initialize and train model
    print(f"🚀 Starting YOLO training with {'SAHI sliced' if args.use_sahi else 'original'} dataset...")
    
    model = YOLO(args.model)
    model.train(
        data=config_path,
        epochs=args.epochs,
        imgsz=args.imgsz,
        device=args.device,
        batch=args.batch,
        name=f"sahi_train" if args.use_sahi else "train"
    )
    
    # Export model
    model.export(format="onnx")
    print("✅ YOLO fine-tuning complete.")
