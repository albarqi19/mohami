@echo off
echo Testing case activities API...
echo.

echo Getting authentication token...
for /f "tokens=*" %%a in ('powershell -c "$body = @{national_id='1234567890'; pin='1234'} | ConvertTo-Json; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json'; $response.data.token"') do set TOKEN=%%a

if "%TOKEN%"=="" (
    echo Failed to get authentication token
    pause
    exit /b 1
)

echo Token obtained successfully
echo.

echo Testing case activities endpoint...
echo.

powershell -c "try { $headers = @{'Authorization' = 'Bearer %TOKEN%'; 'Accept' = 'application/json'}; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases/2/activities' -Method GET -Headers $headers; Write-Host 'SUCCESS: Case activities retrieved'; $response | ConvertTo-Json -Depth 10 } catch { Write-Host 'ERROR:' $_.Exception.Message; if ($_.Exception.Response) { $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); Write-Host $reader.ReadToEnd() } }"

echo.
pause
