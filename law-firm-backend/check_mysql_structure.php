<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking MySQL table structure for cases...\n";
echo "==========================================\n";

try {
    // فحص structure جدول cases
    $columns = DB::select("DESCRIBE cases");
    
    echo "CASES table structure:\n";
    foreach ($columns as $column) {
        echo "- {$column->Field} ({$column->Type}) " . 
             ($column->Null === 'YES' ? 'NULL' : 'NOT NULL') . 
             ($column->Key ? " [{$column->Key}]" : '') . "\n";
    }
    
    echo "\n" . str_repeat("=", 50) . "\n";
    
    // فحص جدول case_lawyers إذا كان موجوداً
    echo "Checking case_lawyers table...\n";
    $caseLawyersExists = DB::select("SHOW TABLES LIKE 'case_lawyers'");
    
    if (!empty($caseLawyersExists)) {
        $caseLawyersColumns = DB::select("DESCRIBE case_lawyers");
        echo "CASE_LAWYERS table structure:\n";
        foreach ($caseLawyersColumns as $column) {
            echo "- {$column->Field} ({$column->Type}) " . 
                 ($column->Null === 'YES' ? 'NULL' : 'NOT NULL') . 
                 ($column->Key ? " [{$column->Key}]" : '') . "\n";
        }
    } else {
        echo "case_lawyers table does not exist!\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
