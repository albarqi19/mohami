# Law Firm API Test Script
# تشغيل اختبارات شاملة لجميع endpoints

param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [string]$TestEmail = "test@lawfirm.com",
    [string]$TestPassword = "password123"
)

Write-Host "🚀 بدء اختبار Law Firm API..." -ForegroundColor Green
Write-Host "Server: $BaseUrl" -ForegroundColor Yellow

# متغيرات عامة
$global:token = ""
$global:headers = @{}
$global:testResults = @()

# دالة لإضافة نتيجة الاختبار
function Add-TestResult {
    param($TestName, $Success, $Message)
    $global:testResults += @{
        Name = $TestName
        Success = $Success
        Message = $Message
        Time = Get-Date
    }
    
    if ($Success) {
        Write-Host "✅ $TestName" -ForegroundColor Green
    } else {
        Write-Host "❌ $TestName - $Message" -ForegroundColor Red
    }
}

# دالة لطلب API
function Invoke-ApiRequest {
    param($Uri, $Method = "GET", $Body = $null)
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -ContentType "application/json" -Headers $global:headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $global:headers
        }
        return @{ Success = $true; Data = $response }
    } catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Test 1: تسجيل حساب جديد
Write-Host "`n🔐 اختبار Authentication..." -ForegroundColor Cyan

$registerBody = @{
    name = "اختبار المحامي"
    email = $TestEmail
    password = $TestPassword
    password_confirmation = $TestPassword
    role = "lawyer"
    phone = "966501234567"
} | ConvertTo-Json

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/auth/register" -Method "POST" -Body $registerBody

if ($result.Success) {
    Add-TestResult "تسجيل حساب جديد" $true "تم إنشاء الحساب: $($result.Data.data.user.name)"
} else {
    Add-TestResult "تسجيل حساب جديد" $false $result.Error
}

# Test 2: تسجيل الدخول
$loginBody = @{
    email = $TestEmail
    password = $TestPassword
} | ConvertTo-Json

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/auth/login" -Method "POST" -Body $loginBody

if ($result.Success -and $result.Data.data.token) {
    $global:token = $result.Data.data.token
    $global:headers = @{ 
        "Authorization" = "Bearer $($global:token)"
        "Accept" = "application/json"
    }
    Add-TestResult "تسجيل الدخول" $true "تم الحصول على token"
} else {
    Add-TestResult "تسجيل الدخول" $false $result.Error
    Write-Host "❌ لا يمكن المتابعة بدون token" -ForegroundColor Red
    exit 1
}

# Test 3: معلومات المستخدم
$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/auth/me"

if ($result.Success) {
    Add-TestResult "معلومات المستخدم" $true "المستخدم: $($result.Data.data.name)"
} else {
    Add-TestResult "معلومات المستخدم" $false $result.Error
}

# Test 4: إنشاء قضية
Write-Host "`n⚖️ اختبار Cases..." -ForegroundColor Cyan

$caseBody = @{
    title = "قضية اختبار - نزاع تجاري"
    description = "قضية اختبار لتجربة النظام"
    type = "commercial"
    priority = "high"
    client_id = "1"
    primary_lawyer_id = "1"
    start_date = "2025-09-21"
    expected_end_date = "2025-12-21"
    court_name = "المحكمة التجارية"
    opposing_party = "الطرف المقابل"
} | ConvertTo-Json

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/cases" -Method "POST" -Body $caseBody

if ($result.Success) {
    $global:caseId = $result.Data.data.id
    Add-TestResult "إنشاء قضية" $true "رقم القضية: $($result.Data.data.case_number)"
} else {
    Add-TestResult "إنشاء قضية" $false $result.Error
}

# Test 5: عرض القضايا
$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/cases"

if ($result.Success) {
    Add-TestResult "عرض القضايا" $true "عدد القضايا: $($result.Data.data.data.Count)"
} else {
    Add-TestResult "عرض القضايا" $false $result.Error
}

# Test 6: إحصائيات القضايا
$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/cases/statistics"

if ($result.Success) {
    Add-TestResult "إحصائيات القضايا" $true "إجمالي القضايا: $($result.Data.data.total_cases)"
} else {
    Add-TestResult "إحصائيات القضايا" $false $result.Error
}

# Test 7: إنشاء مهمة
Write-Host "`n📋 اختبار Tasks..." -ForegroundColor Cyan

$taskBody = @{
    title = "مهمة اختبار - مراجعة وثائق"
    description = "مهمة اختبار لتجربة النظام"
    case_id = "1"
    assigned_to = "1"
    priority = "high"
    due_date = "2025-09-25T10:00:00"
    estimated_hours = "4.5"
    tags = @("اختبار", "مراجعة")
} | ConvertTo-Json

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/tasks" -Method "POST" -Body $taskBody

if ($result.Success) {
    $global:taskId = $result.Data.data.id
    Add-TestResult "إنشاء مهمة" $true "المهمة: $($result.Data.data.title)"
} else {
    Add-TestResult "إنشاء مهمة" $false $result.Error
}

