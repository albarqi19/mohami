# Simple WhatsApp Lawyer Notifications Test Script
$baseUrl = "http://localhost:8000/api"
$adminToken = ""

Write-Host "=== Testing Lawyer WhatsApp Notifications ===" -ForegroundColor Green

# 1. Admin Login
Write-Host "`n1. Admin Login..." -ForegroundColor Yellow
$loginData = @{
    identity_number = "1111111111"
    secret_code = "1111"
} | ConvertTo-Json -Depth 10

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/admin/login" -Method POST -ContentType "application/json" -Body $loginData
    $adminToken = $loginResponse.token
    Write-Host "✓ Admin login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

# 2. Test Direct Message
Write-Host "`n2. Testing direct message..." -ForegroundColor Yellow
try {
    $messageResponse = Invoke-RestMethod -Uri "$baseUrl/test/lawyer-notifications/test-message" -Method POST -Headers $headers
    Write-Host "✓ Direct message sent successfully" -ForegroundColor Green
    Write-Host "Response: $($messageResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Direct message failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test Document Upload Notification
Write-Host "`n3. Testing document upload notification..." -ForegroundColor Yellow
$uploadData = @{
    title = "Test Document"
    category = "evidence"
    case_id = 1
} | ConvertTo-Json -Depth 10

try {
    $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/test/document-upload" -Method POST -Headers $headers -Body $uploadData
    Write-Host "✓ Document upload notification sent" -ForegroundColor Green
    Write-Host "Response: $($uploadResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Document upload notification failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test Overdue Tasks Check
Write-Host "`n4. Testing overdue tasks check..." -ForegroundColor Yellow
try {
    $overdueResponse = Invoke-RestMethod -Uri "$baseUrl/test/lawyer-notifications/overdue-tasks" -Method POST -Headers $headers
    Write-Host "✓ Overdue tasks check completed" -ForegroundColor Green
    Write-Host "Response: $($overdueResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Overdue tasks check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test Upcoming Hearings Check
Write-Host "`n5. Testing upcoming hearings check..." -ForegroundColor Yellow
try {
    $hearingResponse = Invoke-RestMethod -Uri "$baseUrl/test/lawyer-notifications/upcoming-hearings" -Method POST -Headers $headers
    Write-Host "✓ Upcoming hearings check completed" -ForegroundColor Green
    Write-Host "Response: $($hearingResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Upcoming hearings check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Completed ===" -ForegroundColor Green
Write-Host "Please check WhatsApp on number 966530996778 for received notifications" -ForegroundColor Yellow
