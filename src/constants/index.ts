export const STORAGE_KEYS = {
  LAST_USED_EMAIL: "last_used_email",
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  ACCESS_EXPIRY: "access_token_expiry",
  REFRESH_EXPIRY: "refresh_token_expiry",
  USER_DATA: "user_data",
} as const;

export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required. Please login.",
  SESSION_EXPIRED: "Session expired. Please login again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNKNOWN_ERROR: "Unknown error occurred",
  VALIDATION_ERROR: "Please enter both username and password",
} as const;

export const API_ENDPOINTS = {
  LOGIN: "/rest-auth/login/",
  REFRESH: "/rest-auth/token/refresh/",
  MY_REQUESTS: "/calendar/employee-requests/my/",
  EMPLOYEE_REQUESTS: "/calendar/employee-requests/",
  CANCEL_REQUEST: (id: number) => `/calendar/employee-requests/${id}/cancel-request/`,
} as const;

export const HTTP_STATUS = {
  NO_CONTENT: 204,
  UNAUTHORIZED: 401,
} as const;
