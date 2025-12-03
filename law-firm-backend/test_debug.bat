@echo off
echo Debug route test...

echo.
echo Getting authentication token...
powershell -c "$body = @{national_id='1234567890'; pin='1234'} | ConvertTo-Json; $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json'; $response.data.token" > token.txt
set /p TOKEN=<token.txt
del token.txt

echo Token: %TOKEN%

echo.
echo Testing debug route with token...
powershell -c "$headers = @{'Authorization'='Bearer %TOKEN%'; 'Content-Type'='application/json'}; try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/debug/cases' -Method GET -Headers $headers; Write-Host 'DEBUG SUCCESS:'; $response | ConvertTo-Json -Depth 3 } catch { Write-Host 'DEBUG Error:' $_.Exception.Message; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $reader.ReadToEnd() } }"

echo.
echo Testing apiResource cases route...
powershell -c "$headers = @{'Authorization'='Bearer %TOKEN%'; 'Content-Type'='application/json'}; try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases' -Method GET -Headers $headers; Write-Host 'APIRESOURCE SUCCESS:'; $response | ConvertTo-Json -Depth 3 } catch { Write-Host 'APIRESOURCE Error:' $_.Exception.Message; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $reader.ReadToEnd() } }"

pause
