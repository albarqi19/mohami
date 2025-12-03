<?php

namespace App\Listeners;

use App\Events\TaskCompleted;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class LogTaskCompletedActivity
{
    /**
     * Handle the event.
     */
    public function handle(TaskCompleted $event): void
    {
        Activity::create([
            'type' => 'task_completed',
            'title' => 'تم إنجاز مهمة',
            'description' => "تم إنجاز المهمة: {$event->task->title}",
            'case_id' => $event->task->case_id,
            'task_id' => $event->task->id,
            'performed_by' => Auth::id(),
            'metadata' => [
                'task_title' => $event->task->title,
                'task_id' => $event->task->id,
                'priority' => $event->task->priority,
                'completed_at' => now(),
                'completion_notes' => $event->task->completion_notes ?? null,
            ]
        ]);
    }
}
