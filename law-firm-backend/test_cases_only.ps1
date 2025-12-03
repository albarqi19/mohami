# Test Cases Only
$BaseURL = "http://127.0.0.1:8000/api/v1"
$Headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "🧪 Testing Cases Only..." -ForegroundColor Yellow

try {
    $Response = Invoke-RestMethod -Uri "$BaseURL/test/cases" -Method GET -Headers $Headers -ErrorAction Stop
    Write-Host "✅ Cases Success!" -ForegroundColor Green
    Write-Host "Response: $($Response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cases Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🏁 Cases Test Completed!" -ForegroundColor Yellow
