import { LocalStorage } from "@raycast/api";
import { AuthService } from "../../services/auth";
import { STORAGE_KEYS } from "../../constants";

jest.mock("@raycast/api");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setTokens", () => {
    it("should store all tokens and user data", async () => {
      const userData = { id: 1, email: "test@example.com" };
      
      await AuthService.setTokens(
        "access-token",
        "refresh-token",
        "2024-12-31T23:59:59Z",
        "2025-12-31T23:59:59Z",
        userData
      );

      expect(LocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, "access-token");
      expect(LocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN, "refresh-token");
      expect(LocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_EXPIRY, "2024-12-31T23:59:59Z");
      expect(LocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_EXPIRY, "2025-12-31T23:59:59Z");
      expect(LocalStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    });

    it("should store tokens without user data", async () => {
      await AuthService.setTokens(
        "access-token",
        "refresh-token",
        "2024-12-31T23:59:59Z",
        "2025-12-31T23:59:59Z"
      );

      expect(LocalStorage.setItem).toHaveBeenCalledTimes(4);
      expect(LocalStorage.setItem).not.toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA,
        expect.anything()
      );
    });
  });

  describe("getAccessToken", () => {
    it("should return token if not expired", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      (LocalStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce(futureDate.toISOString());

      const token = await AuthService.getAccessToken();

      expect(token).toBe("access-token");
    });

    it("should return undefined if token is expired", async () => {
      const pastDate = new Date(Date.now() - 1000 * 60); // 1 minute ago
      (LocalStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce(pastDate.toISOString());

      const token = await AuthService.getAccessToken();

      expect(token).toBeUndefined();
    });

    it("should return undefined if token expiring in less than 1 minute", async () => {
      const soonDate = new Date(Date.now() + 30 * 1000); // 30 seconds from now
      (LocalStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce(soonDate.toISOString());

      const token = await AuthService.getAccessToken();

      expect(token).toBeUndefined();
    });

    it("should return undefined if no token exists", async () => {
      (LocalStorage.getItem as jest.Mock).mockResolvedValue(undefined);

      const token = await AuthService.getAccessToken();

      expect(token).toBeUndefined();
    });

    it("should return token if no expiry is set", async () => {
      (LocalStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce(undefined);

      const token = await AuthService.getAccessToken();

      expect(token).toBe("access-token");
    });
  });

  describe("getRefreshToken", () => {
    it("should return token if not expired", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now
      (LocalStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("refresh-token")
        .mockResolvedValueOnce(futureDate.toISOString());

      const token = await AuthService.getRefreshToken();

      expect(token).toBe("refresh-token");
    });

    it("should clear tokens and return undefined if expired", async () => {
      const pastDate = new Date(Date.now() - 1000 * 60); // 1 minute ago
      (LocalStorage.getItem as jest.Mock)
        .mockResolvedValueOnce("refresh-token")
        .mockResolvedValueOnce(pastDate.toISOString());

      const token = await AuthService.getRefreshToken();

      expect(token).toBeUndefined();
      expect(LocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(LocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
    });

    it("should return undefined if no token exists", async () => {
      (LocalStorage.getItem as jest.Mock).mockResolvedValue(undefined);

      const token = await AuthService.getRefreshToken();

      expect(token).toBeUndefined();
    });
  });

  describe("getUserData", () => {
    it("should return parsed user data", async () => {
      const userData = { id: 1, email: "test@example.com" };
      (LocalStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(userData));

      const result = await AuthService.getUserData();

      expect(result).toEqual(userData);
    });

    it("should return undefined if no data exists", async () => {
      (LocalStorage.getItem as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.getUserData();

      expect(result).toBeUndefined();
    });

    it("should return undefined if JSON parsing fails", async () => {
      (LocalStorage.getItem as jest.Mock).mockResolvedValue("invalid-json{");

      const result = await AuthService.getUserData();

      expect(result).toBeUndefined();
    });
  });

  describe("clearTokens", () => {
    it("should remove all stored tokens and user data", async () => {
      await AuthService.clearTokens();

      expect(LocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(LocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      expect(LocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_EXPIRY);
      expect(LocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_EXPIRY);
      expect(LocalStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA);
      expect(LocalStorage.removeItem).toHaveBeenCalledTimes(5);
    });
  });
});
