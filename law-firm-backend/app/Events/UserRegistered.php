<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserRegistered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $pin;

    /**
     * Create a new event instance.
     */
    public function __construct(User $user, string $pin)
    {
        $this->user = $user;
        $this->pin = $pin;
    }
}
