<?php

namespace App\Events;

use App\Models\CaseModel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CaseCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $case;
    public $activityType;
    public $description;
    public $details;

    /**
     * Create a new event instance.
     */
    public function __construct(CaseModel $case)
    {
        $this->case = $case;
        $this->activityType = 'case_created';
        $this->description = 'تم إنشاء القضية: ' . $case->title;
        $this->details = json_encode([
            'case_id' => $case->id,
            'case_title' => $case->title,
            'case_type' => $case->case_type,
            'status' => $case->status,
        ]);
    }
}
