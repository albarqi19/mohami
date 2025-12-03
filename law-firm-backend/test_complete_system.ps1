# =============================================================================
# Complete Law Firm API Test Script - Windows PowerShell
# سكريپت اختبار API نظام إدارة المحاماة الكامل - ويندوز پاورشل
# =============================================================================

# إعدادات عامة
$script:BaseURL = "http://127.0.0.1:8000/api/v1"
$script:AuthToken = ""
$script:TestResults = @()

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
        [bool]$RequireAuth = $true
    )
    
    Write-Host "`n[TEST] $TestName" -ForegroundColor $Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Yellow
    
    $URL = "$script:BaseURL$Endpoint"
    $RequestHeaders = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    # إضافة التوكن إذا كان مطلوب
    if ($RequireAuth -and $script:AuthToken) {
        $RequestHeaders["Authorization"] = "Bearer $script:AuthToken"
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

# بدء الاختبارات
Write-Host "🚀 Starting Complete Law Firm API Tests..." -ForegroundColor $Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Cyan

# 1. اختبار الـ endpoints البسيطة (بدون مصادقة)
Write-Host "`n🧪 Simple Endpoints Tests (No Auth)" -ForegroundColor $Yellow

Invoke-APITest -TestName "Hello World" -Method "GET" -Endpoint "/simple/hello" -RequireAuth $false
Invoke-APITest -TestName "Simple Cases" -Method "GET" -Endpoint "/simple/cases" -RequireAuth $false
Invoke-APITest -TestName "Simple Tasks" -Method "GET" -Endpoint "/simple/tasks" -RequireAuth $false
Invoke-APITest -TestName "Simple Documents" -Method "GET" -Endpoint "/simple/documents" -RequireAuth $false

# 2. اختبار المصادقة
Write-Host "`n🔐 Authentication Tests" -ForegroundColor $Yellow

# تسجيل مستخدم جديد
$RandomNumber = Get-Random -Minimum 1000 -Maximum 9999
$TestEmail = "test.user$RandomNumber@example.com"

$RegisterData = @{
    name = "Test User $RandomNumber"
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

# استخراج التوكن
if ($LoginResponse -and $LoginResponse.Response -and $LoginResponse.Response.data -and $LoginResponse.Response.data.token) {
    $script:AuthToken = $LoginResponse.Response.data.token
    Write-Host "✅ Authentication Token Received!" -ForegroundColor $Green
} else {
    Write-Host "❌ Failed to get authentication token" -ForegroundColor $Red
    Write-Host "🔍 Trying to extract token from login response..." -ForegroundColor $Yellow
    if ($LoginResponse) {
        Write-Host "Login Response Structure: $($LoginResponse | ConvertTo-Json -Depth 10)" -ForegroundColor $Cyan
    }
}

# 3. اختبار الـ endpoints المحمية (مع مصادقة)
if ($script:AuthToken) {
    Write-Host "`n🔒 Protected Endpoints Tests (With Auth)" -ForegroundColor $Yellow
    
    Invoke-APITest -TestName "Get Current User Profile" -Method "GET" -Endpoint "/auth/me"
    Invoke-APITest -TestName "Protected Cases" -Method "GET" -Endpoint "/cases"
    Invoke-APITest -TestName "Protected Tasks" -Method "GET" -Endpoint "/tasks"
    Invoke-APITest -TestName "Protected Documents" -Method "GET" -Endpoint "/documents"
    
    # اختبار تحديث الملف الشخصي
    $UpdateProfile = @{
        name = "Updated Test User $RandomNumber"
        phone = "+1234567890"
    }
    
    Invoke-APITest -TestName "Update Profile" -Method "PUT" -Endpoint "/auth/profile" -Body $UpdateProfile
    
    # تسجيل الخروج
    Invoke-APITest -TestName "User Logout" -Method "POST" -Endpoint "/auth/logout"
} else {
    Write-Host "`n⚠️ Skipping protected endpoints tests - No authentication token" -ForegroundColor $Yellow
}

# تقرير النتائج
Write-Host "`n📊 TEST REPORT" -ForegroundColor $Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Cyan

$TotalTests = $script:TestResults.Count
$PassedTests = ($script:TestResults | Where-Object { $_.Status -eq "PASSED" }).Count
$FailedTests = ($script:TestResults | Where-Object { $_.Status -eq "FAILED" }).Count
$TotalDuration = ($script:TestResults | Measure-Object -Property Duration -Sum).Sum

Write-Host "Total Tests: $TotalTests" -ForegroundColor $Cyan
Write-Host "Passed: $PassedTests" -ForegroundColor $Green
Write-Host "Failed: $FailedTests" -ForegroundColor $Red
Write-Host "Total Duration: $([math]::Round($TotalDuration, 2))ms" -ForegroundColor $Cyan
Write-Host "Success Rate: $([math]::Round(($PassedTests / $TotalTests) * 100, 2))%" -ForegroundColor $Cyan

if ($FailedTests -gt 0) {
    Write-Host "`n❌ Failed Tests:" -ForegroundColor $Red
    $script:TestResults | Where-Object { $_.Status -eq "FAILED" } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Error)" -ForegroundColor $Red
    }
}

Write-Host "`n🏁 Complete API Test Completed!" -ForegroundColor $Cyan
