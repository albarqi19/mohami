<?php
// قم بتشغيل هذا الملف عبر php check_cases.php

require_once 'vendor/autoload.php';

// تحميل إعدادات Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\CaseModel;

echo "تحقق من القضايا في قاعدة البيانات:\n\n";

try {
    // جلب جميع القضايا
    $cases = CaseModel::all();
    
    echo "عدد القضايا الموجودة: " . $cases->count() . "\n\n";
    
    if ($cases->count() > 0) {
        echo "القضايا الموجودة:\n";
        foreach ($cases as $case) {
            echo "ID: {$case->id}, رقم الملف: {$case->file_number}, العنوان: {$case->title}\n";
        }
    } else {
        echo "لا توجد قضايا في قاعدة البيانات.\n";
    }
    
    // تحقق من قضية محددة
    echo "\n\nتحقق من القضية رقم 2:\n";
    $case2 = CaseModel::find(2);
    if ($case2) {
        echo "القضية موجودة: {$case2->title}\n";
    } else {
        echo "القضية رقم 2 غير موجودة.\n";
        
        // جرب القضية رقم 1
        $case1 = CaseModel::find(1);
        if ($case1) {
            echo "القضية رقم 1 موجودة: {$case1->title}\n";
        } else {
            echo "القضية رقم 1 أيضاً غير موجودة.\n";
        }
    }
    
} catch (Exception $e) {
    echo "خطأ: " . $e->getMessage() . "\n";
}

echo "\nانتهى التحقق.\n";
