// Utility functions for formatting data between frontend and backend

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YOLODetection {
  class: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface VLMResponse {
  description: string;
  safety_issues: string[];
  recommendations: string[];
}

// TODO: Implement formatting functions
export const formatters = {
  // Convert YOLO format to frontend format
  yoloToFrontend: (yoloData: any): YOLODetection[] => {
    // TODO: Implement YOLO data formatting
    console.log('Format YOLO data:', yoloData);
    return [];
  },

  // Convert frontend annotations to YOLO format
  frontendToYolo: (annotations: any[]): any => {
    // TODO: Implement frontend to YOLO formatting
    console.log('Format annotations to YOLO:', annotations);
    return {};
  },

  // Format VLM response
  formatVLMResponse: (response: any): VLMResponse => {
    // TODO: Implement VLM response formatting
    console.log('Format VLM response:', response);
    return {
      description: '',
      safety_issues: [],
      recommendations: []
    };
  },

  // Format bounding box coordinates
  normalizeBoundingBox: (bbox: BoundingBox, imageWidth: number, imageHeight: number): BoundingBox => {
    // TODO: Implement bounding box normalization
    return bbox;
  },
};