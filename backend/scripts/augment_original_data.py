#!/usr/bin/env python3
"""
Data Augmentation Script for Original YOLO Dataset
This script augments the original 3 images and creates proper train/val split.
"""

import os
import cv2
import numpy as np
from pathlib import Path
import shutil
from PIL import Image, ImageEnhance, ImageFilter
import random
import math

class YOLODataAugmenter:
    def __init__(self, source_images_dir, source_labels_dir, output_base_dir):
        self.source_images_dir = Path(source_images_dir)
        self.source_labels_dir = Path(source_labels_dir)
        self.output_base_dir = Path(output_base_dir)
        
        # Create output directories
        self.train_images_dir = self.output_base_dir / "images" / "train"
        self.train_labels_dir = self.output_base_dir / "labels" / "train"
        self.val_images_dir = self.output_base_dir / "images" / "val"
        self.val_labels_dir = self.output_base_dir / "labels" / "val"
        
        for dir_path in [self.train_images_dir, self.train_labels_dir, self.val_images_dir, self.val_labels_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def parse_yolo_label(self, label_path):
        """Parse YOLO format label file."""
        boxes = []
        if label_path.exists():
            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) == 5:
                        class_id = int(parts[0])
                        x_center = float(parts[1])
                        y_center = float(parts[2])
                        width = float(parts[3])
                        height = float(parts[4])
                        boxes.append([class_id, x_center, y_center, width, height])
        return boxes
    
    def save_yolo_label(self, boxes, label_path):
        """Save boxes in YOLO format."""
        with open(label_path, 'w') as f:
            for box in boxes:
                f.write(f"{box[0]} {box[1]:.6f} {box[2]:.6f} {box[3]:.6f} {box[4]:.6f}\n")
    
    def horizontal_flip(self, image, boxes):
        """Horizontal flip with coordinate transformation."""
        flipped_image = cv2.flip(image, 1)
        flipped_boxes = []
        
        for box in boxes:
            class_id, x_center, y_center, width, height = box
            # Transform x_center for horizontal flip
            new_x_center = 1.0 - x_center
            flipped_boxes.append([class_id, new_x_center, y_center, width, height])
        
        return flipped_image, flipped_boxes
    
    def vertical_flip(self, image, boxes):
        """Vertical flip with coordinate transformation."""
        flipped_image = cv2.flip(image, 0)
        flipped_boxes = []
        
        for box in boxes:
            class_id, x_center, y_center, width, height = box
            # Transform y_center for vertical flip
            new_y_center = 1.0 - y_center
            flipped_boxes.append([class_id, x_center, new_y_center, width, height])
        
        return flipped_image, flipped_boxes
    
    def rotate_90(self, image, boxes):
        """Rotate 90 degrees clockwise with coordinate transformation."""
        rotated_image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
        rotated_boxes = []
        
        for box in boxes:
            class_id, x_center, y_center, width, height = box
            # Transform coordinates for 90-degree rotation
            new_x_center = y_center
            new_y_center = 1.0 - x_center
            new_width = height
            new_height = width
            rotated_boxes.append([class_id, new_x_center, new_y_center, new_width, new_height])
        
        return rotated_image, rotated_boxes
    
    def rotate_270(self, image, boxes):
        """Rotate 270 degrees clockwise with coordinate transformation."""
        rotated_image = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
        rotated_boxes = []
        
        for box in boxes:
            class_id, x_center, y_center, width, height = box
            # Transform coordinates for 270-degree rotation
            new_x_center = 1.0 - y_center
            new_y_center = x_center
            new_width = height
            new_height = width
            rotated_boxes.append([class_id, new_x_center, new_y_center, new_width, new_height])
        
        return rotated_image, rotated_boxes
    
    def brightness_adjustment(self, image, boxes, factor=1.2):
        """Adjust brightness (no coordinate change needed)."""
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        enhancer = ImageEnhance.Brightness(pil_image)
        enhanced = enhancer.enhance(factor)
        enhanced_image = cv2.cvtColor(np.array(enhanced), cv2.COLOR_RGB2BGR)
        return enhanced_image, boxes
    
    def contrast_adjustment(self, image, boxes, factor=1.3):
        """Adjust contrast (no coordinate change needed)."""
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        enhancer = ImageEnhance.Contrast(pil_image)
        enhanced = enhancer.enhance(factor)
        enhanced_image = cv2.cvtColor(np.array(enhanced), cv2.COLOR_RGB2BGR)
        return enhanced_image, boxes
    
    def gaussian_blur(self, image, boxes, kernel_size=3):
        """Apply Gaussian blur (no coordinate change needed)."""
        blurred_image = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        return blurred_image, boxes
    
    def add_noise(self, image, boxes, noise_factor=25):
        """Add random noise (no coordinate change needed)."""
        noise = np.random.randint(-noise_factor, noise_factor, image.shape, dtype=np.int16)
        noisy_image = np.clip(image.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        return noisy_image, boxes
    
    def augment_dataset(self, multiplier=10):
        """Augment the dataset and create train/val split."""
        print(f"Starting data augmentation with multiplier={multiplier}")
        print(f"Source images: {self.source_images_dir}")
        print(f"Source labels: {self.source_labels_dir}")
        print(f"Output directory: {self.output_base_dir}")
        
        # Get all image files
        image_files = list(self.source_images_dir.glob("*.jpg"))
        print(f"Found {len(image_files)} original images")
        
        # Define augmentation functions
        augmentation_functions = [
            ("hflip", self.horizontal_flip),
            ("vflip", self.vertical_flip),
            ("rot90", self.rotate_90),
            ("rot270", self.rotate_270),
            ("bright", lambda img, boxes: self.brightness_adjustment(img, boxes, 1.3)),
            ("dark", lambda img, boxes: self.brightness_adjustment(img, boxes, 0.7)),
            ("contrast", lambda img, boxes: self.contrast_adjustment(img, boxes, 1.4)),
            ("blur", self.gaussian_blur),
            ("noise", self.add_noise),
        ]
        
        all_augmented_data = []
        
        # Process each original image
        for img_path in image_files:
            # Convert filename to match label file naming convention
            label_filename = img_path.stem.replace(" ", "_") + ".txt"
            label_path = self.source_labels_dir / label_filename
            
            if not label_path.exists():
                print(f"⚠️  Warning: No label file found for {img_path.name} (expected: {label_filename})")
                continue
            
            # Load image and labels
            image = cv2.imread(str(img_path))
            boxes = self.parse_yolo_label(label_path)
            
            print(f"Processing {img_path.name} with {len(boxes)} annotations")
            
            # Add original image to dataset
            all_augmented_data.append({
                'image': image.copy(),
                'boxes': boxes.copy(),
                'name': f"{img_path.stem}_original"
            })
            
            # Generate augmented versions
            for i in range(multiplier):
                # Randomly select augmentation
                aug_name, aug_func = random.choice(augmentation_functions)
                
                try:
                    aug_image, aug_boxes = aug_func(image, boxes.copy())
                    
                    all_augmented_data.append({
                        'image': aug_image,
                        'boxes': aug_boxes,
                        'name': f"{img_path.stem}_aug_{i:02d}_{aug_name}"
                    })
                    
                except Exception as e:
                    print(f"  Error with {aug_name}: {e}")
        
        # Shuffle and split data (80% train, 20% val)
        random.shuffle(all_augmented_data)
        total_samples = len(all_augmented_data)
        train_split = int(0.8 * total_samples)
        
        train_data = all_augmented_data[:train_split]
        val_data = all_augmented_data[train_split:]
        
        print(f"\nSplitting {total_samples} samples:")
        print(f"  Training: {len(train_data)} samples")
        print(f"  Validation: {len(val_data)} samples")
        
        # Save training data
        for data in train_data:
            img_name = f"{data['name']}.jpg"
            label_name = f"{data['name']}.txt"
            
            cv2.imwrite(str(self.train_images_dir / img_name), data['image'])
            self.save_yolo_label(data['boxes'], self.train_labels_dir / label_name)
        
        # Save validation data
        for data in val_data:
            img_name = f"{data['name']}.jpg"
            label_name = f"{data['name']}.txt"
            
            cv2.imwrite(str(self.val_images_dir / img_name), data['image'])
            self.save_yolo_label(data['boxes'], self.val_labels_dir / label_name)
        
        print(f"\n✅ Augmentation complete!")
        print(f"📊 Final dataset:")
        print(f"   Training: {len(train_data)} images and labels")
        print(f"   Validation: {len(val_data)} images and labels")
        
        return len(train_data), len(val_data)

def main():
    """Main function to run data augmentation."""
    
    # Paths
    source_images = "../../data/images/original"
    source_labels = "../../data/labels/original"
    output_base = "../../data"
    
    print("YOLO Data Augmentation from Original Dataset")
    print("=" * 60)
    
    # Create augmenter
    augmenter = YOLODataAugmenter(source_images, source_labels, output_base)
    
    # Augment dataset (multiply by 15 to get ~48 images from 3 originals)
    train_count, val_count = augmenter.augment_dataset(multiplier=15)
    
    print(f"\n🎯 Dataset expanded from 3 to {train_count + val_count} images!")
    print(f"📁 Data saved to:")
    print(f"   Training: {output_base}/images/train & {output_base}/labels/train")
    print(f"   Validation: {output_base}/images/val & {output_base}/labels/val")
    
    print(f"\n📋 Next steps:")
    print(f"1. Train YOLO with the expanded dataset using data/config.yaml")
    print(f"2. The model should perform much better with more balanced training data")

if __name__ == "__main__":
    main()