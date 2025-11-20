import { apiClient } from "@/utils/api";
import type { ApiResponse } from "@/utils/api";
import type { Document } from "@/types";

export class DocumentService {
  static async getCaseDocuments(caseId: string): Promise<Document[]> {
    const response = await apiClient.get<ApiResponse<Document[]>>(`/cases/${caseId}/documents`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "فشل في جلب وثائق القضية");
  }
}
