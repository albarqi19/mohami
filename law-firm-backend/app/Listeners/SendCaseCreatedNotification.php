<?php

namespace App\Listeners;

use App\Events\CaseCreated;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendCaseCreatedNotification
{

    protected $whatsappService;

    /**
     * Create the event listener.
     */
    public function __construct(WhatsappService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Handle the event.
     */
    public function handle(CaseCreated $event): void
    {
        try {
            $this->whatsappService->sendCaseCreatedNotification($event->case);
            Log::info('Case created notification sent', ['case_id' => $event->case->id]);
        } catch (\Exception $e) {
            Log::error('Failed to send case created notification', [
                'case_id' => $event->case->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
