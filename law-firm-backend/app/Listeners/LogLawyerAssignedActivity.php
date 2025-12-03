<?php

namespace App\Listeners;

use App\Events\LawyerAssignedToCase;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class LogLawyerAssignedActivity
{
    /**
     * Handle the event.
     */
    public function handle(LawyerAssignedToCase $event): void
    {
        Activity::create([
            'type' => 'user_assigned',
            'title' => 'تم تعيين محامي للقضية',
            'description' => "تم تعيين المحامي {$event->lawyer->name} للقضية: {$event->case->title}",
            'case_id' => $event->case->id,
            'performed_by' => Auth::id(),
            'metadata' => [
                'case_title' => $event->case->title,
                'case_number' => $event->case->file_number,
                'lawyer_id' => $event->lawyer->id,
                'lawyer_name' => $event->lawyer->name,
                'lawyer_email' => $event->lawyer->email,
            ]
        ]);
    }
}
