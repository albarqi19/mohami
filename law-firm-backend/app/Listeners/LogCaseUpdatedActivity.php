<?php

namespace App\Listeners;

use App\Events\CaseUpdated;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class LogCaseUpdatedActivity
{
    /**
     * Handle the event.
     */
    public function handle(CaseUpdated $event): void
    {
        $description = $event->description ?: "تم تحديث القضية: {$event->case->title}";
        
        Activity::create([
            'type' => 'case_updated',
            'title' => 'تم تحديث قضية',
            'description' => $description,
            'case_id' => $event->case->id,
            'performed_by' => Auth::id(),
            'metadata' => [
                'case_title' => $event->case->title,
                'case_number' => $event->case->file_number,
                'case_status' => $event->case->status,
                'update_description' => $event->description,
            ]
        ]);
    }
}
