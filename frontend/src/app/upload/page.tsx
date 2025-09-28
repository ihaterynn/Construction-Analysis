"use client";

import { useState } from "react";
import { 
  CloudArrowUpIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";
import Navigation from "@/components/Navigation";
import ImageViewer from "@/components/ImageViewer";
import DetectionSummary from "@/components/DetectionSummary";
import { detectObjects, saveAnalysis } from "@/lib/api";

interface DetectionResult {
  boxes: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  classes: string[];
  scores: number[];
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const startTime = Date.now();
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await detectObjects(selectedFile);
      const endTime = Date.now();
      const processingTimeMs = endTime - startTime;
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setResult(response.data);
      setProcessingTime(processingTimeMs);

      // Save the analysis result to history
      try {
        await saveAnalysis(
          selectedFile.name,
          response.data,
          processingTimeMs,
          selectedFile
        );
        console.log('Analysis saved to history successfully');
      } catch (saveError) {
        console.error('Failed to save analysis to history:', saveError);
        // Don't show error to user as the main detection worked
      }

    } catch (err: any) {
      console.error('Detection error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to analyze image');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Construction Site Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload images of construction sites or floor plans to detect objects, 
            safety equipment, hazards, and generate detailed analysis reports.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="axium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
              
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected File Info */}
              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full mt-4 axium-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <CpuChipIcon className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze Image</span>
                )}
              </button>

              {/* Progress Bar */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">
                      Analysis complete! {result.boxes.length} objects detected.
                      <br />
                      <span className="text-xs">Saved to analysis history.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Detection Summary */}
            {result && (
              <DetectionSummary 
                detectionResult={result} 
                processingTime={processingTime || undefined}
              />
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {imagePreview ? (
              <ImageViewer
                originalImage={imagePreview}
                detectionResult={result || undefined}
                title="Construction Site Analysis"
              />
            ) : (
              <div className="axium-card p-12 text-center">
                <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Image Selected
                </h3>
                <p className="text-gray-500">
                  Upload an image to see the analysis results and detected objects.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 axium-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload Image</h4>
              <p className="text-sm text-gray-600">
                Select or drag & drop your construction site image or floorplan.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-600">
                Our YOLO model analyzes the image and detects various objects and hazards.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">View Results</h4>
              <p className="text-sm text-gray-600">
                Review detected objects, safety equipment, and potential hazards with confidence scores.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
