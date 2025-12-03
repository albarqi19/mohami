<?php
require_once 'vendor/autoload.php';

use App\Models\Appointment;
use Illuminate\Database\Capsule\Manager as DB;

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "Testing appointment creation...\n";
    
    $data = [
        'case_id' => 12,
        'title' => 'Test Appointment',
        'type' => 'court_hearing',
        'scheduled_at' => '2025-10-01 10:00:00',
        'duration_minutes' => 60,
        'priority' => 'medium',
        'attendees' => [],
        'reminders' => [15],
        'created_by' => 1
    ];
    
    echo "Data to insert: " . json_encode($data) . "\n";
    
    $appointment = Appointment::create($data);
    
    echo "Appointment created successfully with ID: " . $appointment->id . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
