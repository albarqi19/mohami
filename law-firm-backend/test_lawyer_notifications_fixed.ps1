# سكريبت اختبار تنبيهات المحامي عبر واتساب
$baseUrl = "http://localhost:8000/api"
$adminToken = ""

Write-Host "=== اختبار تنبيهات المحامي عبر واتساب ===" -ForegroundColor Green

# 1. دخول المشرف للحصول على token
Write-Host "`n1. دخول المشرف..." -ForegroundColor Yellow
$loginData = @{
    identity_number = "1111111111"
    secret_code = "1111"
} | ConvertTo-Json -Depth 10

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/login" -Method POST -ContentType "application/json" -Body $loginData
    $adminToken = $loginResponse.token
    Write-Host "✓ تم دخول المشرف بنجاح" -ForegroundColor Green
    Write-Host "Token: $($adminToken.Substring(0,20))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ فشل دخول المشرف: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# 2. إنشاء محامي جديد للاختبار
Write-Host "`n2. إنشاء محامي للاختبار..." -ForegroundColor Yellow
$lawyerData = @{
    name = "محامي الاختبار"
    identity_number = "5555555555"
    email = "test.lawyer@test.com"
    phone = "966530996778"
    secret_code = "5555"
    role = "lawyer"
    specialization = "قانون مدني"
    bar_license_number = "LAW123456"
    is_active = $true
} | ConvertTo-Json -Depth 10

