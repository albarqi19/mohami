<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserLoggedIn
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $loginTime;
    public $ipAddress;

    /**
     * Create a new event instance.
     */
    public function __construct(User $user, string $ipAddress = null)
    {
        $this->user = $user;
        $this->loginTime = now();
        $this->ipAddress = $ipAddress;
    }
}
