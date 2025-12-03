# =============================================================================
# Simple Test Script Without Auth - اختبار بسيط بدون مصادقة
# =============================================================================

$BaseURL = "http://127.0.0.1:8000/api/v1"
$Headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "🧪 Testing Endpoints Without Authentication..." -ForegroundColor Yellow

# Test Cases
Write-Host "`n📁 Testing Cases..." -ForegroundColor Green
try {
    $CasesResponse = Invoke-RestMethod -Uri "$BaseURL/test/cases" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Cases Success!" -ForegroundColor Green
    Write-Host "Response: $($CasesResponse | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cases Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Tasks  
Write-Host "`n📋 Testing Tasks..." -ForegroundColor Green
try {
    $TasksResponse = Invoke-RestMethod -Uri "$BaseURL/test/tasks" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Tasks Success!" -ForegroundColor Green
    Write-Host "Response: $($TasksResponse | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Tasks Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Documents
Write-Host "`n📄 Testing Documents..." -ForegroundColor Green
try {
    $DocsResponse = Invoke-RestMethod -Uri "$BaseURL/test/documents" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Documents Success!" -ForegroundColor Green
    Write-Host "Response: $($DocsResponse | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Documents Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Notifications
Write-Host "`n🔔 Testing Notifications..." -ForegroundColor Green
try {
    $NotificationsResponse = Invoke-RestMethod -Uri "$BaseURL/test/notifications" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Notifications Success!" -ForegroundColor Green
    Write-Host "Response: $($NotificationsResponse | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Notifications Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Test Completed!" -ForegroundColor Yellow
