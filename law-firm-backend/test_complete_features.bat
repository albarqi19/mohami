@echo off
echo Testing complete law firm system...
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

echo =========================
echo Testing Case Details API
echo =========================
echo.

powershell -c "try { $headers = @{'Authorization' = 'Bearer %TOKEN%'; 'Accept' = 'application/json'}; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases/2' -Method GET -Headers $headers; Write-Host 'SUCCESS: Case details retrieved'; $response | ConvertTo-Json -Depth 3 } catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo =========================
echo Testing Case Activities API
echo =========================
echo.

powershell -c "try { $headers = @{'Authorization' = 'Bearer %TOKEN%'; 'Accept' = 'application/json'}; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases/2/activities' -Method GET -Headers $headers; Write-Host 'SUCCESS: Case activities retrieved'; $response | ConvertTo-Json -Depth 5 } catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo =========================
echo Testing Tasks API
echo =========================
echo.

powershell -c "try { $headers = @{'Authorization' = 'Bearer %TOKEN%'; 'Accept' = 'application/json'}; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/tasks?case_id=2' -Method GET -Headers $headers; Write-Host 'SUCCESS: Tasks retrieved'; $response | ConvertTo-Json -Depth 3 } catch { Write-Host 'ERROR:' $_.Exception.Message }"

echo.
echo =========================
echo All tests completed!
echo =========================
pause
