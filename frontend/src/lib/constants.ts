// Application constants and configuration

// Construction safety labels for YOLO detection
export const CONSTRUCTION_LABELS = {
  SAFETY_EQUIPMENT: [
    'hard_hat',
    'safety_vest',
    'safety_boots',
    'safety_gloves',
    'safety_glasses',
    'harness'
  ],
  HAZARDS: [
    'exposed_rebar',
    'open_excavation',
    'unstable_structure',
    'electrical_hazard',
    'fall_hazard',
    'heavy_machinery'
  ],
  EQUIPMENT: [
    'crane',
    'excavator',
    'bulldozer',
    'concrete_mixer',
    'scaffolding',
    'ladder'
  ],
  PERSONNEL: [
    'worker',
    'supervisor',
    'visitor'
  ]
};

// Color scheme for different detection classes
export const DETECTION_COLORS = {
  SAFETY_EQUIPMENT: '#22c55e', // green
  HAZARDS: '#ef4444', // red
  EQUIPMENT: '#3b82f6', // blue
  PERSONNEL: '#f59e0b', // amber
  DEFAULT: '#6b7280' // gray
};

// Theme configuration
export const THEME = {
  colors: {
    primary: '#1e40af',
    secondary: '#64748b',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  DETECT: '/api/detect',
  ANALYZE: '/api/analyze',
  TRAIN: '/api/train',
  CHAT: '/api/chat'
};

// File upload constraints
export const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 10
};

// TODO: Add more constants as needed