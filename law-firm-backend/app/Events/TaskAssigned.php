<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskAssigned
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $task;
    public $assignedTo;

    /**
     * Create a new event instance.
     */
    public function __construct($task, User $assignedTo)
    {
        $this->task = $task;
        $this->assignedTo = $assignedTo;
    }
}
