<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking cases table structure...\n";
echo "==================================\n";

try {
    $columns = DB::select("DESCRIBE cases");
    
    echo "Cases table columns:\n";
    foreach ($columns as $column) {
        echo "- {$column->Field} ({$column->Type}) - {$column->Null} - {$column->Key}\n";
    }
    
    echo "\n";
    echo "Checking if case_lawyers table exists...\n";
    
    try {
        $caseLawyersColumns = DB::select("DESCRIBE case_lawyers");
        echo "case_lawyers table columns:\n";
        foreach ($caseLawyersColumns as $column) {
            echo "- {$column->Field} ({$column->Type}) - {$column->Null} - {$column->Key}\n";
        }
    } catch (Exception $e) {
        echo "case_lawyers table does not exist: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
