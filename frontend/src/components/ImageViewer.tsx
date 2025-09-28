"use client";

import { useState, useRef, useEffect } from "react";
import { 
  MagnifyingGlassPlusIcon, 
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";

interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
  class?: string;
  confidence?: number;
}

interface DetectionResult {
  boxes: BoundingBox[];
  classes: string[];
  scores: number[];
}

interface ImageViewerProps {
  originalImage: string;
  predictedImage?: string;
  detectionResult?: DetectionResult;
  title?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  originalImage,
  predictedImage,
  detectionResult,
  title = "Image Analysis"
}) => {
  const [zoom, setZoom] = useState(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [viewMode, setViewMode] = useState<'original' | 'predicted' | 'split'>('original');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const resetZoom = () => setZoom(1);

  const getClassColor = (className: string) => {
    const colors = {
      'safety-equipment': '#10b981',
      'hazards': '#ef4444',
      'equipment': '#3b82f6',
      'personnel': '#f59e0b',
      'structures': '#8b5cf6'
    };
    return colors[className as keyof typeof colors] || '#6b7280';
  };

  const renderBoundingBoxes = () => {
    if (!showBoundingBoxes || !detectionResult || !imageRef.current) return null;

    const imgElement = imageRef.current;
    const imgRect = imgElement.getBoundingClientRect();
    
    // Calculate the actual displayed image dimensions considering object-contain
    const imageAspectRatio = imageSize.width / imageSize.height;
    const containerAspectRatio = imgRect.width / imgRect.height;
    
    let displayedWidth, displayedHeight, offsetX = 0, offsetY = 0;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider - height will be constrained
      displayedWidth = imgRect.width;
      displayedHeight = imgRect.width / imageAspectRatio;
      offsetY = (imgRect.height - displayedHeight) / 2;
    } else {
      // Image is taller - width will be constrained
      displayedHeight = imgRect.height;
      displayedWidth = imgRect.height * imageAspectRatio;
      offsetX = (imgRect.width - displayedWidth) / 2;
    }
    
    // Calculate scale factors based on actual displayed image size
    const scaleX = displayedWidth / imageSize.width;
    const scaleY = displayedHeight / imageSize.height;

    return detectionResult.boxes.map((box, index) => {
      const className = detectionResult.classes[index] || 'unknown';
      const confidence = detectionResult.scores[index] || 0;
      
      // Calculate box dimensions in pixels
      const boxWidth = box.w * scaleX;
      const boxHeight = box.h * scaleY;
      const boxArea = boxWidth * boxHeight;
      
      // Determine if this is a small detection (less than 50x50 pixels)
      const isSmallDetection = boxWidth < 50 || boxHeight < 50;
      
      // Adjust label size and positioning based on detection size
      const labelClass = isSmallDetection ? 'text-xs' : 'text-xs';
      const labelPadding = isSmallDetection ? 'px-1 py-0.5' : 'px-2 py-1';
      const labelOffset = isSmallDetection ? '-top-4' : '-top-6';
      
      return (
        <div
          key={index}
          className="absolute border-2 rounded pointer-events-none"
          style={{
            left: `${box.x * scaleX + offsetX}px`,
            top: `${box.y * scaleY + offsetY}px`,
            width: `${box.w * scaleX}px`,
            height: `${box.h * scaleY}px`,
            borderColor: getClassColor(className),
            backgroundColor: `${getClassColor(className)}20`,
          }}
        >
          {/* Only show label for larger detections or on hover */}
          {!isSmallDetection && (
            <div 
              className={`absolute ${labelOffset} left-0 ${labelPadding} font-medium text-white rounded ${labelClass}`}
              style={{ backgroundColor: getClassColor(className) }}
            >
              {className} ({(confidence * 100).toFixed(1)}%)
            </div>
          )}
          
          {/* For small detections, show a minimal indicator */}
          {isSmallDetection && (
            <div 
              className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style={{ backgroundColor: getClassColor(className), fontSize: '8px' }}
              title={`${className} (${(confidence * 100).toFixed(1)}%)`}
            >
              {index + 1}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="axium-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'original' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Original
              </button>
              {predictedImage && (
                <button
                  onClick={() => setViewMode('predicted')}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    viewMode === 'predicted' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Predicted
                </button>
              )}
              {predictedImage && (
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    viewMode === 'split' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Split
                </button>
              )}
            </div>

            {/* Bounding Box Toggle */}
            <button
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`p-2 rounded-lg border ${
                showBoundingBoxes 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              title={showBoundingBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
            >
              {showBoundingBoxes ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col bg-white rounded-lg border border-gray-200 shadow-lg">
        <button
          onClick={zoomIn}
          className="p-2 hover:bg-gray-50 border-b border-gray-200"
          title="Zoom In"
        >
          <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={resetZoom}
          className="p-2 hover:bg-gray-50 border-b border-gray-200"
          title="Reset Zoom"
        >
          <ArrowsPointingOutIcon className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-gray-50"
          title="Zoom Out"
        >
          <MagnifyingGlassMinusIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Image Container */}
      <div className="relative overflow-auto bg-gray-100" style={{ height: '600px' }}>
        {viewMode === 'split' && predictedImage ? (
          <div className="flex h-full">
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm z-10">
                Original
              </div>
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-full object-contain"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
            <div className="flex-1 relative overflow-hidden border-l border-gray-300">
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm z-10">
                Predicted
              </div>
              <img
                src={predictedImage}
                alt="Predicted"
                className="w-full h-full object-contain"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <img
              ref={imageRef}
              src={viewMode === 'predicted' && predictedImage ? predictedImage : originalImage}
              alt={viewMode === 'predicted' ? 'Predicted' : 'Original'}
              className="w-full h-full object-contain"
              style={{ transform: `scale(${zoom})` }}
              onLoad={handleImageLoad}
            />
            {viewMode === 'original' && renderBoundingBoxes()}
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Zoom: {(zoom * 100).toFixed(0)}% | 
            Size: {imageSize.width} × {imageSize.height}px
          </div>
          {detectionResult && (
            <div>
              Detections: {detectionResult.boxes.length} objects found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;