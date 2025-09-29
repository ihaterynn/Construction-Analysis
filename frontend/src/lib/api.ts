import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add request interceptor for better error handling
API.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
API.interceptors.response.use(
  (response) => {
    console.log(`Response received: ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    console.error('Response error:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server may be processing large files');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - check if backend server is running');
    }
    return Promise.reject(error);
  }
);

// Detection API
export const detectObjects = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  return API.post("/detect/", formData);
};

// VLM API
export const queryVLM = async (file: File, instruction: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("instruction", instruction);
  
  return API.post("/vlm/", formData);
};

// Analysis History API
export const getAnalyses = async (search?: string, status?: string, sortBy?: string) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (sortBy) params.append('sort_by', sortBy);
  
  return API.get(`/analysis/?${params.toString()}`);
};

export const getAnalysis = async (analysisId: string) => {
  return API.get(`/analysis/${analysisId}`);
};

export const saveAnalysis = async (
  filename: string, 
  detectionResult: any, 
  processingTime: number, 
  imageFile: File
) => {
  const formData = new FormData();
  formData.append('filename', filename);
  formData.append('detection_result', JSON.stringify(detectionResult));
  formData.append('processing_time', processingTime.toString());
  formData.append('image_file', imageFile);
  
  return API.post('/analysis/', formData);
};

export const deleteAnalysis = async (analysisId: string) => {
  return API.delete(`/analysis/${analysisId}`);
};

export const getAnalysisImage = async (analysisId: string) => {
  return API.get(`/analysis/${analysisId}/image`, {
    responseType: 'blob'
  });
};

export default API;
