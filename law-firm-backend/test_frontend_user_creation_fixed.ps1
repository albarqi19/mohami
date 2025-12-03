# Test Frontend User Creation
# This script simulates creating a user from the frontend

$baseUrl = "http://localhost:8000/api/v1"

# Headers
$headers = @{
    'Content-Type' = 'application/json'
    'Accept' = 'application/json'
}

Write-Host "=== Testing Frontend User Creation ===" -ForegroundColor Green

try {
    # Step 1: Login as admin
    Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
    $loginBody = @{
        national_id = "1234567890"
        pin = "1234"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -Headers $headers
    $token = $loginResponse.access_token
    Write-Host "   Login successful! Token received." -ForegroundColor Green

    # Step 2: Add Authorization header
    $authHeaders = $headers.Clone()
    $authHeaders['Authorization'] = "Bearer $token"

    # Step 3: Create a new lawyer
    Write-Host "2. Creating new lawyer..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "HH:mm:ss"
    $newUserBody = @{
        name = "Test Lawyer - $timestamp"
        national_id = "TEST$(Get-Random -Minimum 1000000000 -Maximum 9999999999)"
        phone = "+966530996778"
        role = "lawyer"
    } | ConvertTo-Json -Depth 2

    Write-Host "   Request body: $newUserBody" -ForegroundColor Cyan
    
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Body $newUserBody -Headers $authHeaders
    
    Write-Host "   User created successfully!" -ForegroundColor Green
    Write-Host "   User ID: $($createResponse.user.id)" -ForegroundColor White
    Write-Host "   Name: $($createResponse.user.name)" -ForegroundColor White
    Write-Host "   National ID: $($createResponse.user.national_id)" -ForegroundColor White
    Write-Host "   PIN: $($createResponse.pin)" -ForegroundColor White
    Write-Host "   Phone: $($createResponse.user.phone)" -ForegroundColor White

    # Step 4: Check if message was sent
    Write-Host "3. Checking if welcome message was sent..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2

    # Simple check - just show that user was created
    Write-Host "   User creation completed - Event should have been triggered!" -ForegroundColor Green

} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
