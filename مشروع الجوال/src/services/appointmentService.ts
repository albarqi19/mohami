import { apiClient } from "@/utils/api";
import type { ApiResponse } from "@/utils/api";
import type { Appointment } from "@/types";

const toAppointment = (appointment: any): Appointment => ({
  ...appointment,
  case_id: appointment.case_id ?? appointment.caseId,
  scheduled_at:
    appointment.scheduled_at instanceof Date
      ? appointment.scheduled_at
      : new Date(appointment.scheduled_at),
  created_at:
    appointment.created_at instanceof Date ? appointment.created_at : new Date(appointment.created_at),
  updated_at:
    appointment.updated_at instanceof Date ? appointment.updated_at : new Date(appointment.updated_at),
  priority: appointment.priority ?? "medium",
  reminders: appointment.reminders?.map((value: string | number) => value.toString()) ?? [],
  attendees: appointment.attendees ?? [],
  notes: appointment.notes ?? undefined
});

export class AppointmentService {
  static async getCaseAppointments(caseId: string): Promise<Appointment[]> {
    const response = await apiClient.get<ApiResponse<Appointment[] | any[]>>(`/cases/${caseId}/appointments`);

    if (response.success && response.data) {
      return (response.data as any[]).map(toAppointment);
    }

    throw new Error(response.message || "فشل في جلب مواعيد القضية");
  }
}
