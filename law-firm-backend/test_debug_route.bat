@echo off
echo Testing route debugging...

echo.
echo Getting authentication token...
for /f "tokens=*" %%i in ('powershell -c "$body = @{national_id='1234567890'; pin='1234'} | ConvertTo-Json; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json'; $response.data.access_token"') do set TOKEN=%%i

if "%TOKEN%"=="" (
    echo Failed to get token
    pause
    exit /b 1
)

echo Token obtained successfully

echo.
echo Testing list all cases first...
powershell -c "$headers = @{'Authorization'='Bearer %TOKEN%'; 'Content-Type'='application/json'}; try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases' -Method GET -Headers $headers; $response | ConvertTo-Json -Depth 10 } catch { Write-Host 'Error occurred:' $_.Exception.Message; if ($_.Exception.Response) { $_.Exception.Response.GetResponseStream() | ForEach-Object { $reader = New-Object System.IO.StreamReader($_); $reader.ReadToEnd() } } }"

echo.
echo Testing case details with ID 1...
powershell -c "$headers = @{'Authorization'='Bearer %TOKEN%'; 'Content-Type'='application/json'}; try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases/1' -Method GET -Headers $headers; $response | ConvertTo-Json -Depth 10 } catch { Write-Host 'Error occurred:' $_.Exception.Message; if ($_.Exception.Response) { $_.Exception.Response.GetResponseStream() | ForEach-Object { $reader = New-Object System.IO.StreamReader($_); $reader.ReadToEnd() } } }"

echo.
echo Test completed.
pause
