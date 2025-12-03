<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\CaseModel;

$case = CaseModel::where('source', 'najiz')->latest()->first();

if ($case) {
    echo "=== آخر قضية مستوردة من ناجز ===\n\n";
    echo "رقم القضية: " . $case->file_number . "\n";
    echo "العنوان: " . $case->title . "\n";
    echo "العميل: " . $case->client_name . "\n";
    echo "الخصم: " . ($case->opponent_name ?? 'غير محدد') . "\n";
    echo "المحكمة: " . ($case->court ?? 'غير محدد') . "\n";
    echo "نوع القضية: " . $case->case_type . "\n";
    echo "الحالة: " . $case->status . "\n";
    echo "\n=== الوصف ===\n";
    echo substr($case->description ?? 'فارغ', 0, 500) . "\n";
    echo "\n=== بيانات ناجز الإضافية ===\n";
    if ($case->najiz_data) {
        print_r($case->najiz_data);
    } else {
        echo "لا توجد بيانات إضافية\n";
    }
    
    echo "\n\n=== إحصائيات ===\n";
    $total = CaseModel::where('source', 'najiz')->count();
    $withData = CaseModel::where('source', 'najiz')->whereNotNull('najiz_data')->count();
    $withDesc = CaseModel::where('source', 'najiz')->whereNotNull('description')->where('description', '!=', '')->count();
    $withClient = CaseModel::where('source', 'najiz')->where('client_name', '!=', 'عميل ناجز')->count();
    
    echo "إجمالي القضايا من ناجز: $total\n";
    echo "قضايا لها بيانات إضافية: $withData\n";
    echo "قضايا لها وصف: $withDesc\n";
    echo "قضايا لها اسم عميل حقيقي: $withClient\n";
} else {
    echo "لا توجد قضايا مستوردة من ناجز\n";
}
