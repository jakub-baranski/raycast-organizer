import { ApiClient } from "../../services/api";
import { AuthService } from "../../services/auth";
import { API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from "../../constants";

jest.mock("@raycast/api");
jest.mock("../../services/auth");

global.fetch = jest.fn();

describe("ApiClient", () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = new ApiClient();
  });

  describe("login", () => {
    it("should successfully login and return tokens", async () => {
      const mockResponse = {
        access: "access-token",
        refresh: "refresh-token",
        accessExpiration: "2024-12-31T23:59:59Z",
        refreshExpiration: "2025-12-31T23:59:59Z",
        user: { id: 1, firstName: "John", lastName: "Doe" },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.login("test@example.com", "password123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.LOGIN),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failed login", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
      });

      await expect(apiClient.login("test@example.com", "wrong")).rejects.toThrow("API Error: Unauthorized");
    });
  });

  describe("getMyRequests", () => {
    it("should fetch user requests with valid token", async () => {
      const mockRequests = [
        {
          id: 1,
          startDate: "2024-01-01",
          endDate: "2024-01-05",
          status: "PD",
          requestType: "VC",
        },
      ];

      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockRequests }),
      });

      const result = await apiClient.getMyRequests();

      expect(result).toEqual(mockRequests);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.MY_REQUESTS),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer valid-token",
          }),
        })
      );
    });

    it("should refresh token and retry on 401 error", async () => {
      const mockRequests = [{ id: 1 }];

      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("expired-token");
      (AuthService.getRefreshToken as jest.Mock).mockResolvedValue("refresh-token");

      // First call returns 401
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: HTTP_STATUS.UNAUTHORIZED,
        })
        // Refresh token call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access: "new-token",
            refresh: "new-refresh",
            accessExpiration: "2024-12-31",
            refreshExpiration: "2025-12-31",
          }),
        })
        // Retry with new token
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: mockRequests }),
        });

      const result = await apiClient.getMyRequests();

      expect(result).toEqual(mockRequests);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should throw error if no refresh token available", async () => {
      (AuthService.getAccessToken as jest.Mock).mockResolvedValue(undefined);
      (AuthService.getRefreshToken as jest.Mock).mockResolvedValue(undefined);

      await expect(apiClient.getMyRequests()).rejects.toThrow(ERROR_MESSAGES.AUTH_REQUIRED);
    });
  });

  describe("createRequest", () => {
    it("should create a new request successfully", async () => {
      const requestData = {
        requestType: "VC",
        startDate: "2024-01-01",
        endDate: "2024-01-05",
        note: "Vacation",
      };

      const mockResponse = { id: 1, ...requestData };

      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.createRequest(requestData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.EMPLOYEE_REQUESTS),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(requestData),
        })
      );
    });

    it("should throw error on failed request creation", async () => {
      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
      });

      await expect(
        apiClient.createRequest({
          requestType: "VC",
          startDate: "2024-01-01",
          endDate: "2024-01-05",
        })
      ).rejects.toThrow("API Error: Bad Request");
    });
  });

  describe("cancelRequest", () => {
    it("should cancel a request successfully", async () => {
      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: HTTP_STATUS.NO_CONTENT,
      });

      await apiClient.cancelRequest(123);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/calendar/employee-requests/123/cancel-request/"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should throw error on failed cancellation", async () => {
      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("valid-token");
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: "Not Found",
      });

      await expect(apiClient.cancelRequest(999)).rejects.toThrow("API Error: Not Found");
    });
  });

  describe("token refresh mechanism", () => {
    it("should not refresh if already refreshing", async () => {
      const mockRequests = [{ id: 1 }];

      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("expired-token");
      (AuthService.getRefreshToken as jest.Mock).mockResolvedValue("refresh-token");

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: HTTP_STATUS.UNAUTHORIZED,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: HTTP_STATUS.UNAUTHORIZED,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access: "new-token",
            refresh: "new-refresh",
            accessExpiration: "2024-12-31",
            refreshExpiration: "2025-12-31",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: mockRequests }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: mockRequests }),
        });

      // Make two simultaneous requests
      const [result1, result2] = await Promise.all([
        apiClient.getMyRequests(),
        apiClient.getMyRequests(),
      ]);

      expect(result1).toEqual(mockRequests);
      expect(result2).toEqual(mockRequests);
      // Should only refresh once despite two requests
      expect(global.fetch).toHaveBeenCalledTimes(5); // 2 initial 401s, 1 refresh, 2 retries
    });

    it("should clear tokens on refresh failure", async () => {
      (AuthService.getAccessToken as jest.Mock).mockResolvedValue("expired-token");
      (AuthService.getRefreshToken as jest.Mock).mockResolvedValue("refresh-token");

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: HTTP_STATUS.UNAUTHORIZED,
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Invalid refresh token",
        });

      await expect(apiClient.getMyRequests()).rejects.toThrow(ERROR_MESSAGES.SESSION_EXPIRED);
      expect(AuthService.clearTokens).toHaveBeenCalled();
    });
  });
});
