import os
import shutil
import random
from pathlib import Path

def create_validation_split():
    """
    Create a proper train/validation split from the augmented dataset
    """
    # Paths
    base_dir = Path("C:/Users/Rynn/Desktop/Axium Industries/Projects/VLM-YOLO-Construction")
    
    # Source directories (augmented data)
    train_aug_images = base_dir / "data/images/train_augmented"
    train_aug_labels = base_dir / "data/labels/train_augmented"
    
    # Destination directories
    train_images = base_dir / "data/images/train"
    train_labels = base_dir / "data/labels/train"
    val_images = base_dir / "data/images/val"
    val_labels = base_dir / "data/labels/val"
    
    # Clear existing train/val directories
    for dir_path in [train_images, train_labels, val_images, val_labels]:
        if dir_path.exists():
            shutil.rmtree(dir_path)
        dir_path.mkdir(parents=True, exist_ok=True)
    
    # Get all augmented image files
    image_files = list(train_aug_images.glob("*.jpg"))
    print(f"Found {len(image_files)} augmented images")
    
    # Shuffle for random split
    random.seed(42)  # For reproducible results
    random.shuffle(image_files)
    
    # Split: 80% train, 20% validation (at least 6 images for validation)
    val_count = max(6, int(len(image_files) * 0.2))
    train_count = len(image_files) - val_count
    
    print(f"Splitting into {train_count} training and {val_count} validation images")
    
    # Copy training files
    for i, img_file in enumerate(image_files[:train_count]):
        # Copy image
        shutil.copy2(img_file, train_images / img_file.name)
        
        # Copy corresponding label
        label_file = train_aug_labels / (img_file.stem + ".txt")
        if label_file.exists():
            shutil.copy2(label_file, train_labels / label_file.name)
        else:
            print(f"Warning: No label found for {img_file.name}")
    
    # Copy validation files
    for i, img_file in enumerate(image_files[train_count:]):
        # Copy image
        shutil.copy2(img_file, val_images / img_file.name)
        
        # Copy corresponding label
        label_file = train_aug_labels / (img_file.stem + ".txt")
        if label_file.exists():
            shutil.copy2(label_file, val_labels / label_file.name)
        else:
            print(f"Warning: No label found for {img_file.name}")
    
    print(f"Successfully created train/val split:")
    print(f"  Training: {len(list(train_images.glob('*.jpg')))} images")
    print(f"  Validation: {len(list(val_images.glob('*.jpg')))} images")
    
    # Verify labels exist
    train_label_count = len(list(train_labels.glob("*.txt")))
    val_label_count = len(list(val_labels.glob("*.txt")))
    print(f"  Training labels: {train_label_count}")
    print(f"  Validation labels: {val_label_count}")

if __name__ == "__main__":
    create_validation_split()