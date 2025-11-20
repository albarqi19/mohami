import { apiClient } from "@/utils/api";
import type { ApiResponse } from "@/utils/api";
import type { User, LoginForm } from "@/types";

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  name: string;
  national_id: string;
  email: string;
  pin: string;
  pin_confirmation: string;
  role: string;
  phone?: string;
}

export class AuthService {
  static async login(credentials: LoginForm): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login", {
      national_id: credentials.nationalId,
      pin: credentials.pin
    });

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    } else {
      throw new Error(response.message || "فشل في تسجيل الدخول");
    }
  }

  static async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/register", userData);

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    } else {
      throw new Error(response.message || "فشل في التسجيل");
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.warn("Logout API call failed:", error);
    } finally {
      apiClient.setToken(null);
    }
  }

  static async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me");

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || "فشل في جلب بيانات المستخدم");
    }
  }

  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>("/auth/profile", userData);

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || "فشل في تحديث البيانات");
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.put<ApiResponse>("/auth/password", {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword
    });

    if (!response.success) {
      throw new Error(response.message || "فشل في تغيير كلمة المرور");
    }
  }
}
