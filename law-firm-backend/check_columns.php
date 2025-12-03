<?php
require 'vendor/autoload.php';

$pdo = new PDO('mysql:host=127.0.0.1;dbname=law_firm_db', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== CASES TABLE ===\n";
$stmt = $pdo->query('SHOW COLUMNS FROM cases');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' => ' . $row['Type'] . "\n";
}
