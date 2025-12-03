@echo off
echo ================================================
echo    فحص شامل لنظام إدارة المحاماة
echo ================================================
echo.

cd /d "c:\Users\ALBAR\Downloads\محامي\law-firm-backend"

echo [1] فحص حالة قاعدة البيانات...
echo ------------------------------------------------
php artisan migrate:status
echo.

echo [2] فحص عدد المستخدمين...
echo ------------------------------------------------
php artisan tinker --execute="echo 'Users count: ' . App\Models\User::count();"
echo.

echo [3] عرض جميع المستخدمين...
echo ------------------------------------------------
php artisan tinker --execute="App\Models\User::all(['id', 'name', 'national_id', 'role'])->each(function($u) { echo $u->id . ' - ' . $u->name . ' (' . $u->national_id . ') - ' . $u->role . PHP_EOL; });"
echo.

echo [4] اختبار API بسيط...
echo ------------------------------------------------
curl -X GET "http://127.0.0.1:8000/api/v1/simple/hello" -H "Accept: application/json"
echo.
echo.

echo [5] اختبار تسجيل الدخول...
echo ------------------------------------------------
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d "{\"national_id\":\"1234567890\",\"pin\":\"1234\"}"
echo.
echo.

echo [6] فحص Routes...
echo ------------------------------------------------
php artisan route:list --path=api/v1/auth
echo.

echo [7] فحص خطأ الـ Seeder...
echo ------------------------------------------------
echo "محاولة إنشاء مستخدم تجريبي..."
php artisan tinker --execute="
try {
    \$user = App\Models\User::create([
        'name' => 'Test User',
        'email' => 'test123@example.com',
        'national_id' => '9999999999',
        'password' => Hash::make('password'),
        'pin' => Hash::make('1234'),
        'role' => 'admin',
        'phone' => '+966500000000',
        'is_active' => true,
    ]);
    echo 'User created successfully: ' . \$user->name;
} catch (Exception \$e) {
    echo 'Error: ' . \$e->getMessage();
}
"
echo.

echo [8] فحص Laravel Logs...
echo ------------------------------------------------
echo "آخر 5 أسطر من الـ logs:"
if exist "storage\logs\laravel.log" (
    powershell "Get-Content 'storage\logs\laravel.log' -Tail 5"
) else (
    echo "لا يوجد ملف logs"
)
echo.

echo [9] فحص بيانات المصادقة الحالية...
echo ------------------------------------------------
php artisan tinker --execute="
\$users = App\Models\User::where('role', 'admin')->orWhere('role', 'lawyer')->get(['name', 'national_id', 'role']);
echo 'بيانات تسجيل الدخول المتاحة:' . PHP_EOL;
foreach(\$users as \$user) {
    echo '- الاسم: ' . \$user->name . ' | رقم الهوية: ' . \$user->national_id . ' | الدور: ' . \$user->role . ' | PIN: 1234' . PHP_EOL;
}
"
echo.

echo ================================================
echo    انتهى الفحص الشامل
echo ================================================
pause
