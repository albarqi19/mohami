@echo off
echo ================================================
echo    إنشاء مستخدم تجريبي سريع
echo ================================================
echo.

cd /d "c:\Users\ALBAR\Downloads\محامي\law-firm-backend"

echo جاري إنشاء مستخدم Admin...
php artisan tinker --execute="
try {
    // حذف المستخدم إذا كان موجود
    App\Models\User::where('national_id', '1234567890')->delete();
    
    // إنشاء مستخدم جديد
    \$user = App\Models\User::create([
        'name' => 'أحمد محمد الإدارة',
        'email' => 'admin@test.com',
        'national_id' => '1234567890',
        'password' => Hash::make('password'),
        'pin' => Hash::make('1234'),
        'role' => 'admin',
        'phone' => '+966501234567',
        'is_active' => true,
    ]);
    
    echo '✅ تم إنشاء المستخدم بنجاح!' . PHP_EOL;
    echo '👤 الاسم: ' . \$user->name . PHP_EOL;
    echo '🆔 رقم الهوية: ' . \$user->national_id . PHP_EOL;
    echo '🔑 الرقم السري: 1234' . PHP_EOL;
    echo '👨‍💼 الدور: ' . \$user->role . PHP_EOL;
    
} catch (Exception \$e) {
    echo '❌ خطأ: ' . \$e->getMessage() . PHP_EOL;
}
"

echo.
echo ================================================
echo استخدم هذه البيانات لتسجيل الدخول:
echo رقم الهوية: 1234567890
echo الرقم السري: 1234
echo ================================================
pause
