import { apiClient } from "@/utils/api";
import type { ApiResponse, PaginatedResponse } from "@/utils/api";
import type { User } from "@/types";

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class UserService {
  static async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/users?${queryString}` : "/users";
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(endpoint);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "فشل في جلب المستخدمين");
  }

  static async getLawyers(): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[] | PaginatedResponse<User>>>("/users?role=lawyer");

    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return response.data.data;
    }

    throw new Error(response.message || "فشل في جلب المحامين");
  }

  static async getClients(): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[] | PaginatedResponse<User>>>("/users?role=client");

    if (response.success && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return response.data.data;
    }

    throw new Error(response.message || "فشل في جلب العملاء");
  }
}
