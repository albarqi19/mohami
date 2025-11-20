import { apiClient } from "@/utils/api";
import type { ApiResponse, PaginatedResponse } from "@/utils/api";
import type { Case } from "@/types";

export interface CaseFilters {
  status?: string;
  case_type?: string;
  priority?: string;
  assigned_lawyer?: string;
  client_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CaseService {
  static async getCases(filters: CaseFilters = {}): Promise<PaginatedResponse<Case>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/cases?${queryString}` : "/cases";

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Case>>>(endpoint);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "فشل في جلب القضايا");
  }

  static async getCase(id: string): Promise<Case> {
    const response = await apiClient.get<ApiResponse<Case>>(`/cases/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "فشل في جلب تفاصيل القضية");
  }
}
