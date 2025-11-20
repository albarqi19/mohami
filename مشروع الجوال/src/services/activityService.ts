import { apiClient } from "@/utils/api";
import type { ApiResponse } from "@/utils/api";
import type { Activity } from "@/types";

const toActivity = (activity: any): Activity => ({
  ...activity,
  caseId: activity.caseId ?? activity.case_id,
  taskId: activity.taskId ?? activity.task_id,
  performedBy: activity.performedBy ?? activity.performed_by ?? "system",
  performedAt: activity.performedAt
    ? activity.performedAt instanceof Date
      ? activity.performedAt
      : new Date(activity.performedAt)
    : new Date(),
  metadata: activity.metadata ?? undefined
});

export class ActivityService {
  static async getCaseActivities(caseId: string): Promise<Activity[]> {
    const response = await apiClient.get<ApiResponse<Activity[] | any[]>>(`/cases/${caseId}/activities`);

    if (response.success && response.data) {
      return (response.data as any[]).map(toActivity);
    }

    throw new Error(response.message || "فشل في جلب أنشطة القضية");
  }
}
