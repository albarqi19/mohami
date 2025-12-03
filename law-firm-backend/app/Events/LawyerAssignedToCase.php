<?php

namespace App\Events;

use App\Models\User;
use App\Models\CaseModel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LawyerAssignedToCase
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $lawyer;
    public $case;

    /**
     * Create a new event instance.
     */
    public function __construct(User $lawyer, CaseModel $case)
    {
        $this->lawyer = $lawyer;
        $this->case = $case;
    }
}
