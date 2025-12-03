<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class ListUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:list';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all users with their credentials';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Users in database:');
        $this->info('================');
        
        $users = User::select('id', 'name', 'national_id', 'pin', 'role', 'phone', 'is_active')->get();
        
        if ($users->isEmpty()) {
            $this->warn('No users found in database.');
            return;
        }
        
        foreach ($users as $user) {
            $this->info("ID: {$user->id}");
            $this->info("Name: {$user->name}");
            $this->info("National ID: {$user->national_id}");
            $this->info("PIN: {$user->pin}");
            $this->info("Role: {$user->role}");
            $this->info("Phone: {$user->phone}");
            $this->info("Active: " . ($user->is_active ? 'Yes' : 'No'));
            $this->info('---');
        }
        
        $this->info("Total users: " . $users->count());
    }
}