try {
    $lawyerResponse = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method POST -Headers $headers -Body $lawyerData
    $lawyerId = $lawyerResponse.user.id
    Write-Host "✓ تم إنشاء المحامي بنجاح" -ForegroundColor Green
    Write-Host "معرف المحامي: $lawyerId" -ForegroundColor Cyan
} catch {
    Write-Host "✗ فشل إنشاء المحامي: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. إنشاء عميل للاختبار
Write-Host "`n3. إنشاء عميل للاختبار..." -ForegroundColor Yellow
$clientData = @{
    name = "عميل الاختبار"
    identity_number = "6666666666"
    email = "test.client@test.com"
    phone = "966530996777"
    secret_code = "6666"
    role = "client"
    is_active = $true
} | ConvertTo-Json -Depth 10

try {
    $clientResponse = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method POST -Headers $headers -Body $clientData
    $clientId = $clientResponse.user.id
    Write-Host "✓ تم إنشاء العميل بنجاح" -ForegroundColor Green
    Write-Host "معرف العميل: $clientId" -ForegroundColor Cyan
} catch {
    Write-Host "✗ فشل إنشاء العميل: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. إنشاء قضية للاختبار
Write-Host "`n4. إنشاء قضية للاختبار..." -ForegroundColor Yellow
$caseData = @{
    title = "قضية اختبار التنبيهات"
    description = "قضية لاختبار تنبيهات واتساب للمحامي"
    case_number = "TEST-$(Get-Random -Maximum 9999)"
    status = "active"
    priority = "medium"
    case_type = "civil"
    client_id = $clientId
    filing_date = (Get-Date).ToString("yyyy-MM-dd")
} | ConvertTo-Json -Depth 10

try {
    $caseResponse = Invoke-RestMethod -Uri "$baseUrl/admin/cases" -Method POST -Headers $headers -Body $caseData
    $caseId = $caseResponse.case.id
    Write-Host "✓ تم إنشاء القضية بنجاح" -ForegroundColor Green
    Write-Host "معرف القضية: $caseId" -ForegroundColor Cyan
} catch {
    Write-Host "✗ فشل إنشاء القضية: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. تعيين المحامي على القضية (هذا سيرسل تنبيه)
Write-Host "`n5. تعيين المحامي على القضية..." -ForegroundColor Yellow
$assignData = @{
    lawyer_id = $lawyerId
    assignment_notes = "تعيين لاختبار تنبيهات واتساب"
} | ConvertTo-Json -Depth 10

try {
    $assignResponse = Invoke-RestMethod -Uri "$baseUrl/admin/cases/$caseId/assign-lawyer" -Method POST -Headers $headers -Body $assignData
    Write-Host "✓ تم تعيين المحامي على القضية" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "✗ فشل تعيين المحامي: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. إنشاء مهمة وتعيينها للمحامي (سيرسل تنبيه)
Write-Host "`n6. إنشاء مهمة للمحامي..." -ForegroundColor Yellow
$taskData = @{
    title = "مهمة اختبار التنبيهات"
    description = "مهمة لاختبار تنبيهات واتساب"
    assigned_to = $lawyerId
    case_id = $caseId
    due_date = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
    priority = "high"
    status = "pending"
} | ConvertTo-Json -Depth 10

try {
    $taskResponse = Invoke-RestMethod -Uri "$baseUrl/admin/tasks" -Method POST -Headers $headers -Body $taskData
    $taskId = $taskResponse.task.id
    Write-Host "✓ تم إنشاء المهمة وتعيينها للمحامي" -ForegroundColor Green
    Write-Host "معرف المهمة: $taskId" -ForegroundColor Cyan
    Start-Sleep -Seconds 2
} catch {
    Write-Host "✗ فشل إنشاء المهمة: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. محاكاة رفع وثيقة من العميل (سيرسل تنبيه للمحامي)
Write-Host "`n7. محاكاة رفع وثيقة من العميل..." -ForegroundColor Yellow

# دخول العميل أولاً
$clientLoginData = @{
    identity_number = "6666666666"
    secret_code = "6666"
} | ConvertTo-Json -Depth 10

try {
    $clientLoginResponse = Invoke-RestMethod -Uri "$baseUrl/client/login" -Method POST -ContentType "application/json" -Body $clientLoginData
    $clientToken = $clientLoginResponse.token
    Write-Host "✓ تم دخول العميل بنجاح" -ForegroundColor Green
    
    $clientHeaders = @{
        "Authorization" = "Bearer $clientToken"
        "Content-Type" = "application/json"
    }
    
    # محاكاة رفع وثيقة باستخدام test endpoint
    $uploadData = @{
        title = "وثيقة اختبار التنبيهات"
        category = "evidence"
        case_id = $caseId
        tags = @("اختبار", "تنبيهات")
    } | ConvertTo-Json -Depth 10
    
    # استخدام test endpoint بدلاً من upload حقيقي
    $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/test/document-upload" -Method POST -Headers $clientHeaders -Body $uploadData
    Write-Host "✓ تم محاكاة رفع الوثيقة - تنبيه مرسل للمحامي" -ForegroundColor Green
    Start-Sleep -Seconds 2
    
} catch {
    Write-Host "✗ فشل محاكاة رفع الوثيقة: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. اختبار المهام المتأخرة
Write-Host "`n8. اختبار تنبيهات المهام المتأخرة..." -ForegroundColor Yellow
try {
    $overdueResponse = Invoke-RestMethod -Uri "$baseUrl/test/lawyer-notifications/overdue-tasks" -Method POST -Headers $headers
    Write-Host "✓ تم اختبار تنبيهات المهام المتأخرة" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "✗ فشل اختبار المهام المتأخرة: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. اختبار الجلسات القريبة
Write-Host "`n9. اختبار تنبيهات الجلسات القريبة..." -ForegroundColor Yellow
try {
    $hearingResponse = Invoke-RestMethod -Uri "$baseUrl/test/lawyer-notifications/upcoming-hearings" -Method POST -Headers $headers
    Write-Host "✓ تم اختبار تنبيهات الجلسات القريبة" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "✗ فشل اختبار الجلسات القريبة: $($_.Exception.Message)" -ForegroundColor Red
}

# 10. إرسال رسالة تجريبية مباشرة
Write-Host "`n10. إرسال رسالة تجريبية مباشرة..." -ForegroundColor Yellow
try {
    $testMessageResponse = Invoke-RestMethod -Uri "$baseUrl/test/lawyer-notifications/test-message" -Method POST -Headers $headers
    Write-Host "✓ تم إرسال رسالة تجريبية للمحامي" -ForegroundColor Green
} catch {
    Write-Host "✗ فشل إرسال الرسالة التجريبية: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== انتهى اختبار تنبيهات المحامي ===" -ForegroundColor Green
Write-Host "يرجى التحقق من واتساب على الرقم 966530996778 لرؤية التنبيهات المرسلة" -ForegroundColor Yellow
