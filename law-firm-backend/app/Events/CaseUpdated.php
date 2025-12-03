<?php

namespace App\Events;

use App\Models\CaseModel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CaseUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $case;
    public $description;

    /**
     * Create a new event instance.
     */
    public function __construct(CaseModel $case, string $description = '')
    {
        $this->case = $case;
        $this->description = $description;
    }
}
