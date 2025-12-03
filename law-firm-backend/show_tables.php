<?php
require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "Available tables:\n";
    $tables = DB::select('SHOW TABLES');
    foreach($tables as $table) {
        $tableName = array_values((array)$table)[0];
        echo "- $tableName\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
