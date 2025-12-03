<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CaseModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AppointmentController extends Controller
{
    /**
     * الحصول على مواعيد القضية
     */
    public function getCaseAppointments(string $caseId): JsonResponse
    {
        try {
            $appointments = Appointment::where('case_id', $caseId)
                ->with(['creator', 'assignee'])
                ->orderBy('scheduled_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $appointments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب المواعيد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * الحصول على موعد محدد
     */
    public function show(string $id): JsonResponse
    {
        try {
            $appointment = Appointment::with(['creator', 'assignee', 'case'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب الموعد: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * إنشاء موعد جديد
     */
    public function store(Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('Creating appointment with data:', $request->all());
        \Illuminate\Support\Facades\Log::info('Request headers:', $request->headers->all());
        
        try {
            \Illuminate\Support\Facades\Log::info('Starting validation...');
            
            $request->validate([
                'case_id' => 'required|exists:cases,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:court_hearing,client_meeting,team_meeting,document_filing,arbitration,consultation,mediation,settlement,other',
                'scheduled_at' => 'required|date',
                'duration_minutes' => 'nullable|integer|min:15|max:480',
                'location' => 'nullable|string|max:255',
                'attendees' => 'nullable|array',
                'priority' => 'nullable|in:low,medium,high,urgent',
                'notes' => 'nullable|string',
                'reminders' => 'nullable|array',
                'assigned_to' => 'nullable|exists:users,id'
            ]);

            \Illuminate\Support\Facades\Log::info('Validation passed, creating appointment...');
            
            $appointmentData = [
                'case_id' => $request->case_id,
                'title' => $request->title,
                'description' => $request->description,
                'type' => $request->type,
                'scheduled_at' => $request->scheduled_at,
                'duration_minutes' => $request->duration_minutes ?? 60,
                'location' => $request->location,
                'attendees' => $request->attendees ?? [],
                'priority' => $request->priority ?? 'medium',
                'notes' => $request->notes,
                'reminders' => $request->reminders ?? [],
                'assigned_to' => $request->assigned_to,
                'created_by' => 1 // سنحتاج لتحديث هذا من المصادقة
            ];

            \Illuminate\Support\Facades\Log::info('Data for appointment creation:', $appointmentData);

            $appointment = Appointment::create($appointmentData);

            \Illuminate\Support\Facades\Log::info('Appointment created successfully with ID: ' . $appointment->id);

            $appointment->load(['creator', 'assignee', 'case']);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الموعد بنجاح',
                'data' => $appointment
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Validation failed:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صحيحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error creating appointment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'فشل في إنشاء الموعد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * تحديث موعد
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|in:court_hearing,client_meeting,team_meeting,document_filing,arbitration,consultation,mediation,settlement,other',
            'scheduled_at' => 'nullable|date',
            'duration_minutes' => 'nullable|integer|min:15|max:480',
            'location' => 'nullable|string|max:255',
            'attendees' => 'nullable|array',
            'status' => 'nullable|in:scheduled,confirmed,in_progress,completed,cancelled,postponed,no_show',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'notes' => 'nullable|string',
            'reminders' => 'nullable|array',
            'assigned_to' => 'nullable|exists:users,id',
            'outcome' => 'nullable|string',
            'cancellation_reason' => 'nullable|string'
        ]);

        try {
            // إذا تم تأجيل الموعد
            if ($request->scheduled_at && $request->scheduled_at !== $appointment->scheduled_at->toISOString()) {
                $appointment->rescheduled_from = $appointment->scheduled_at;
            }

            $appointment->update($request->only([
                'title', 'description', 'type', 'scheduled_at', 'duration_minutes',
                'location', 'attendees', 'status', 'priority', 'notes', 'reminders',
                'assigned_to', 'outcome', 'cancellation_reason'
            ]));

            $appointment->load(['creator', 'assignee', 'case']);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث الموعد بنجاح',
                'data' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في تحديث الموعد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * حذف موعد
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->delete();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف الموعد بنجاح'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في حذف الموعد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * تأكيد موعد
     */
    public function confirm(string $id): JsonResponse
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->update(['status' => 'confirmed']);

            return response()->json([
                'success' => true,
                'message' => 'تم تأكيد الموعد بنجاح',
                'data' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في تأكيد الموعد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * إلغاء موعد
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'cancellation_reason' => 'required|string'
        ]);

        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->update([
                'status' => 'cancelled',
                'cancellation_reason' => $request->cancellation_reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إلغاء الموعد بنجاح',
                'data' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في إلغاء الموعد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * تأجيل موعد
     */
    public function reschedule(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'new_scheduled_at' => 'required|date|after:now'
        ]);

        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->update([
                'rescheduled_from' => $appointment->scheduled_at,
                'scheduled_at' => $request->new_scheduled_at,
                'status' => 'scheduled'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تأجيل الموعد بنجاح',
                'data' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في تأجيل الموعد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * بدء موعد
     */
    public function start(string $id): JsonResponse
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->update(['status' => 'in_progress']);

            return response()->json([
                'success' => true,
                'message' => 'تم بدء الموعد',
                'data' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في بدء الموعد: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * إنهاء موعد
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'outcome' => 'nullable|string'
        ]);

        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->update([
                'status' => 'completed',
                'outcome' => $request->outcome
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنهاء الموعد بنجاح',
                'data' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل في إنهاء الموعد: ' . $e->getMessage()
            ], 500);
        }
    }
}
