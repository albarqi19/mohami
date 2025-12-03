<?php

namespace App\Listeners;

use App\Events\TaskAssigned;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class LogTaskAssignedActivity
{
    /**
     * Handle the event.
     */
    public function handle(TaskAssigned $event): void
    {
        Activity::create([
            'type' => 'task_assigned',
            'title' => 'تم تكليف مهمة',
            'description' => "تم تكليف المهمة: {$event->task->title} إلى {$event->assignedTo->name}",
            'case_id' => $event->task->case_id,
            'task_id' => $event->task->id,
            'performed_by' => Auth::id(),
            'metadata' => [
                'task_title' => $event->task->title,
                'task_id' => $event->task->id,
                'assignee_id' => $event->assignedTo->id,
                'assignee_name' => $event->assignedTo->name,
                'priority' => $event->task->priority,
                'due_date' => $event->task->due_date,
            ]
        ]);
    }
}
