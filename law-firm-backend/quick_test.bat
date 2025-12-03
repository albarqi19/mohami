@echo off
echo ================================================
echo    اختبار سريع لبيانات تسجيل الدخول
echo ================================================
echo.

cd /d "c:\Users\ALBAR\Downloads\محامي\law-firm-backend"

echo جاري فحص المستخدمين...
php artisan tinker --execute="
echo '===== بيانات تسجيل الدخول المتاحة =====' . PHP_EOL;
\$users = App\Models\User::all(['id', 'name', 'national_id', 'role', 'is_active']);
if(\$users->count() == 0) {
    echo 'لا يوجد مستخدمين في قاعدة البيانات!' . PHP_EOL;
    echo 'قم بتشغيل setup_system.bat لإنشاء بيانات تجريبية' . PHP_EOL;
} else {
    foreach(\$users as \$user) {
        \$status = \$user->is_active ? 'نشط' : 'غير نشط';
        echo '----------------------------------------' . PHP_EOL;
        echo 'الاسم: ' . \$user->name . PHP_EOL;
        echo 'رقم الهوية: ' . \$user->national_id . PHP_EOL;
        echo 'الرقم السري: 1234' . PHP_EOL;
        echo 'الدور: ' . \$user->role . PHP_EOL;
        echo 'الحالة: ' . \$status . PHP_EOL;
    }
    echo '========================================' . PHP_EOL;
    echo 'استخدم رقم الهوية + الرقم السري (1234) لتسجيل الدخول' . PHP_EOL;
}
"

echo.
echo ================================================
pause
