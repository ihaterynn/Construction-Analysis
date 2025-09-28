"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ImageViewer from "@/components/ImageViewer";
import DetectionSummary from "@/components/DetectionSummary";
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  DocumentIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import { getAnalyses, deleteAnalysis } from "@/lib/api";

interface AnalysisResult {
  id: string;
  filename: string;
  upload_date: string;
  processing_time: number;
  detection_result: {
    boxes: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
    classes: string[];
    scores: number[];
  };
  image_url: string;
  status: string;
}

export default function ReviewPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analyses on component mount
  useEffect(() => {
    loadAnalyses();
  }, [searchTerm, filterStatus, sortBy]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await getAnalyses(searchTerm, filterStatus, sortBy);
      setAnalyses(response.data.analyses);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load analyses:', err);
      setError('Failed to load analysis history');
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await deleteAnalysis(analysisId);
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      
      // Clear selection if deleted analysis was selected
      if (selectedAnalysis?.id === analysisId) {
        setSelectedAnalysis(null);
      }
    } catch (err: any) {
      console.error('Failed to delete analysis:', err);
      alert('Failed to delete analysis');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatProcessingTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTotalStats = () => {
    const totalAnalyses = analyses.length;
    const totalObjects = analyses.reduce((sum, analysis) => sum + analysis.detection_result.boxes.length, 0);
    const avgProcessingTime = totalAnalyses > 0 
      ? analyses.reduce((sum, analysis) => sum + analysis.processing_time, 0) / totalAnalyses 
      : 0;
    const avgConfidence = totalAnalyses > 0 
      ? analyses.reduce((sum, analysis) => {
          const avgScore = analysis.detection_result.scores.length > 0
            ? analysis.detection_result.scores.reduce((a, b) => a + b, 0) / analysis.detection_result.scores.length
            : 0;
          return sum + avgScore;
        }, 0) / totalAnalyses
      : 0;

    return { totalAnalyses, totalObjects, avgProcessingTime, avgConfidence };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analysis Review
          </h1>
          <p className="text-gray-600">
            Review and manage your construction site analysis history.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="axium-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyses}</p>
              </div>
            </div>
          </div>
          
          <div className="axium-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Objects Detected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalObjects}</p>
              </div>
            </div>
          </div>
          
          <div className="axium-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">{formatProcessingTime(stats.avgProcessingTime)}</p>
              </div>
            </div>
          </div>
          
          <div className="axium-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">{(stats.avgConfidence * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis List */}
          <div className="lg:col-span-1">
            <div className="axium-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Analysis History</h2>
                <FunnelIcon className="w-5 h-5 text-gray-400" />
              </div>

              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search analyses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="filename">Sort by Name</option>
                    <option value="objects">Sort by Objects</option>
                  </select>
                </div>
              </div>

              {/* Analysis List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading analyses...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <DocumentIcon className="mx-auto h-12 w-12 text-red-300 mb-4" />
                    <p className="text-red-500">{error}</p>
                    <button 
                      onClick={loadAnalyses}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Try again
                    </button>
                  </div>
                ) : analyses.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">No analyses found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Upload some images to see analysis history
                    </p>
                  </div>
                ) : (
                  analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      onClick={() => setSelectedAnalysis(analysis)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAnalysis?.id === analysis.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate flex-1">
                          {analysis.filename}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(analysis.status)}`}>
                          {analysis.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{formatDate(analysis.upload_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{analysis.detection_result.boxes.length} objects detected</span>
                          <span>{formatProcessingTime(analysis.processing_time)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="lg:col-span-2">
            {selectedAnalysis ? (
              <div className="space-y-6">
                {/* Analysis Header */}
                <div className="axium-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedAnalysis.filename}
                      </h2>
                      <p className="text-gray-600">
                        Analyzed on {formatDate(selectedAnalysis.upload_date)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="axium-button-secondary flex items-center space-x-2">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteAnalysis(selectedAnalysis.id)}
                        className="axium-button-secondary flex items-center space-x-2 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image Viewer */}
                <ImageViewer
                  originalImage={`http://localhost:8000${selectedAnalysis.image_url}`}
                  detectionResult={selectedAnalysis.detection_result}
                  title={selectedAnalysis.filename}
                />

                {/* Detection Summary */}
                <DetectionSummary 
                  detectionResult={selectedAnalysis.detection_result}
                  processingTime={selectedAnalysis.processing_time}
                />
              </div>
            ) : (
              <div className="axium-card p-12 text-center">
                <EyeIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an Analysis
                </h3>
                <p className="text-gray-500">
                  Choose an analysis from the list to view detailed results and images.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
