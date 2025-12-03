# PowerShell API Test Script
Write-Host "Testing API routes..." -ForegroundColor Green

# Login and get token
Write-Host "`nGetting authentication token..." -ForegroundColor Yellow
$body = @{
    national_id = '1234567890'
    pin = '1234'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json'
    $token = $loginResponse.data.token
    Write-Host "Token obtained successfully: $($token.Substring(0,10))..." -ForegroundColor Green
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Headers for authenticated requests
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

# Test debug route
Write-Host "`nTesting debug route..." -ForegroundColor Yellow
try {
    $debugResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/debug/cases' -Method GET -Headers $headers
    Write-Host "DEBUG ROUTE SUCCESS:" -ForegroundColor Green
    $debugResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "DEBUG ROUTE ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
}

# Test cases index route
Write-Host "`nTesting cases index route..." -ForegroundColor Yellow
try {
    $casesResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases' -Method GET -Headers $headers
    Write-Host "CASES INDEX SUCCESS:" -ForegroundColor Green
    $casesResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "CASES INDEX ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
}

# Test specific case
Write-Host "`nTesting case show route..." -ForegroundColor Yellow
try {
    $caseResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases/1' -Method GET -Headers $headers
    Write-Host "CASE SHOW SUCCESS:" -ForegroundColor Green
    $caseResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "CASE SHOW ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
}

Write-Host "`nTest completed." -ForegroundColor Green
Read-Host "Press Enter to continue"
