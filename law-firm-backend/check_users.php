<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Users in database:\n";
echo "==================\n";

try {
    $users = User::select('id', 'name', 'email', 'created_at')->get();

    if ($users->count() > 0) {
        foreach ($users as $user) {
            echo "ID: {$user->id} - Name: {$user->name} - Email: {$user->email}\n";
        }
    } else {
        echo "No users found in database.\n";
    }

    echo "\nTotal users: " . $users->count() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}