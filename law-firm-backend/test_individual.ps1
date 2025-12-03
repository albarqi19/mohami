# =============================================================================
# Simple Individual Test Script
# =============================================================================

$BaseURL = "http://127.0.0.1:8000/api/v1"
$Headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "🧪 Testing Individual Endpoints..." -ForegroundColor Yellow

# Test Cases
Write-Host "`n📁 Testing Cases..." -ForegroundColor Green
try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/test/cases" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Cases Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cases Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n⏱️ Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test Tasks
Write-Host "`n📋 Testing Tasks..." -ForegroundColor Green
try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/test/tasks" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Tasks Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Tasks Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n⏱️ Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Test Documents
Write-Host "`n📄 Testing Documents..." -ForegroundColor Green
try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/test/documents" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Documents Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Documents Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🏁 Individual Test Completed!" -ForegroundColor Yellow
