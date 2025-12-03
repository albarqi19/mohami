# Run test for lawyer WhatsApp notifications
# This script will:
# 1. Start Laravel server in background
# 2. Wait for server to be ready
# 3. Run the notification test script
# 4. Display results

Write-Host "=== Running Complete Test for Lawyer WhatsApp Notifications ===" -ForegroundColor Green

# 1. Start Laravel server in background
Write-Host "`n1. Starting Laravel server..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\ALBAR\Downloads\محامي\law-firm-backend"
    php artisan serve --host=127.0.0.1 --port=8000
}

# 2. Wait for server to be ready
Write-Host "2. Waiting for server to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test if server is running
try {
    Invoke-WebRequest -Uri "http://localhost:8000" -Method GET -TimeoutSec 10 | Out-Null
    Write-Host "✓ Laravel server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start Laravel server" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

# 3. Run the notification test script
Write-Host "`n3. Running notification tests..." -ForegroundColor Yellow
try {
    & ".\test_lawyer_notifications.ps1"
} catch {
    Write-Host "✗ Test script failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Stop the server
Write-Host "`n4. Stopping Laravel server..." -ForegroundColor Yellow
Stop-Job $serverJob
Remove-Job $serverJob

Write-Host "`n=== Test Completed ===" -ForegroundColor Green
