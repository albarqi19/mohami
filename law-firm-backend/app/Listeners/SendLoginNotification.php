<?php

namespace App\Listeners;

use App\Events\UserLoggedIn;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class SendLoginNotification
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
    public function handle(UserLoggedIn $event)
    {
        try {
            Log::info('SendLoginNotification listener triggered', [
                'user_id' => $event->user->id,
                'user_name' => $event->user->name,
                'user_role' => $event->user->role,
                'user_phone' => $event->user->phone,
                'login_time' => $event->loginTime
            ]);

            $result = $this->whatsappService->sendLoginNotification(
                $event->user,
                $event->ipAddress
            );
            
            if ($result) {
                Log::info('Login notification sent via WhatsApp successfully', [
                    'user_id' => $event->user->id,
                    'user_name' => $event->user->name,
                    'login_time' => $event->loginTime
                ]);
            } else {
                Log::warning('Login notification was not sent', [
                    'user_id' => $event->user->id,
                    'user_name' => $event->user->name,
                    'user_role' => $event->user->role,
                    'user_phone' => $event->user->phone
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send login notification via WhatsApp', [
                'user_id' => $event->user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
