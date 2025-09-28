# 🚀 VLM-YOLO Construction Project - Complete Run Guide

This guide provides step-by-step instructions for running the complete project workflow, from dataset replacement to application deployment.

## 📋 Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed
- Git installed
- CUDA-compatible GPU (recommended for training)

## 🔄 Complete Workflow Steps

### Step 1: Dataset Preparation

#### 1.1 Replace Original Dataset
```bash
# Navigate to project root
cd "C:\Users\Rynn\Desktop\Axium Industries\Projects\VLM-YOLO-Construction"

# Clear existing data (if replacing dataset)
# Remove old images and labels
rm -rf data/images/original/*
rm -rf data/labels/original/*
rm -rf data/images/train/*
rm -rf data/labels/train/*
rm -rf data/images/val/*
rm -rf data/labels/val/*

# Add your new images to data/images/original/
# Add corresponding YOLO format labels to data/labels/original/
```

#### 1.2 Verify Dataset Structure
```
data/
├── images/
│   └── original/          # Your new images (.jpg, .png)
└── labels/
    └── original/          # Corresponding YOLO labels (.txt)
```

#### 1.3 Update Configuration
Check and update `data/config.yaml`:
```yaml
path: .
train: images/train
val: images/val
names:
  0: distribution_board    # Update class names as needed
```

### Step 2: Data Augmentation

#### 2.1 Run Data Augmentation Script
```bash
# Navigate to backend scripts
cd backend/scripts

# Run augmentation (expands dataset ~16x)
python augment_original_data.py
```

**Expected Output:**
- Original images → Augmented images in `data/images/train/`
- Original labels → Augmented labels in `data/labels/train/`
- 80/20 train/validation split automatically created

#### 2.2 Verify Augmentation Results
```bash
# Check augmented data
ls ../../../data/images/train/    # Should show augmented images
ls ../../../data/images/val/      # Should show validation images
ls ../../../data/labels/train/    # Should show augmented labels
ls ../../../data/labels/val/      # Should show validation labels
```

### Step 3: YOLO Model Training

#### 3.1 Train YOLO Model
```bash
# Still in backend/scripts directory
python train_augmented_yolo.py
```

**Training Configuration:**
- Model: YOLOv8n (nano)
- Epochs: 100
- Batch Size: 2
- Learning Rate: 0.0005
- Image Size: 640px

**Expected Output:**
- Training progress with loss metrics
- Model saved to: `scripts/runs/detect/augmented_train/weights/best.pt`
- Validation results after each epoch

#### 3.2 Monitor Training Progress
Training typically takes 30-60 minutes depending on:
- Dataset size
- Hardware (GPU vs CPU)
- Number of epochs

**Key Metrics to Watch:**
- `box_loss`: Should decrease over time
- `cls_loss`: Should decrease over time  
- `dfl_loss`: Should decrease over time
- `mAP50`: Should increase over time

### Step 4: Backend Configuration

#### 4.1 Update Model Path
Edit `backend/app/core/config.py`:
```python
# Update this line (around line 15)
yolo_weights: str = "scripts/runs/detect/augmented_train/weights/best.pt"
```

#### 4.2 Install Backend Dependencies
```bash
# Navigate to backend directory
cd ../

# Install Python dependencies
pip install -r requirements.txt
```

### Step 5: Frontend Setup

#### 5.1 Install Frontend Dependencies
```bash
# Navigate to frontend directory
cd ../frontend

# Install Node.js dependencies
npm install
```

#### 5.2 Start Frontend Development Server
```bash
# Start Next.js development server
npm run dev
```

**Expected Output:**
- Server running on `http://localhost:3001`
- Hot reload enabled for development

### Step 6: Backend API Server

#### 6.1 Start Backend Server
```bash
# Open new terminal, navigate to backend
cd backend

# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
- API server running on `http://localhost:8000`
- Swagger docs available at `http://localhost:8000/docs`

### Step 7: Verification & Testing

#### 7.1 Test YOLO Model Loading
```bash
# In backend directory
python -c "
from app.services.yolo_service import YOLOService
service = YOLOService()
print('✅ YOLO model loaded successfully')
print(f'Model path: {service.model}')
"
```

#### 7.2 Test API Endpoints
Visit `http://localhost:8000/docs` and test:
- `/health` - Health check
- `/analyze` - Image analysis endpoint

#### 7.3 Test Full Application
1. Open `http://localhost:3001` in browser
2. Upload a construction floor plan image
3. Verify detection results

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Training Issues
```bash
# If training fails with CUDA errors
export CUDA_VISIBLE_DEVICES=""  # Force CPU training

# If out of memory errors
# Reduce batch size in train_augmented_yolo.py
batch=1  # Instead of batch=2
```

#### Model Loading Issues
```bash
# If model not found error
ls backend/scripts/runs/detect/augmented_train/weights/
# Verify best.pt exists

# Update config.py with correct path
```

#### Port Conflicts
```bash
# If port 3001 is busy
npm run dev -- --port 3002

# If port 8000 is busy
python -m uvicorn app.main:app --reload --port 8001
```

## 📊 Performance Optimization

### For Better Detection Results

#### 1. Annotation Quality
- Ensure bounding boxes are not too small (>2% of image area)
- Include sufficient context around objects
- Verify label accuracy

#### 2. Training Parameters
```python
# For small objects, try:
imgsz=416          # Smaller image size
conf=0.001         # Lower confidence threshold
iou=0.1            # Lower IoU threshold
box=15.0           # Higher box loss weight
```

#### 3. Model Selection
```python
# For better accuracy (slower inference):
model = YOLO("yolov8s.pt")  # Instead of yolov8n.pt

# For production deployment:
model = YOLO("yolov8n.pt")  # Faster inference
```

## 📝 Development Workflow

### Daily Development Cycle
1. **Code Changes** → Make modifications
2. **Test Locally** → Verify functionality  
3. **Restart Services** → If needed
4. **Validate** → Check results

### Dataset Updates
1. **Replace Data** → Follow Step 1
2. **Re-augment** → Follow Step 2
3. **Re-train** → Follow Step 3
4. **Update Config** → Follow Step 4
5. **Test** → Follow Step 7

## 🎯 Quick Start Commands

```bash
# Complete fresh setup (after dataset replacement)
cd backend/scripts
python augment_original_data.py
python train_augmented_yolo.py
cd ../
python -m uvicorn app.main:app --reload --port 8000 &
cd ../frontend
npm run dev
```

## 📋 Checklist

- [ ] Dataset replaced in `data/images/original/` and `data/labels/original/`
- [ ] Data augmentation completed successfully
- [ ] YOLO model training completed without errors
- [ ] Model path updated in `backend/app/core/config.py`
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3001
- [ ] API endpoints responding correctly
- [ ] Full application workflow tested

---

**🎉 Success!** Your VLM-YOLO Construction project should now be fully operational with your new dataset.

For issues or questions, check the logs in:
- Backend: Terminal output
- Frontend: Browser console
- Training: `backend/scripts/runs/detect/augmented_train/`