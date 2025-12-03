# Test Simple Endpoints
$BaseURL = "http://127.0.0.1:8000/api/v1/simple"
$Headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "🧪 Testing Simple Endpoints..." -ForegroundColor Yellow

# Test Hello
Write-Host "`n👋 Testing Hello..." -ForegroundColor Green
try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/hello" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Hello Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Hello Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test Cases
Write-Host "`n📁 Testing Cases..." -ForegroundColor Green
try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/cases" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Cases Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cases Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test Tasks
Write-Host "`n📋 Testing Tasks..." -ForegroundColor Green
try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/tasks" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Tasks Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Tasks Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test Documents
Write-Host "`n📄 Testing Documents..." -ForegroundColor Green
try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/documents" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Documents Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Documents Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🏁 Simple Test Completed!" -ForegroundColor Yellow
