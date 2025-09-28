import os
import shutil
from pathlib import Path
from sahi import AutoDetectionModel
from sahi.utils.cv import read_image
from sahi.utils.file import download_from_url
from sahi.slicing import slice_image
import yaml

def slice_dataset(input_dir, output_dir, slice_height=512, slice_width=512, overlap_height_ratio=0.3, overlap_width_ratio=0.3):
    """
    Slice dataset using SAHI for better small object detection.
    Using smaller slices (512x512) with more overlap to better capture small objects.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    # Create output directories
    for split in ['train', 'val']:
        (output_path / split / 'images').mkdir(parents=True, exist_ok=True)
        (output_path / split / 'labels').mkdir(parents=True, exist_ok=True)
    
    # Process each split
    for split in ['train', 'val']:
        images_dir = input_path / split 
        labels_dir = Path(str(input_path).replace('images', 'labels')) / split  # Point to labels directory
        
        if not images_dir.exists():
            print(f"Warning: {images_dir} does not exist, skipping...")
            continue
            
        print(f"Processing {split} split...")
        
        # Get all image files
        image_files = list(images_dir.glob('*.jpg')) + list(images_dir.glob('*.png')) + list(images_dir.glob('*.jpeg'))
        
        total_labels_created = 0
        
        for image_file in image_files:
            print(f"  Processing {image_file.name}...")
            
            # Get corresponding label file
            label_file = labels_dir / f"{image_file.stem}.txt"
            
            if not label_file.exists():
                print(f"    Warning: No label file found for {image_file.name}")
                continue
            
            # Read original labels
            original_labels = []
            with open(label_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        parts = line.split()
                        if len(parts) == 5:
                            class_id = int(parts[0])
                            x_center = float(parts[1])
                            y_center = float(parts[2])
                            width = float(parts[3])
                            height = float(parts[4])
                            original_labels.append((class_id, x_center, y_center, width, height))
            
            if not original_labels:
                print(f"    No labels found in {label_file.name}")
                continue
                
            print(f"    Found {len(original_labels)} original labels")
            
            # Slice the image
            slice_image_result = slice_image(
                image=str(image_file),
                output_file_name=None,
                output_dir=None,
                slice_height=slice_height,
                slice_width=slice_width,
                overlap_height_ratio=overlap_height_ratio,
                overlap_width_ratio=overlap_width_ratio,
                out_ext=".jpg",
                verbose=0
            )
            
            # Get original image dimensions
            from PIL import Image
            with Image.open(image_file) as img:
                orig_width, orig_height = img.size
            
            slice_count = 0
            # Process each slice
            for slice_info in slice_image_result:
                slice_count += 1
                
                # Get slice information - SAHI API returns dict now
                slice_image_array = slice_info['image']
                starting_pixel = slice_info['starting_pixel']
                
                # Convert slice to PIL Image and save
                slice_pil = Image.fromarray(slice_image_array)
                slice_filename = f"{image_file.stem}_slice_{starting_pixel[0]}_{starting_pixel[1]}.jpg"
                slice_image_path = output_path / split / 'images' / slice_filename
                slice_pil.save(slice_image_path)
                
                # Create corresponding labels for this slice
                slice_labels = []
                
                # Convert original labels to slice coordinates
                for class_id, x_center, y_center, width, height in original_labels:
                    # Convert normalized coordinates to absolute coordinates
                    abs_x_center = x_center * orig_width
                    abs_y_center = y_center * orig_height
                    abs_width = width * orig_width
                    abs_height = height * orig_height
                    
                    # Calculate bounding box corners
                    x_min = abs_x_center - abs_width / 2
                    y_min = abs_y_center - abs_height / 2
                    x_max = abs_x_center + abs_width / 2
                    y_max = abs_y_center + abs_height / 2
                    
                    # Calculate slice boundaries
                    slice_x_min = starting_pixel[0]
                    slice_y_min = starting_pixel[1]
                    slice_x_max = starting_pixel[0] + slice_width
                    slice_y_max = starting_pixel[1] + slice_height
                    
                    # Check if bounding box intersects with slice
                    intersect_x_min = max(x_min, slice_x_min)
                    intersect_y_min = max(y_min, slice_y_min)
                    intersect_x_max = min(x_max, slice_x_max)
                    intersect_y_max = min(y_max, slice_y_max)
                    
                    # Check if there's a valid intersection
                    if intersect_x_min < intersect_x_max and intersect_y_min < intersect_y_max:
                        # Calculate intersection area
                        intersection_area = (intersect_x_max - intersect_x_min) * (intersect_y_max - intersect_y_min)
                        original_area = abs_width * abs_height
                        
                        # Use much lower threshold for very small objects (1% instead of 10%)
                        min_threshold = 0.01
                        intersection_ratio = intersection_area / original_area if original_area > 0 else 0
                        
                        if intersection_ratio > min_threshold:
                            # Convert intersection to slice-relative coordinates
                            new_x_center = (intersect_x_min + intersect_x_max) / 2 - slice_x_min
                            new_y_center = (intersect_y_min + intersect_y_max) / 2 - slice_y_min
                            new_width = intersect_x_max - intersect_x_min
                            new_height = intersect_y_max - intersect_y_min
                            
                            # Normalize to slice dimensions
                            new_x_center /= slice_width
                            new_y_center /= slice_height
                            new_width /= slice_width
                            new_height /= slice_height
                            
                            # Ensure coordinates are within bounds
                            new_x_center = max(0, min(1, new_x_center))
                            new_y_center = max(0, min(1, new_y_center))
                            new_width = max(0, min(1, new_width))
                            new_height = max(0, min(1, new_height))
                            
                            slice_labels.append(f"{class_id} {new_x_center:.6f} {new_y_center:.6f} {new_width:.6f} {new_height:.6f}\n")
                            print(f"    Added label to slice {slice_count}: class={class_id}, ratio={intersection_ratio:.3f}")
                        else:
                            print(f"    Skipped label in slice {slice_count}: class={class_id}, ratio={intersection_ratio:.3f} (below {min_threshold})")
                
                # Save slice labels
                slice_label_path = output_path / split / 'labels' / f"{slice_filename.replace('.jpg', '.txt')}"
                with open(slice_label_path, 'w') as f:
                    f.writelines(slice_labels)
                
                total_labels_created += len(slice_labels)
                
                if slice_labels:
                    print(f"    Slice {slice_count}: {len(slice_labels)} labels")
            
            print(f"  Created {slice_count} slices from {image_file.name}")
        
        print(f"Completed {split} split: {total_labels_created} total labels created")

def create_sliced_yaml(output_dir, original_yaml_path):
    """Create YAML config file for sliced dataset"""
    
    # Read original yaml
    with open(original_yaml_path, 'r') as f:
        original_config = yaml.safe_load(f)
    
    # Create new config for sliced dataset
    sliced_config = {
        'path': str(Path(output_dir).absolute()),
        'train': 'train/images',
        'val': 'val/images',
        'nc': original_config.get('nc', 1),
        'names': original_config.get('names', ['distribution_board'])
    }
    
    # Save sliced config
    sliced_yaml_path = Path(output_dir) / 'data.yaml'
    with open(sliced_yaml_path, 'w') as f:
        yaml.dump(sliced_config, f, default_flow_style=False)
    
    print(f"Created sliced dataset config: {sliced_yaml_path}")
    return sliced_yaml_path

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Slice dataset using SAHI')
    parser.add_argument('--input_dir', type=str, required=True, help='Input dataset directory')
    parser.add_argument('--output_dir', type=str, required=True, help='Output directory for sliced dataset')
    parser.add_argument('--slice_height', type=int, default=512, help='Slice height (default: 512)')
    parser.add_argument('--slice_width', type=int, default=512, help='Slice width (default: 512)')
    parser.add_argument('--overlap_height_ratio', type=float, default=0.3, help='Height overlap ratio (default: 0.3)')
    parser.add_argument('--overlap_width_ratio', type=float, default=0.3, help='Width overlap ratio (default: 0.3)')
    parser.add_argument('--yaml_path', type=str, help='Original dataset YAML file path')
    
    args = parser.parse_args()
    
    print("Starting SAHI dataset slicing...")
    print(f"Input: {args.input_dir}")
    print(f"Output: {args.output_dir}")
    print(f"Slice size: {args.slice_width}x{args.slice_height}")
    print(f"Overlap: {args.overlap_width_ratio}x{args.overlap_height_ratio}")
    
    # Slice the dataset
    slice_dataset(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        slice_height=args.slice_height,
        slice_width=args.slice_width,
        overlap_height_ratio=args.overlap_height_ratio,
        overlap_width_ratio=args.overlap_width_ratio
    )
    
    # Create YAML config if provided
    if args.yaml_path:
        create_sliced_yaml(args.output_dir, args.yaml_path)
    
    print("SAHI dataset slicing completed!")