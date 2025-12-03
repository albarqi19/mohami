<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendWelcomeMessage
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
    public function handle(UserRegistered $event): void
    {
        try {
            $this->whatsappService->sendWelcomeMessage($event->user, $event->pin);
            Log::info('Welcome message sent', ['user_id' => $event->user->id]);
        } catch (\Exception $e) {
            Log::error('Failed to send welcome message', [
                'user_id' => $event->user->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
