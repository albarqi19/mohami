# Test Tasks Only
$BaseURL = "http://127.0.0.1:8000/api/v1"
$Headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "🧪 Testing Tasks Only..." -ForegroundColor Yellow

try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/test/tasks" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Tasks Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Tasks Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🏁 Tasks Test Completed!" -ForegroundColor Yellow
