<?php

namespace App\Events;

use App\Models\Task;
use App\Models\CaseModel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $task;
    public $case;
    public $activityType;
    public $description;
    public $details;

    /**
     * Create a new event instance.
     */
    public function __construct(Task $task)
    {
        $this->task = $task;
        $this->case = $task->case; // Get the related case
        $this->activityType = 'task_completed';
        $this->description = 'تم إكمال المهمة: ' . $task->title;
        $this->details = json_encode([
            'task_id' => $task->id,
            'task_title' => $task->title,
            'completed_at' => $task->completed_at,
            'completed_by' => $task->completed_by,
        ]);
    }
}
