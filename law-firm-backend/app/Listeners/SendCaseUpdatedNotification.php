<?php

namespace App\Listeners;

use App\Events\CaseUpdated;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendCaseUpdatedNotification
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
    public function handle(CaseUpdated $event): void
    {
        try {
            $this->whatsappService->sendCaseUpdatedNotification($event->case, $event->description);
            Log::info('Case updated notification sent', ['case_id' => $event->case->id]);
        } catch (\Exception $e) {
            Log::error('Failed to send case updated notification', [
                'case_id' => $event->case->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
