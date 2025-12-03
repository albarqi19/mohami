# =============================================================================
# Simple API Test - Windows PowerShell
# اختبار بسيط للـ API - ويندوز باورشل
# =============================================================================

# إعدادات عامة
$BaseURL = "http://127.0.0.1:8000/api/v1"
$Headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "🚀 Starting Simple API Test..." -ForegroundColor Green

# 1. تسجيل مستخدم جديد
$RandomNumber = Get-Random -Minimum 1000 -Maximum 9999
$TestEmail = "test$RandomNumber@example.com"

$RegisterData = @{
    name = "Test User"
    email = $TestEmail
    password = "password123"
    password_confirmation = "password123"
    role = "lawyer"
}

Write-Host "`n📝 Testing User Registration..." -ForegroundColor Yellow
try {
    $RegisterResponse = Invoke-RestMethod -Uri "$BaseURL/auth/register" -Method POST -Headers $Headers -Body ($RegisterData | ConvertTo-Json) -ErrorAction Stop
    Write-Host "✅ Registration Success!" -ForegroundColor Green
    Write-Host "User ID: $($RegisterResponse.data.user.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Registration Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. تسجيل الدخول
$LoginData = @{
    email = $TestEmail
    password = "password123"
}

Write-Host "`n🔐 Testing User Login..." -ForegroundColor Yellow
try {
    $LoginResponse = Invoke-RestMethod -Uri "$BaseURL/auth/login" -Method POST -Headers $Headers -Body ($LoginData | ConvertTo-Json) -ErrorAction Stop
    Write-Host "✅ Login Success!" -ForegroundColor Green
    
    # استخراج التوكن
    $Token = $LoginResponse.data.token
    Write-Host "🔑 Token: $Token" -ForegroundColor Cyan
    
    # إضافة التوكن للـ Headers
    $AuthHeaders = $Headers.Clone()
    $AuthHeaders["Authorization"] = "Bearer $Token"
    
} catch {
    Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. اختبار الوصول للملف الشخصي
Write-Host "`n👤 Testing Profile Access..." -ForegroundColor Yellow
try {
    $ProfileResponse = Invoke-RestMethod -Uri "$BaseURL/auth/me" -Method GET -Headers $AuthHeaders -ErrorAction Stop
    Write-Host "✅ Profile Access Success!" -ForegroundColor Green
    Write-Host "User Name: $($ProfileResponse.data.name)" -ForegroundColor Cyan
    Write-Host "User Email: $($ProfileResponse.data.email)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Profile Access Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. اختبار قائمة القضايا
Write-Host "`n⚖️ Testing Cases List..." -ForegroundColor Yellow
try {
    $CasesResponse = Invoke-RestMethod -Uri "$BaseURL/cases" -Method GET -Headers $AuthHeaders -ErrorAction Stop
    Write-Host "✅ Cases List Success!" -ForegroundColor Green
    Write-Host "Total Cases: $($CasesResponse.data.cases.count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cases List Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. اختبار قائمة المهام
Write-Host "`n📋 Testing Tasks List..." -ForegroundColor Yellow
try {
    $TasksResponse = Invoke-RestMethod -Uri "$BaseURL/tasks" -Method GET -Headers $AuthHeaders -ErrorAction Stop
    Write-Host "✅ Tasks List Success!" -ForegroundColor Green
    Write-Host "Total Tasks: $($TasksResponse.data.tasks.count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Tasks List Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. اختبار قائمة الوثائق
Write-Host "`n📄 Testing Documents List..." -ForegroundColor Yellow
try {
    $DocumentsResponse = Invoke-RestMethod -Uri "$BaseURL/documents" -Method GET -Headers $AuthHeaders -ErrorAction Stop
    Write-Host "✅ Documents List Success!" -ForegroundColor Green
    Write-Host "Total Documents: $($DocumentsResponse.data.documents.count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Documents List Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. اختبار تسجيل الخروج
Write-Host "`n🚪 Testing Logout..." -ForegroundColor Yellow
try {
    $LogoutResponse = Invoke-RestMethod -Uri "$BaseURL/auth/logout" -Method POST -Headers $AuthHeaders -ErrorAction Stop
    Write-Host "✅ Logout Success!" -ForegroundColor Green
} catch {
    Write-Host "❌ Logout Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Simple API Test Completed!" -ForegroundColor Green
