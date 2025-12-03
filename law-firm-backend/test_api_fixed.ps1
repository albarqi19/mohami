# =============================================================================
# Law Firm API Test Script - Windows PowerShell
# تسكريپت اختبار API نظام إدارة المحاماة - ويندوز پاورشل
# =============================================================================

# إعدادات عامة
$script:BaseURL = "http://127.0.0.1:8000/api/v1"
$script:AuthToken = ""
$script:TestResults = @()
$script:TestCaseId = ""
$script:TestTaskId = ""
$script:TestDocumentId = ""

# ألوان النص
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

# دالة إرسال طلب API
function Invoke-APITest {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = @{},
        [hashtable]$Headers = @{},
        [bool]$RequireAuth = $true
    )
    
    Write-Host "`n[TEST] $TestName" -ForegroundColor $Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Cyan
    
    $URL = "$script:BaseURL$Endpoint"
    
    # إعداد الرؤوس
    $RequestHeaders = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    # إضافة التوكن إذا كان مطلوباً
    if ($RequireAuth -and $script:AuthToken) {
        $RequestHeaders["Authorization"] = "Bearer $script:AuthToken"
    }
    
    # دمج الرؤوس الإضافية
    foreach ($key in $Headers.Keys) {
        $RequestHeaders[$key] = $Headers[$key]
    }
    
    try {
        $StartTime = Get-Date
        
        # تحويل البيانات إلى JSON
        $JsonBody = $null
        if ($Body.Count -gt 0) {
            $JsonBody = $Body | ConvertTo-Json -Depth 10
            Write-Host "Request Body: $JsonBody" -ForegroundColor $Yellow
        }
        
        # إرسال الطلب
        if ($Method -eq "GET" -or $Method -eq "DELETE") {
            $Response = Invoke-RestMethod -Uri $URL -Method $Method -Headers $RequestHeaders -ErrorAction Stop
        } else {
            $Response = Invoke-RestMethod -Uri $URL -Method $Method -Headers $RequestHeaders -Body $JsonBody -ErrorAction Stop
        }
        
        $EndTime = Get-Date
        $Duration = ($EndTime - $StartTime).TotalMilliseconds
        
        Write-Host "✅ SUCCESS ($([math]::Round($Duration, 2))ms)" -ForegroundColor $Green
        Write-Host "Response: $($Response | ConvertTo-Json -Depth 5)" -ForegroundColor $Green
        
        # حفظ النتيجة
        $script:TestResults += @{
            Test = $TestName
            Status = "PASSED"
            Duration = $Duration
            Response = $Response
        }
        
        return $Response
        
    } catch {
        $EndTime = Get-Date
        $Duration = ($EndTime - $StartTime).TotalMilliseconds
        
        Write-Host "❌ FAILED ($([math]::Round($Duration, 2))ms)" -ForegroundColor $Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor $Red
        
        # حفظ النتيجة
        $script:TestResults += @{
            Test = $TestName
            Status = "FAILED"
            Duration = $Duration
            Error = $_.Exception.Message
        }
        
        return $null
    }
}

# دالة عرض التقرير النهائي
function Show-TestReport {
    Write-Host "`n" -ForegroundColor $Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Cyan
    Write-Host "📊 TEST REPORT - تقرير الاختبارات" -ForegroundColor $Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Cyan
    
    $TotalTests = $script:TestResults.Count
    $PassedTests = ($script:TestResults | Where-Object { $_.Status -eq "PASSED" }).Count
    $FailedTests = ($script:TestResults | Where-Object { $_.Status -eq "FAILED" }).Count
    $TotalDuration = ($script:TestResults | Measure-Object -Property Duration -Sum).Sum
    
    Write-Host "📈 Total Tests: $TotalTests" -ForegroundColor $Cyan
    Write-Host "✅ Passed: $PassedTests" -ForegroundColor $Green
    Write-Host "❌ Failed: $FailedTests" -ForegroundColor $Red
    Write-Host "⏱️  Total Duration: $([math]::Round($TotalDuration, 2))ms" -ForegroundColor $Cyan
    Write-Host "📊 Success Rate: $([math]::Round(($PassedTests / $TotalTests) * 100, 2))%" -ForegroundColor $Cyan
    
    Write-Host "`n📋 Detailed Results:" -ForegroundColor $Cyan
    foreach ($result in $script:TestResults) {
        $status = if ($result.Status -eq "PASSED") { "✅" } else { "❌" }
        $color = if ($result.Status -eq "PASSED") { $Green } else { $Red }
        Write-Host "  $status $($result.Test) - $([math]::Round($result.Duration, 2))ms" -ForegroundColor $color
        if ($result.Error) {
            Write-Host "    Error: $($result.Error)" -ForegroundColor $Red
        }
    }
}

