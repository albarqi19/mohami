@echo off
echo Testing case details with PowerShell...

powershell -ExecutionPolicy Bypass -Command ^
"Write-Host 'Getting token...' -ForegroundColor Yellow; ^
$body = @{national_id='1234567890'; pin='1234'} ^| ConvertTo-Json; ^
$response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json'; ^
$token = $response.data.token; ^
Write-Host 'Token obtained successfully' -ForegroundColor Green; ^
Write-Host 'Testing case details...' -ForegroundColor Yellow; ^
$headers = @{'Authorization'='Bearer ' + $token; 'Content-Type'='application/json'}; ^
try { ^
    $caseResponse = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases/2' -Method GET -Headers $headers; ^
    Write-Host 'SUCCESS: Case details retrieved' -ForegroundColor Green; ^
    $caseResponse ^| ConvertTo-Json -Depth 5 ^
} catch { ^
    Write-Host 'ERROR:' $_.Exception.Message -ForegroundColor Red; ^
    if ($_.Exception.Response) { ^
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); ^
        Write-Host $reader.ReadToEnd() -ForegroundColor Red ^
    } ^
}"

pause
