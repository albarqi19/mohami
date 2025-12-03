# إصلاح شامل لنظام إدارة المحاماة
Write-Host "================================================" -ForegroundColor Green
Write-Host "    إصلاح نظام إدارة المحاماة" -ForegroundColor Green  
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

Set-Location "c:\Users\ALBAR\Downloads\محامي\law-firm-backend"

# فحص المستخدمين الحاليين
Write-Host "[1] فحص المستخدمين الحاليين..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"
$userCount = php artisan tinker --execute="echo App\Models\User::count();"
Write-Host "عدد المستخدمين: $userCount"
Write-Host ""

# حذف البيانات القديمة وإعادة الإعداد
Write-Host "[2] إعادة إعداد قاعدة البيانات..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"
php artisan migrate:fresh

# إنشاء بيانات جديدة باستخدام Artisan command
Write-Host "[3] إنشاء بيانات تجريبية..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"

# إنشاء المستخدمين مباشرة
$createUsers = @"
`$admin = App\Models\User::create([
    'name' => 'أحمد محمد الإدارة',
    'email' => 'admin@law.com', 
    'national_id' => '1234567890',
    'password' => Hash::make('password'),
    'pin' => Hash::make('1234'),
    'role' => 'admin',
    'phone' => '+966501234567',
    'is_active' => true,
]);

`$lawyer = App\Models\User::create([
    'name' => 'فاطمة أحمد المحاماة',
    'email' => 'lawyer@law.com',
    'national_id' => '1234567891', 
    'password' => Hash::make('password'),
    'pin' => Hash::make('1234'),
    'role' => 'lawyer',
    'phone' => '+966507654321',
    'is_active' => true,
]);

`$client = App\Models\User::create([
    'name' => 'محمد خالد العميل',
    'email' => 'client@law.com',
    'national_id' => '1234567893',
    'password' => Hash::make('password'), 
    'pin' => Hash::make('1234'),
    'role' => 'client',
    'phone' => '+966502468135',
    'is_active' => true,
]);

echo '✅ تم إنشاء المستخدمين بنجاح!';
"@

php artisan tinker --execute="$createUsers"
Write-Host ""

# عرض البيانات المُنشأة
Write-Host "[4] عرض بيانات تسجيل الدخول..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"
$showUsers = @"
`$users = App\Models\User::all(['name', 'national_id', 'role']);
echo '===== بيانات تسجيل الدخول =====' . PHP_EOL;
foreach(`$users as `$user) {
    echo '👤 ' . `$user->name . PHP_EOL;
    echo '🆔 رقم الهوية: ' . `$user->national_id . PHP_EOL;
    echo '🔑 الرقم السري: 1234' . PHP_EOL; 
    echo '👨‍💼 الدور: ' . `$user->role . PHP_EOL;
    echo '--------------------------------' . PHP_EOL;
}
"@

php artisan tinker --execute="$showUsers"
Write-Host ""

# اختبار API
Write-Host "[5] اختبار API..." -ForegroundColor Yellow
Write-Host "------------------------------------------------"
Write-Host "اختبار endpoint بسيط..."

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/simple/hello" -Method GET -ContentType "application/json"
    Write-Host "✅ API يعمل بشكل صحيح: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في الاتصال: $_" -ForegroundColor Red
    Write-Host "تأكد من تشغيل الخادم أولاً بالأمر: php artisan serve"
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ تم الانتهاء من الإعداد!" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 بيانات تسجيل الدخول:" -ForegroundColor Cyan
Write-Host "Admin - رقم الهوية: 1234567890 | الرقم السري: 1234" -ForegroundColor White
Write-Host "Lawyer - رقم الهوية: 1234567891 | الرقم السري: 1234" -ForegroundColor White  
Write-Host "Client - رقم الهوية: 1234567893 | الرقم السري: 1234" -ForegroundColor White
Write-Host ""
Write-Host "🚀 لتشغيل الخادم:" -ForegroundColor Cyan
Write-Host "php artisan serve --host=127.0.0.1 --port=8000" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Green

Read-Host "اضغط Enter للمتابعة"
