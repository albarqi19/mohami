<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ShowUserPins extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:show-pins';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Show users with their actual PIN values';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Users with PIN info:');
        $this->info('===================');
        
        $users = User::all();
        
        foreach ($users as $user) {
            $this->info("Name: {$user->name}");
            $this->info("National ID: {$user->national_id}");
            $this->info("Role: {$user->role}");
            
            // Check if PIN is hashed or plain text
            if (strlen($user->pin) == 60 && str_starts_with($user->pin, '$2y$')) {
                $this->warn("PIN is hashed: {$user->pin}");
                $this->warn("Need to check original PIN or reset it");
            } else {
                $this->info("PIN (plain): {$user->pin}");
            }
            
            $this->info('---');
        }
        
        // Let's test login with some common PINs for the admin
        $admin = User::where('role', 'admin')->first();
        if ($admin) {
            $this->info('Testing login for admin...');
            $testPins = ['12345', '1234', '123456', 'admin'];
            
            foreach ($testPins as $testPin) {
                if (Hash::check($testPin, $admin->pin)) {
                    $this->info("✅ Admin PIN is: {$testPin}");
                    return;
                }
            }
            $this->warn("❌ Could not determine admin PIN from common values");
        }
    }
}
