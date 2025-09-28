"use client";

import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  CpuChipIcon,
  UserIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";

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

interface DetectionSummaryProps {
  detectionResult: DetectionResult;
  processingTime?: number;
}

const DetectionSummary: React.FC<DetectionSummaryProps> = ({
  detectionResult,
  processingTime
}) => {
  const getClassIcon = (className: string) => {
    const icons = {
      'safety-equipment': ShieldCheckIcon,
      'hazards': ExclamationTriangleIcon,
      'equipment': CpuChipIcon,
      'personnel': UserIcon,
      'structures': BuildingOfficeIcon
    };
    return icons[className as keyof typeof icons] || CpuChipIcon;
  };

  const getClassColor = (className: string) => {
    const colors = {
      'safety-equipment': 'text-green-600 bg-green-50 border-green-200',
      'hazards': 'text-red-600 bg-red-50 border-red-200',
      'equipment': 'text-blue-600 bg-blue-50 border-blue-200',
      'personnel': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'structures': 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colors[className as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Group detections by class
  const classGroups = detectionResult.classes.reduce((acc, className, index) => {
    if (!acc[className]) {
      acc[className] = {
        count: 0,
        scores: [],
        avgConfidence: 0
      };
    }
    acc[className].count++;
    acc[className].scores.push(detectionResult.scores[index]);
    return acc;
  }, {} as Record<string, { count: number; scores: number[]; avgConfidence: number }>);

  // Calculate average confidence for each class
  Object.keys(classGroups).forEach(className => {
    const scores = classGroups[className].scores;
    classGroups[className].avgConfidence = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  });

  const totalDetections = detectionResult.boxes.length;
  const averageConfidence = detectionResult.scores.reduce((sum, score) => sum + score, 0) / detectionResult.scores.length;
  const highConfidenceCount = detectionResult.scores.filter(score => score > 0.8).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="axium-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{totalDetections}</div>
            <div className="text-sm text-gray-600">Total Objects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {(averageConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">{highConfidenceCount}</div>
            <div className="text-sm text-gray-600">High Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {processingTime ? `${processingTime}ms` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Processing Time</div>
          </div>
        </div>
      </div>

      {/* Class Breakdown */}
      <div className="axium-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Breakdown</h3>
        <div className="space-y-3">
          {Object.entries(classGroups).map(([className, data]) => {
            const Icon = getClassIcon(className);
            const colorClasses = getClassColor(className);
            
            return (
              <div key={className} className={`p-4 rounded-lg border ${colorClasses}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-6 h-6" />
                    <div>
                      <div className="font-medium capitalize">
                        {className.replace('-', ' ')}
                      </div>
                      <div className="text-sm opacity-75">
                        {data.count} object{data.count !== 1 ? 's' : ''} detected
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {(data.avgConfidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm opacity-75">confidence</div>
                  </div>
                </div>
                
                {/* Confidence Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Confidence Distribution</span>
                    <span>{data.count} detections</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${data.avgConfidence * 100}%`,
                        backgroundColor: data.avgConfidence > 0.8 ? '#10b981' : 
                                       data.avgConfidence > 0.6 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className="axium-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Analysis</h3>
        <div className="space-y-4">
          {/* High Confidence */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">High Confidence (80%+)</span>
            </div>
            <div className="text-green-700 font-semibold">
              {detectionResult.scores.filter(score => score >= 0.8).length} objects
            </div>
          </div>

          {/* Medium Confidence */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="font-medium text-yellow-800">Medium Confidence (60-80%)</span>
            </div>
            <div className="text-yellow-700 font-semibold">
              {detectionResult.scores.filter(score => score >= 0.6 && score < 0.8).length} objects
            </div>
          </div>

          {/* Low Confidence */}
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium text-red-800">Low Confidence (&lt;60%)</span>
            </div>
            <div className="text-red-700 font-semibold">
              {detectionResult.scores.filter(score => score < 0.6).length} objects
            </div>
          </div>
        </div>
      </div>

      {/* Safety Status */}
      {classGroups['hazards'] && (
        <div className="axium-card p-6 border-l-4 border-red-500">
          <div className="flex items-center space-x-3 mb-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Safety Alert</h3>
          </div>
          <p className="text-red-700">
            {classGroups['hazards'].count} potential hazard{classGroups['hazards'].count !== 1 ? 's' : ''} detected. 
            Please review and take appropriate safety measures.
          </p>
        </div>
      )}
    </div>
  );
};

export default DetectionSummary;