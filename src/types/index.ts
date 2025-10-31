export interface Employee {
  firstName: string;
  lastName: string;
  picture: string;
  id: number;
}

export interface Project {
  name: string;
  color: string;
}

export interface EmployeeRequest {
  id: number;
  startDate: string;
  endDate: string;
  status: string;
  note: string | null;
  checkBy: string | null;
  adminNote: string | null;
  startTime: string | null;
  endTime: string | null;
  requestType: string;
  employee: Employee;
  breaks: RequestBreak[];
  created: string;
  projects: Project[];
  warnings: RequestWarning[];
}

export interface RequestBreak {
  id?: number;
  start: string;
  end: string;
}

export interface RequestWarning {
  id: number;
  warningType: string;
  project: string;
}

export interface CreateRequestData {
  requestType: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  breaks?: Array<{ start: string; end: string }>;
  note?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  accessExpiration: string;
  refreshExpiration: string;
}

export interface User {
  id: number;
  profile: UserProfile;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  notificationRefuses: NotificationRefuse[];
}

export interface UserProfile {
  picture: string;
  role: Role;
  isIntern: boolean;
  canTakeUniversity: boolean;
  canReceiveBonus: boolean;
  canReceiveThanks: boolean;
  categories: number[];
  phoneShareAgreement: boolean;
}

export interface Role {
  id: number;
  name: string;
  maxBonusValue: string;
}

export interface NotificationRefuse {
  eventSource: string;
  destination: string;
}

export interface Preferences {
  apiUrl: string;
}

export const REQUEST_STATUS = {
  ACCEPTED: "AC",
  PENDING: "PD",
  REJECTED: "RE",
  CANCELLED: "CA",
} as const;

export const REQUEST_TYPE = {
  REMOTE_WORK: "RW",
  VACATION: "VC",
  BUSINESS: "BS",
  VACATION_ON_DEMAND: "OD",
  CUSTOM_TIME: "CT",
} as const;
