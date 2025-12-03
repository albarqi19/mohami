<?php

namespace App\Events;

use App\Models\CaseModel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QuickActionPerformed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $case;
    public $activityType;
    public $description;
    public $details;

    /**
     * Create a new event instance.
     */
    public function __construct(CaseModel $case, string $activityType, string $description, array $details = [])
    {
        $this->case = $case;
        $this->activityType = $activityType;
        $this->description = $description;
        $this->details = json_encode($details);
    }
}
