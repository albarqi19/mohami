@echo off
echo Testing case details endpoint...
echo.

REM Get authentication token first
echo Getting authentication token...
powershell -c "$body = @{national_id='1234567890'; pin='1234'} | ConvertTo-Json; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json'; $response.data.token" > token.txt
set /p TOKEN=<token.txt
del token.txt"

echo.
echo Test completed.
pause
