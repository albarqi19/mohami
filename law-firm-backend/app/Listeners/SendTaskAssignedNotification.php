<?php

namespace App\Listeners;

use App\Events\TaskAssigned;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendTaskAssignedNotification
{

    protected $whatsappService;

    /**
     * Create the event listener.
     */
    public function __construct(WhatsappService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Handle the event.
     */
    public function handle(TaskAssigned $event): void
    {
        try {
            $task = $event->task;
            $assignedTo = $event->assignedTo;

            if ($assignedTo->phone) {
                $variables = [
                    'lawyer_name' => $assignedTo->name,
                    'task_title' => $task->title ?? 'مهمة جديدة',
                    'task_description' => $task->description ?? '',
                    'case_number' => $task->case->case_number ?? 'غير محدد',
                    'case_title' => $task->case->title ?? 'غير محدد',
                    'priority' => $this->getPriorityInArabic($task->priority ?? 'medium'),
                    'due_date' => isset($task->due_date) ? date('Y-m-d', strtotime($task->due_date)) : 'غير محدد',
                    'estimated_hours' => $task->estimated_hours ?? 'غير محدد'
                ];

                $this->whatsappService->sendTemplateMessage(
                    $assignedTo->phone,
                    'task_assigned',
                    $variables,
                    [
                        'task_id' => $task->id ?? null,
                        'case_id' => $task->case_id ?? null,
                        'user_id' => $assignedTo->id,
                        'event_type' => 'task_assigned'
                    ]
                );
            }

            Log::info('Task assigned notification sent', [
                'task_id' => $task->id ?? 'unknown',
                'assigned_to' => $assignedTo->id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send task assigned notification', [
                'task_id' => $event->task->id ?? 'unknown',
                'assigned_to' => $event->assignedTo->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    private function getPriorityInArabic($priority): string
    {
        $priorities = [
            'low' => 'منخفضة',
            'medium' => 'متوسطة', 
            'high' => 'عالية',
            'urgent' => 'عاجلة'
        ];

        return $priorities[$priority] ?? $priority;
    }
}
