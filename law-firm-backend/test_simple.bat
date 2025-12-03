@echo off
echo Simple route test...

echo.
echo Testing login first...
powershell -c "$body = @{national_id='1234567890'; pin='1234'} | ConvertTo-Json; try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json'; Write-Host 'Login Success'; Write-Host 'Token:' $response.data.access_token; $env:TOKEN = $response.data.access_token } catch { Write-Host 'Login Error:' $_.Exception.Message }"

echo.
echo Testing cases index without auth...
powershell -c "try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/cases' -Method GET; Write-Host 'Cases index without auth:' $response } catch { Write-Host 'Expected error (no auth):' $_.Exception.Message }"

echo.
echo Testing simple route...
powershell -c "try { $response = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/simple/hello' -Method GET; Write-Host 'Simple route works:' $response } catch { Write-Host 'Simple route error:' $_.Exception.Message }"

echo.
pause