# بدء الاختبارات
Write-Host "🚀 Starting Law Firm API Tests..." -ForegroundColor $Cyan
Write-Host "🔗 Base URL: $script:BaseURL" -ForegroundColor $Yellow

# 1. اختبار تسجيل المستخدمين
Write-Host "`n🔐 Authentication Tests - اختبار المصادقة" -ForegroundColor $Yellow

# تسجيل مستخدم جديد
$RandomNumber = Get-Random -Minimum 1000 -Maximum 9999
$TestEmail = "ahmed.test$RandomNumber@example.com"

$RegisterData = @{
    name = "Ahmed Test"
    email = $TestEmail
    password = "password123"
    password_confirmation = "password123"
    role = "lawyer"
}

$RegisterResponse = Invoke-APITest -TestName "User Registration" -Method "POST" -Endpoint "/auth/register" -Body $RegisterData -RequireAuth $false

# تسجيل الدخول
$LoginData = @{
    email = $TestEmail
    password = "password123"
}

$LoginResponse = Invoke-APITest -TestName "User Login" -Method "POST" -Endpoint "/auth/login" -Body $LoginData -RequireAuth $false

if ($LoginResponse -and $LoginResponse.Response -and $LoginResponse.Response.data -and $LoginResponse.Response.data.token) {
    $script:AuthToken = $LoginResponse.Response.data.token
    Write-Host "✅ Authentication Token Received" -ForegroundColor $Green
} else {
    Write-Host "❌ Failed to get authentication token" -ForegroundColor $Red
    exit 1
}

# 2. اختبار إدارة المستخدمين
Write-Host "`n👥 User Management Tests - اختبار إدارة المستخدمين" -ForegroundColor $Yellow

# قائمة المستخدمين
Invoke-APITest -TestName "Get Users List" -Method "GET" -Endpoint "/users"

# ملف المستخدم الحالي
Invoke-APITest -TestName "Get Current User Profile" -Method "GET" -Endpoint "/auth/me"

# إنشاء مستخدم جديد (مساعد)
$NewAssistant = @{
    name = "Sara Assistant"
    email = "sara.assistant@example.com"
    password = "password123"
    password_confirmation = "password123"
    role = "assistant"
}

$AssistantResponse = Invoke-APITest -TestName "Create Assistant User" -Method "POST" -Endpoint "/users" -Body $NewAssistant

# البحث في المستخدمين
Invoke-APITest -TestName "Search Users" -Method "GET" -Endpoint "/users?search=Sara`&role=assistant"

# 3. اختبار إدارة القضايا
Write-Host "`n⚖️ Case Management Tests - اختبار إدارة القضايا" -ForegroundColor $Yellow

# إنشاء قضية جديدة
$NewCase = @{
    title = "Test Case Title"
    description = "This is a test case description"
    case_number = "TC001-2024"
    status = "active"
    priority = "high"
    case_type = "civil"
    client_name = "Test Client"
    client_contact = "client@example.com"
    court_name = "Test Court"
    next_hearing = "2024-12-01"
}

$CaseResponse = Invoke-APITest -TestName "Create New Case" -Method "POST" -Endpoint "/cases" -Body $NewCase

if ($CaseResponse -and $CaseResponse.id) {
    $script:TestCaseId = $CaseResponse.id
    Write-Host "✅ Test Case ID: $script:TestCaseId" -ForegroundColor $Green
}

# قائمة القضايا
Invoke-APITest -TestName "Get Cases List" -Method "GET" -Endpoint "/cases"

# تفاصيل القضية
if ($script:TestCaseId) {
    Invoke-APITest -TestName "Get Case Details" -Method "GET" -Endpoint "/cases/$script:TestCaseId"
    
    # تحديث القضية
    $UpdateCase = @{
        status = "in_progress"
        priority = "medium"
    }
    
    Invoke-APITest -TestName "Update Case" -Method "PATCH" -Endpoint "/cases/$script:TestCaseId" -Body $UpdateCase
}

# البحث في القضايا
Invoke-APITest -TestName "Search Cases" -Method "GET" -Endpoint "/cases?search=Test`&status=active"

