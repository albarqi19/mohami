@echo off
echo Testing cases retrieval...

set "LOGIN_URL=http://localhost:8000/api/v1/auth/login"
set "CASES_URL=http://localhost:8000/api/v1/cases"

echo.
echo === Step 1: Login to get token ===
powershell -Command "$body = @{national_id='1234567890'; pin='1234'} | ConvertTo-Json; $response = Invoke-RestMethod -Uri '%LOGIN_URL%' -Method POST -Body $body -ContentType 'application/json'; $token = $response.data.token; echo 'Token:'; echo $token; $headers = @{'Authorization' = 'Bearer ' + $token; 'Content-Type' = 'application/json'}; echo ''; echo '=== Step 2: Get cases ==='; try { $casesResponse = Invoke-RestMethod -Uri '%CASES_URL%?page=1&limit=10' -Method GET -Headers $headers; echo 'SUCCESS: Cases retrieved successfully!'; echo $casesResponse | ConvertTo-Json -Depth 3 } catch { echo 'ERROR: Failed to get cases'; echo $_.Exception.Message; if ($_.Exception.Response) { $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $responseBody = $reader.ReadToEnd(); echo 'Response body:'; echo $responseBody } }"

pause
