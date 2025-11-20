import { apiClient } from "@/utils/api";
import type { ApiResponse, PaginatedResponse } from "@/utils/api";
import type { Task } from "@/types";

export interface TaskFilters {
  status?: string;
  priority?: string;
  type?: string;
  assigned_to?: string;
  case_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const toTask = (task: any): Task => ({
  ...task,
  dueDate: task.due_date ? new Date(task.due_date) : undefined,
  createdAt: task.created_at ? new Date(task.created_at) : new Date(),
  updatedAt: task.updated_at ? new Date(task.updated_at) : new Date(),
  completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
  estimatedHours: task.estimated_hours,
  actualHours: task.actual_hours,
  assignedTo: task.assigned_to,
  assignedBy: task.assigned_by,
  caseId: task.case_id
});

export class TaskService {
  static async getTasks(filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : "/tasks";

    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(endpoint);

    if (response.success && response.data) {
      const mapped = response.data.data.map(toTask);
      return { ...response.data, data: mapped } as PaginatedResponse<Task>;
    }

    throw new Error(response.message || "فشل في جلب المهام");
  }

  static async updateTaskStatus(id: string, status: string) {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}/status`, { status });

    if (response.success && response.data) {
      return toTask(response.data);
    }

    throw new Error(response.message || "فشل في تحديث حالة المهمة");
  }
}
