import { getPreferenceValues } from "@raycast/api";
import { AuthService } from "./auth";
import { Preferences, EmployeeRequest, PaginatedResponse, LoginResponse, CreateRequestData } from "../types";
import { API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES } from "../constants";

export class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    const preferences = getPreferenceValues<Preferences>();
    this.baseUrl = preferences.apiUrl || "https://api.organizer.profil-software.com";
  }

  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _doRefresh(): Promise<string> {
    const refreshToken = await AuthService.getRefreshToken();
    if (!refreshToken) {
      throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const url = `${this.baseUrl}${API_ENDPOINTS.REFRESH}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      await AuthService.clearTokens();
      throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
    }

    const data = (await response.json()) as {
      access: string;
      refresh: string;
      accessExpiration: string;
      refreshExpiration: string;
    };

    await AuthService.setTokens(
      data.access,
      data.refresh,
      data.accessExpiration,
      data.refreshExpiration,
      await AuthService.getUserData()
    );

    return data.access;
  }

  /**
   * Make an authenticated API request with automatic token refresh
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let token = await AuthService.getAccessToken();

    // If no valid access token, try to refresh
    if (!token) {
      const refreshToken = await AuthService.getRefreshToken();
      if (!refreshToken) {
        throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);
      }

      try {
        token = await this.refreshAccessToken();
      } catch (error) {
        throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get 401, try refreshing the token once
    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      try {
        const newToken = await this.refreshAccessToken();

        // Retry the request with new token
        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (error) {
        await AuthService.clearTokens();
        throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
      }
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    return this.publicRequest<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ email: username, password }),
    });
  }

  async getMyRequests(): Promise<EmployeeRequest[]> {
    const response = await this.request<PaginatedResponse<EmployeeRequest>>(API_ENDPOINTS.MY_REQUESTS);
    return response.results;
  }

  async createRequest(data: CreateRequestData): Promise<EmployeeRequest> {
    return this.request<EmployeeRequest>(API_ENDPOINTS.EMPLOYEE_REQUESTS, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelRequest(requestId: number): Promise<void> {
    await this.request<void>(API_ENDPOINTS.CANCEL_REQUEST(requestId), {
      method: "POST",
    });
  }
}
