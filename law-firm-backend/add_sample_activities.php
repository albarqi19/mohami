<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Clear existing activities for case 2
    DB::table('activities')->where('case_id', 2)->delete();
    
    // Add sample activities for case 2
    $activities = [
        [
            'type' => 'case_created',
            'title' => 'إنشاء ملف القضية',
            'description' => 'تم إنشاء ملف جديد للقضية وتعيين المحامي المسؤول',
            'case_id' => 2,
            'task_id' => null,
            'performed_by' => 1, // Admin user
            'metadata' => json_encode([
                'case_number' => '2025-0002',
                'assigned_lawyer' => 'فاطمة أحمد المحاماة'
            ]),
            'created_at' => Carbon::now()->subDays(8),
            'updated_at' => Carbon::now()->subDays(8)
        ],
        [
            'type' => 'document_uploaded',
            'title' => 'رفع عقد التوريد الأصلي',
            'description' => 'تم رفع نسخة من عقد التوريد الموقع بين الطرفين',
            'case_id' => 2,
            'task_id' => null,
            'performed_by' => 2, // Lawyer
            'metadata' => json_encode([
                'document_name' => 'عقد التوريد الأصلي.pdf',
                'file_size' => '2.3 MB'
            ]),
            'created_at' => Carbon::now()->subDays(7),
            'updated_at' => Carbon::now()->subDays(7)
        ],
        [
            'type' => 'client_meeting',
            'title' => 'اجتماع مع العميل',
            'description' => 'مناقشة تفاصيل القضية وجمع المزيد من المعلومات',
            'case_id' => 2,
            'task_id' => null,
            'performed_by' => 2, // Lawyer
            'metadata' => json_encode([
                'meeting_duration' => '90 دقيقة',
                'location' => 'مكتب المحاماة'
            ]),
            'created_at' => Carbon::now()->subDays(5),
            'updated_at' => Carbon::now()->subDays(5)
        ],
        [
            'type' => 'hearing_scheduled',
            'title' => 'جدولة الجلسة الأولى',
            'description' => 'تم تحديد موعد الجلسة الأولى أمام المحكمة التجارية',
            'case_id' => 2,
            'task_id' => null,
            'performed_by' => 1, // Admin
            'metadata' => json_encode([
                'hearing_date' => '2025-09-30 10:00:00',
                'court' => 'المحكمة التجارية'
            ]),
            'created_at' => Carbon::now()->subDays(3),
            'updated_at' => Carbon::now()->subDays(3)
        ],
        [
            'type' => 'document_uploaded',
            'title' => 'رفع مستندات الإثبات',
            'description' => 'تم رفع مراسلات بين الطرفين وتقارير فحص البضائع',
            'case_id' => 2,
            'task_id' => null,
            'performed_by' => 2, // Lawyer
            'metadata' => json_encode([
                'document_name' => 'مستندات الإثبات.zip',
                'files_count' => 15
            ]),
            'created_at' => Carbon::now()->subDays(2),
            'updated_at' => Carbon::now()->subDays(2)
        ],
        [
            'type' => 'task_completed',
            'title' => 'إنجاز مهمة إعداد لائحة الدعوى',
            'description' => 'تم الانتهاء من إعداد لائحة الدعوى وتقديمها للمحكمة',
            'case_id' => 2,
            'task_id' => null,
            'performed_by' => 2, // Lawyer
            'metadata' => json_encode([
                'task_title' => 'إعداد لائحة الدعوى الأساسية',
                'completion_time' => '5 ساعات'
            ]),
            'created_at' => Carbon::now()->subDay(),
            'updated_at' => Carbon::now()->subDay()
        ],
        [
            'type' => 'status_changed',
            'title' => 'تحديث حالة القضية',
            'description' => 'تم تحديث حالة القضية إلى نشطة بعد تقديم جميع المستندات',
            'case_id' => 2,
            'task_id' => null,
            'performed_by' => 1, // Admin
            'metadata' => json_encode([
                'old_status' => 'قيد الإعداد',
                'new_status' => 'نشطة'
            ]),
            'created_at' => Carbon::now()->subHours(12),
            'updated_at' => Carbon::now()->subHours(12)
        ]
    ];
    
    DB::table('activities')->insert($activities);
    
    echo "تم إضافة " . count($activities) . " أنشطة بنجاح للقضية رقم 2\n";
    
    // Show added activities
    $addedActivities = DB::table('activities')
        ->where('case_id', 2)
        ->orderBy('created_at', 'desc')
        ->get();
    
    echo "\nالأنشطة المضافة:\n";
    foreach ($addedActivities as $activity) {
        echo "- {$activity->title} ({$activity->type}) - {$activity->created_at}\n";
    }
    
} catch (Exception $e) {
    echo "خطأ: " . $e->getMessage() . "\n";
}
