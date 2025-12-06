// Event categories - Must match backend validation
export const EVENT_CATEGORIES = [
  'Workshop',
  'Seminar',
  'Social',
  'Sports',
  'Cultural',
  'Career',
  'Hackathon',
  'Conference',
  'Club Meeting',
  'Other',
];

// Alias for easier import
export const CATEGORIES = EVENT_CATEGORIES;

// Category colors for chips/badges
export const CATEGORY_COLORS = {
  Workshop: '#9c27b0',
  Seminar: '#1976d2',
  Social: '#ec407a',
  Sports: '#4caf50',
  Cultural: '#00bcd4',
  Career: '#ff9800',
  Hackathon: '#3f51b5',
  Conference: '#673ab7',
  'Club Meeting': '#00897b',
  Other: '#757575',
};

// Category icons
export const CATEGORY_ICONS = {
  Workshop: '🛠️',
  Seminar: '📚',
  Social: '🎉',
  Sports: '⚽',
  Cultural: '🎭',
  Career: '💼',
  Hackathon: '💻',
  Conference: '🎤',
  'Club Meeting': '👥',
  Other: '📌',
};

// Get category icon
export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || '📌';
};

// Get category color
export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || '#757575';
};

// Get category label
export const getCategoryLabel = (category) => {
  return category || 'Other';
};

// API endpoints
export const API_ENDPOINTS = {
  EVENTS: '/api/v1/events',
  EVENT_BY_ID: (id) => `/api/v1/events/${id}`,
  RSVPS: '/api/v1/rsvps',
  RSVP_BY_ID: (id) => `/api/v1/rsvps/${id}`,
  USER_RSVPS: (userId) => `/api/v1/users/${userId}/rsvps`,
  EVENT_RSVPS: (eventId) => `/api/v1/events/${eventId}/rsvps`,
  ANALYTICS: '/api/v1/analytics',
  STATISTICS: '/api/v1/analytics/statistics',
  CATEGORIES: '/api/v1/analytics/categories',
  TRENDS: '/api/v1/analytics/trends',
  ATTENDANCE: '/api/v1/analytics/attendance',
};

// WebSocket events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  EVENT_CREATED: 'event:created',
  EVENT_UPDATED: 'event:updated',
  EVENT_DELETED: 'event:deleted',
  RSVP_CREATED: 'rsvp:created',
  RSVP_CANCELLED: 'rsvp:cancelled',
  CAPACITY_WARNING: 'capacity:warning',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48];

// Capacity thresholds
export const CAPACITY_THRESHOLDS = {
  LOW: 50, // Below 50% is low
  MEDIUM: 80, // 50-80% is medium
  HIGH: 90, // 80-90% is high
  FULL: 100, // Above 90% is nearly full
};

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'hh:mm a',
  DATETIME: 'MMM dd, yyyy hh:mm a',
};

// Toast notification durations (ms)
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  EVENT_FULL: 'This event has reached maximum capacity.',
  ALREADY_REGISTERED: 'You are already registered for this event.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  EVENT_CREATED: 'Event created successfully!',
  EVENT_UPDATED: 'Event updated successfully!',
  EVENT_DELETED: 'Event deleted successfully!',
  RSVP_CREATED: 'Successfully registered for event!',
  RSVP_CANCELLED: 'RSVP cancelled successfully!',
};

// Form validation limits
export const VALIDATION_LIMITS = {
  EVENT_TITLE_MIN: 3,
  EVENT_TITLE_MAX: 100,
  EVENT_DESC_MIN: 10,
  EVENT_DESC_MAX: 1000,
  EVENT_LOCATION_MAX: 200,
  EVENT_CAPACITY_MIN: 1,
  EVENT_CAPACITY_MAX: 5000,
  RSVP_NAME_MAX: 100,
  RSVP_EMAIL_MAX: 100,
};

// LocalStorage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'campus_events_user_prefs',
  AUTH_TOKEN: 'campus_events_auth_token',
  USER_DATA: 'campus_events_user_data',
};

// Breakpoints (matching MUI theme)
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
};

// Chart colors
export const CHART_COLORS = [
  '#1976d2',
  '#ec407a',
  '#4caf50',
  '#ff9800',
  '#9c27b0',
  '#00bcd4',
  '#3f51b5',
  '#f44336',
];

export default {
  EVENT_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  getCategoryIcon,
  getCategoryColor,
  getCategoryLabel,
  API_ENDPOINTS,
  WS_EVENTS,
  DEFAULT_PAGE_SIZE,
  CAPACITY_THRESHOLDS,
  TOAST_DURATION,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_LIMITS,
  STORAGE_KEYS,
  BREAKPOINTS,
  CHART_COLORS,
};