# Test 8: مهامي الشخصية
$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/tasks/my-tasks"

if ($result.Success) {
    Add-TestResult "مهامي الشخصية" $true "عدد المهام: $($result.Data.data.data.Count)"
} else {
    Add-TestResult "مهامي الشخصية" $false $result.Error
}

# Test 9: إحصائيات المهام
$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/tasks/statistics"

if ($result.Success) {
    Add-TestResult "إحصائيات المهام" $true "إجمالي المهام: $($result.Data.data.total_tasks)"
} else {
    Add-TestResult "إحصائيات المهام" $false $result.Error
}

# Test 10: إنشاء تعليق
Write-Host "`n💬 اختبار Comments..." -ForegroundColor Cyan

$commentBody = @{
    content = "تعليق اختبار على القضية"
    case_id = "1"
} | ConvertTo-Json

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/comments" -Method "POST" -Body $commentBody

if ($result.Success) {
    Add-TestResult "إضافة تعليق" $true "التعليق: $($result.Data.data.content)"
} else {
    Add-TestResult "إضافة تعليق" $false $result.Error
}

# Test 11: عرض التعليقات
$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/comments?case_id=1"

if ($result.Success) {
    Add-TestResult "عرض التعليقات" $true "عدد التعليقات: $($result.Data.data.data.Count)"
} else {
    Add-TestResult "عرض التعليقات" $false $result.Error
}

# Test 12: عرض المستخدمين
Write-Host "`n👥 اختبار Users..." -ForegroundColor Cyan

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/users"

if ($result.Success) {
    Add-TestResult "عرض المستخدمين" $true "عدد المستخدمين: $($result.Data.data.data.Count)"
} else {
    Add-TestResult "عرض المستخدمين" $false $result.Error
}

# Test 13: عرض الوثائق
Write-Host "`n📄 اختبار Documents..." -ForegroundColor Cyan

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/documents"

if ($result.Success) {
    Add-TestResult "عرض الوثائق" $true "عدد الوثائق: $($result.Data.data.data.Count)"
} else {
    Add-TestResult "عرض الوثائق" $false $result.Error
}

# Test 14: إحصائيات الوثائق
$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/documents/statistics"

if ($result.Success) {
    Add-TestResult "إحصائيات الوثائق" $true "إجمالي الوثائق: $($result.Data.data.total_documents)"
} else {
    Add-TestResult "إحصائيات الوثائق" $false $result.Error
}

# Test 15: عرض الأنشطة
Write-Host "`n📊 اختبار Activities..." -ForegroundColor Cyan

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/activities"

if ($result.Success) {
    Add-TestResult "عرض الأنشطة" $true "عدد الأنشطة: $($result.Data.data.data.Count)"
} else {
    Add-TestResult "عرض الأنشطة" $false $result.Error
}

# Test 16: عرض الإشعارات
Write-Host "`n🔔 اختبار Notifications..." -ForegroundColor Cyan

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/notifications"

if ($result.Success) {
    Add-TestResult "عرض الإشعارات" $true "عدد الإشعارات: $($result.Data.data.data.Count)"
} else {
    Add-TestResult "عرض الإشعارات" $false $result.Error
}

# Test 17: تسجيل الخروج
Write-Host "`n🚪 اختبار Logout..." -ForegroundColor Cyan

$result = Invoke-ApiRequest -Uri "$BaseUrl/api/v1/auth/logout" -Method "POST"

if ($result.Success) {
    Add-TestResult "تسجيل الخروج" $true $result.Data.message
} else {
    Add-TestResult "تسجيل الخروج" $false $result.Error
}

# عرض النتائج النهائية
Write-Host "`n📊 نتائج الاختبار:" -ForegroundColor Magenta
Write-Host "=" * 50 -ForegroundColor Gray

$successCount = ($global:testResults | Where-Object { $_.Success }).Count
$totalCount = $global:testResults.Count
$successRate = [math]::Round(($successCount / $totalCount) * 100, 2)

Write-Host "إجمالي الاختبارات: $totalCount" -ForegroundColor White
Write-Host "الاختبارات الناجحة: $successCount" -ForegroundColor Green
Write-Host "الاختبارات الفاشلة: $($totalCount - $successCount)" -ForegroundColor Red
Write-Host "معدل النجاح: $successRate%" -ForegroundColor Yellow

if ($successRate -eq 100) {
    Write-Host "`n🎉 تهانينا! جميع الاختبارات نجحت!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "`n⚠️ معظم الاختبارات نجحت، راجع الأخطاء" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ هناك مشاكل في النظام، راجع الأخطاء" -ForegroundColor Red
}

# حفظ النتائج في ملف
$reportPath = "api_test_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
$global:testResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`n📄 تم حفظ التقرير في: $reportPath" -ForegroundColor Cyan

Write-Host "`n✅ انتهاء الاختبار" -ForegroundColor Green