# إحصائيات القضايا
Invoke-APITest -TestName "Get Cases Statistics" -Method "GET" -Endpoint "/cases/statistics"

# 4. اختبار إدارة المهام
Write-Host "`n📋 Task Management Tests - اختبار إدارة المهام" -ForegroundColor $Yellow

if ($script:TestCaseId) {
    # إنشاء مهمة جديدة
    $NewTask = @{
        title = "Test Task"
        description = "This is a test task"
        case_id = $script:TestCaseId
        priority = "high"
        due_date = "2024-12-15"
        status = "pending"
    }
    
    $TaskResponse = Invoke-APITest -TestName "Create New Task" -Method "POST" -Endpoint "/tasks" -Body $NewTask
    
    if ($TaskResponse -and $TaskResponse.id) {
        $script:TestTaskId = $TaskResponse.id
        Write-Host "✅ Test Task ID: $script:TestTaskId" -ForegroundColor $Green
        
        # تحديث حالة المهمة
        $StatusUpdate = @{
            status = "in_progress"
            notes = "Started working - Test note"
        }
        
        Invoke-APITest -TestName "Update Task Status" -Method "PATCH" -Endpoint "/tasks/$script:TestTaskId/status" -Body $StatusUpdate
    }
}

# قائمة المهام
Invoke-APITest -TestName "Get Tasks List" -Method "GET" -Endpoint "/tasks"

# إحصائيات المهام
Invoke-APITest -TestName "Get Tasks Statistics" -Method "GET" -Endpoint "/tasks/statistics"

# 5. اختبار إدارة الوثائق
Write-Host "`n📄 Document Management Tests - اختبار إدارة الوثائق" -ForegroundColor $Yellow

if ($script:TestCaseId) {
    # إنشاء وثيقة جديدة
    $NewDocument = @{
        title = "Test Document"
        description = "This is a test document"
        case_id = $script:TestCaseId
        document_type = "contract"
        file_path = "/documents/test.pdf"
        file_size = 1024
    }
    
    $DocumentResponse = Invoke-APITest -TestName "Create New Document" -Method "POST" -Endpoint "/documents" -Body $NewDocument
    
    if ($DocumentResponse -and $DocumentResponse.id) {
        $script:TestDocumentId = $DocumentResponse.id
        Write-Host "✅ Test Document ID: $script:TestDocumentId" -ForegroundColor $Green
    }
}

# قائمة الوثائق
Invoke-APITest -TestName "Get Documents List" -Method "GET" -Endpoint "/documents"

# 6. اختبار التقارير والإحصائيات
Write-Host "`n📊 Reports and Statistics Tests - اختبار التقارير والإحصائيات" -ForegroundColor $Yellow

# لوحة التحكم
Invoke-APITest -TestName "Get Dashboard Data" -Method "GET" -Endpoint "/dashboard"

# التقارير
Invoke-APITest -TestName "Get Reports" -Method "GET" -Endpoint "/reports"

# الأنشطة
Invoke-APITest -TestName "Get Activities" -Method "GET" -Endpoint "/activities"

# 7. اختبار الإشعارات
Write-Host "`n🔔 Notification Tests - اختبار الإشعارات" -ForegroundColor $Yellow

# قائمة الإشعارات
Invoke-APITest -TestName "Get Notifications" -Method "GET" -Endpoint "/notifications"

# إحصائيات الإشعارات
Invoke-APITest -TestName "Get Notifications Count" -Method "GET" -Endpoint "/notifications/unread-count"

# 8. اختبار الملف الشخصي
Write-Host "`n👤 Profile Tests - اختبار الملف الشخصي" -ForegroundColor $Yellow

# تحديث الملف الشخصي
$UpdateProfile = @{
    name = "Ahmed Test Updated"
    phone = "+1234567890"
}

Invoke-APITest -TestName "Update Profile" -Method "PUT" -Endpoint "/auth/profile" -Body $UpdateProfile

# الحصول على الملف الشخصي المحدث
Invoke-APITest -TestName "Get Updated Profile" -Method "GET" -Endpoint "/auth/me"

# 9. اختبار تسجيل الخروج
Write-Host "`n🚪 Logout Test - اختبار تسجيل الخروج" -ForegroundColor $Yellow

Invoke-APITest -TestName "User Logout" -Method "POST" -Endpoint "/auth/logout"

# عرض التقرير النهائي
Show-TestReport

Write-Host "`n🎉 Test completed! Check the results above." -ForegroundColor $Green
