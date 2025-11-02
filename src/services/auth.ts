import { LocalStorage } from "@raycast/api";
import { STORAGE_KEYS } from "../constants";

export class AuthService {
  static async setTokens(
    accessToken: string,
    refreshToken: string,
    accessExpiration: string,
    refreshExpiration: string,
    userData?: unknown
  ): Promise<void> {
    await LocalStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await LocalStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await LocalStorage.setItem(STORAGE_KEYS.ACCESS_EXPIRY, accessExpiration);
    await LocalStorage.setItem(STORAGE_KEYS.REFRESH_EXPIRY, refreshExpiration);
    if (userData) {
      await LocalStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    }
  }

  static async getAccessToken(): Promise<string | undefined> {
    const token = await LocalStorage.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      return undefined;
    }

    // Check if access token has expired
    const expiryStr = await LocalStorage.getItem<string>(STORAGE_KEYS.ACCESS_EXPIRY);
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      const now = new Date();

      // If expired or expiring in the next minute, return undefined to trigger refresh
      if (expiry <= new Date(now.getTime() + 60000)) {
        return undefined;
      }
    }

    return token;
  }

  static async getRefreshToken(): Promise<string | undefined> {
    const token = await LocalStorage.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
    if (!token) {
      return undefined;
    }

    // Check if refresh token has expired
    const expiryStr = await LocalStorage.getItem<string>(STORAGE_KEYS.REFRESH_EXPIRY);
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      if (expiry < new Date()) {
        await this.clearTokens();
        return undefined;
      }
    }

    return token;
  }

  static async getUserData(): Promise<unknown | undefined> {
    const userData = await LocalStorage.getItem<string>(STORAGE_KEYS.USER_DATA);
    if (!userData) {
      return undefined;
    }
    try {
      return JSON.parse(userData);
    } catch {
      return undefined;
    }
  }

  static async clearTokens(): Promise<void> {
    await LocalStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await LocalStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await LocalStorage.removeItem(STORAGE_KEYS.ACCESS_EXPIRY);
    await LocalStorage.removeItem(STORAGE_KEYS.REFRESH_EXPIRY);
    await LocalStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }
}
