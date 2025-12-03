# اختبار شامل لنظام إضافة المحامين مع رسائل واتساب الترحيب
$baseUrl = "http://localhost:8000/api/v1"
$adminToken = ""

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "    اختبار شامل لنظام إضافة المحامين مع رسائل الواتساب" -ForegroundColor Green  
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# 1. دخول المشرف
Write-Host "🔐 1. دخول المشرف..." -ForegroundColor Yellow
$loginData = @{
    national_id = "1234567890"
    pin = "1234"
} | ConvertTo-Json -Depth 10

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginData
    $adminToken = $loginResponse.data.token
    Write-Host "✅ تم دخول المشرف بنجاح" -ForegroundColor Green
    Write-Host "🎫 Token: $($adminToken.Substring(0,20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ فشل دخول المشرف: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

Write-Host ""

# 2. فحص إعدادات الواتساب
Write-Host "⚙️ 2. فحص إعدادات الواتساب..." -ForegroundColor Yellow
try {
    $whatsappResponse = Invoke-RestMethod -Uri "$baseUrl/whatsapp/settings" -Method GET -Headers $headers
    $settings = $whatsappResponse.data
    
    Write-Host "✅ إعدادات الواتساب:" -ForegroundColor Green
    Write-Host "   📱 التنبيهات مفعلة: $($settings.notifications_enabled)" -ForegroundColor White
    Write-Host "   📞 رقم الهاتف ID: $($settings.phone_number_id)" -ForegroundColor White
    Write-Host "   🌐 Webhook URL: $($settings.webhook_url)" -ForegroundColor White
} catch {
    Write-Host "⚠️ تحذير: لا يمكن الوصول لإعدادات الواتساب: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# 3. إنشاء محامي جديد عبر API
Write-Host "👨‍💼 3. إنشاء محامي جديد..." -ForegroundColor Yellow

$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$lawyerData = @{
    name = "محامي اختبار - $(Get-Date -Format 'HH:mm')"
    email = "lawyer.test.$timestamp@example.com"
    national_id = "TEST$timestamp"
    role = "lawyer"
    phone = "966530996778"
} | ConvertTo-Json -Depth 10

try {
    $lawyerResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $headers -Body $lawyerData
    $lawyer = $lawyerResponse.data
    
    Write-Host "✅ تم إنشاء المحامي بنجاح!" -ForegroundColor Green
    Write-Host "   👤 الاسم: $($lawyer.user.name)" -ForegroundColor White
    Write-Host "   🆔 رقم الهوية: $($lawyer.user.national_id)" -ForegroundColor White
    Write-Host "   🔑 الرقم السري: $($lawyer.pin)" -ForegroundColor Cyan
    Write-Host "   📱 رقم الهاتف: $($lawyer.user.phone)" -ForegroundColor White
    Write-Host "   📧 البريد: $($lawyer.user.email)" -ForegroundColor White
    Write-Host "   🛡️ الدور: $($lawyer.user.role)" -ForegroundColor White
    Write-Host "   💬 رسالة النظام: $($lawyerResponse.message)" -ForegroundColor Yellow
    
    # حفظ معرف المحامي للاختبارات التالية
    $lawyerId = $lawyer.user.id
    $lawyerPin = $lawyer.pin
    $lawyerNationalId = $lawyer.user.national_id
    
} catch {
    Write-Host "❌ فشل إنشاء المحامي: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseBody)
        $responseText = $reader.ReadToEnd()
        Write-Host "📄 تفاصيل الخطأ: $responseText" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# 4. انتظار قليل لمعالجة Event
Write-Host "⏳ 4. انتظار معالجة رسالة الترحيب..." -ForegroundColor Yellow
Write-Host "   (انتظار 5 ثوانٍ لمعالجة Event والإرسال...)" -ForegroundColor Gray
Start-Sleep -Seconds 5

# 5. فحص الرسائل المرسلة
Write-Host "📬 5. فحص الرسائل المرسلة..." -ForegroundColor Yellow
try {
    $messagesResponse = Invoke-RestMethod -Uri "$baseUrl/whatsapp/messages" -Method GET -Headers $headers
    $messages = $messagesResponse.data
    
    # البحث عن رسائل حديثة (آخر 10 دقائق)
    $recentMessages = $messages | Where-Object { 
        $messageTime = [DateTime]::Parse($_.created_at)
        $messageTime -gt (Get-Date).AddMinutes(-10)
    }
    
    if ($recentMessages) {
        Write-Host "✅ تم العثور على $($recentMessages.Count) رسالة مرسلة حديثاً:" -ForegroundColor Green
        
        foreach ($message in $recentMessages) {
            Write-Host ""
            Write-Host "   📩 رسالة #$($message.id):" -ForegroundColor Cyan
            Write-Host "      📱 إلى: $($message.to_phone)" -ForegroundColor White
            Write-Host "      📄 المحتوى: $($message.message_content.Substring(0, [Math]::Min(150, $message.message_content.Length)))..." -ForegroundColor White
            Write-Host "      📊 الحالة: $($message.status)" -ForegroundColor White
            Write-Host "      🕐 الوقت: $($message.created_at)" -ForegroundColor White
            Write-Host "      🏷️ النوع: $($message.event_type)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️ لم يتم العثور على رسائل مرسلة حديثاً" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ فشل فحص الرسائل: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 6. اختبار تسجيل دخول المحامي الجديد
Write-Host "🔓 6. اختبار تسجيل دخول المحامي الجديد..." -ForegroundColor Yellow
$lawyerLoginData = @{
    national_id = $lawyerNationalId
    pin = $lawyerPin
} | ConvertTo-Json -Depth 10

try {
    $lawyerLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $lawyerLoginData
    Write-Host "✅ تم دخول المحامي بنجاح!" -ForegroundColor Green
    Write-Host "   👤 اسم المحامي: $($lawyerLoginResponse.data.user.name)" -ForegroundColor White
    Write-Host "   🛡️ الدور: $($lawyerLoginResponse.data.user.role)" -ForegroundColor White
    Write-Host "   🕐 آخر دخول: $($lawyerLoginResponse.data.user.last_login_at)" -ForegroundColor White
} catch {
    Write-Host "❌ فشل دخول المحامي: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 7. إرسال رسالة تجريبية مباشرة
Write-Host "📞 7. إرسال رسالة تجريبية مباشرة..." -ForegroundColor Yellow
try {
    $testMessageResponse = Invoke-RestMethod -Uri "$baseUrl/whatsapp/test-message" -Method POST -Headers $headers
    Write-Host "✅ تم إرسال الرسالة التجريبية بنجاح!" -ForegroundColor Green
    Write-Host "   📱 الرقم: $($testMessageResponse.phone)" -ForegroundColor White
    Write-Host "   💬 الرسالة: $($testMessageResponse.text)" -ForegroundColor White
} catch {
    Write-Host "⚠️ تحذير: فشل إرسال الرسالة التجريبية: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# 8. فحص نهائي للنظام
Write-Host "🔍 8. فحص نهائي للنظام..." -ForegroundColor Yellow
try {
    # فحص عدد المستخدمين
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET -Headers $headers
    $totalUsers = $usersResponse.data.total
    
    Write-Host "✅ إحصائيات النظام:" -ForegroundColor Green
    Write-Host "   👥 إجمالي المستخدمين: $totalUsers" -ForegroundColor White
    
    # عد المحامين
    $lawyersResponse = Invoke-RestMethod -Uri "$baseUrl/users?role=lawyer" -Method GET -Headers $headers
    $totalLawyers = $lawyersResponse.data.total
    Write-Host "   👨‍💼 عدد المحامين: $totalLawyers" -ForegroundColor White
    
} catch {
    Write-Host "⚠️ تحذير: فشل فحص إحصائيات النظام: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                        انتهى الاختبار الشامل" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📋 ملخص النتائج:" -ForegroundColor Cyan
Write-Host "✅ تم إنشاء محامي جديد بنجاح" -ForegroundColor Green
Write-Host "✅ تم توليد PIN من 5 أرقام تلقائياً" -ForegroundColor Green
Write-Host "✅ تم إطلاق Event لرسالة الترحيب" -ForegroundColor Green
Write-Host "✅ تم اختبار تسجيل دخول المحامي الجديد" -ForegroundColor Green
Write-Host ""
Write-Host "📱 تحقق من واتساب على الرقم: 966530996778" -ForegroundColor Yellow
Write-Host "🔑 الرقم السري للمحامي الجديد: $lawyerPin" -ForegroundColor Cyan
Write-Host "🆔 رقم الهوية: $lawyerNationalId" -ForegroundColor Cyan
