@echo off
echo ================================================
echo    إصلاح وإعداد نظام إدارة المحاماة
echo ================================================
echo.

cd /d "c:\Users\ALBAR\Downloads\محامي\law-firm-backend"

echo [1] إعادة تعيين قاعدة البيانات...
echo ------------------------------------------------
php artisan migrate:fresh
echo.

echo [2] إنشاء بيانات تجريبية بسيطة...
echo ------------------------------------------------
php artisan tinker --execute="
// حذف المستخدمين الموجودين
App\Models\User::truncate();

// إنشاء مستخدمين جدد
\$admin = App\Models\User::create([
    'name' => 'أحمد محمد الإدارة',
    'email' => 'admin@law.com',
    'national_id' => '1234567890',
    'password' => Hash::make('password'),
    'pin' => Hash::make('1234'),
    'role' => 'admin',
    'phone' => '+966501234567',
    'is_active' => true,
]);

\$lawyer = App\Models\User::create([
    'name' => 'فاطمة أحمد المحاماة',
    'email' => 'lawyer@law.com',
    'national_id' => '1234567891',
    'password' => Hash::make('password'),
    'pin' => Hash::make('1234'),
    'role' => 'lawyer',
    'phone' => '+966507654321',
    'is_active' => true,
]);

\$client = App\Models\User::create([
    'name' => 'محمد خالد العميل',
    'email' => 'client@law.com',
    'national_id' => '1234567893',
    'password' => Hash::make('password'),
    'pin' => Hash::make('1234'),
    'role' => 'client',
    'phone' => '+966502468135',
    'is_active' => true,
]);

echo 'تم إنشاء المستخدمين بنجاح!' . PHP_EOL;
echo 'Admin: 1234567890 / 1234' . PHP_EOL;
echo 'Lawyer: 1234567891 / 1234' . PHP_EOL;
echo 'Client: 1234567893 / 1234' . PHP_EOL;
"
echo.

echo [3] اختبار تسجيل الدخول...
echo ------------------------------------------------
echo "اختبار تسجيل دخول Admin..."
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d "{\"national_id\":\"1234567890\",\"pin\":\"1234\"}"
echo.
echo.

echo [4] تشغيل الخادم...
echo ------------------------------------------------
echo "سيتم تشغيل خادم Laravel على http://127.0.0.1:8000"
echo "اضغط Ctrl+C لإيقاف الخادم"
echo.
php artisan serve --host=127.0.0.1 --port=8000
