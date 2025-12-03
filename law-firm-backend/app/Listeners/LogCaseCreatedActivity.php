<?php

namespace App\Listeners;

use App\Events\CaseCreated;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

class LogCaseCreatedActivity
{
    /**
     * Handle the event.
     */
    public function handle(CaseCreated $event): void
    {
        Activity::create([
            'type' => 'case_created',
            'title' => 'تم إنشاء قضية جديدة',
            'description' => "تم إنشاء القضية: {$event->case->title}",
            'case_id' => $event->case->id,
            'performed_by' => Auth::id() ?? $event->case->created_by,
            'metadata' => [
                'case_title' => $event->case->title,
                'case_number' => $event->case->file_number,
                'case_type' => $event->case->case_type,
                'client_id' => $event->case->client_id,
            ]
        ]);
    }
}
