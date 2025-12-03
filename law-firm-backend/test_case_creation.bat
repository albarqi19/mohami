@echo off
echo Testing case creation with exact frontend data...

set "LOGIN_URL=http://localhost:8000/api/v1/auth/login"
set "CASES_URL=http://localhost:8000/api/v1/cases"

echo.
echo === Step 1: Login to get token ===
powershell -Command "$body = @{national_id='1234567890'; pin='1234'} | ConvertTo-Json; $response = Invoke-RestMethod -Uri '%LOGIN_URL%' -Method POST -Body $body -ContentType 'application/json'; $token = $response.data.token; echo 'Token:'; echo $token; $headers = @{'Authorization' = 'Bearer ' + $token; 'Content-Type' = 'application/json'}; echo ''; echo '=== Step 2: Create case with exact frontend data ==='; $caseBody = @{title='اتنانانان'; description='اتنانانان'; type='civil'; priority='medium'; client_id=4; primary_lawyer_id=2; start_date='2025-09-23'; expected_end_date='2025-09-30'; court_name='المحكمة العامة'; court_reference='3564565210'; opposing_party='نتاتنان'; case_value=24545245; status='active'} | ConvertTo-Json; echo 'Case data:'; echo $caseBody; echo ''; try { $caseResponse = Invoke-RestMethod -Uri '%CASES_URL%' -Method POST -Body $caseBody -Headers $headers; echo 'SUCCESS: Case created successfully!'; echo $caseResponse | ConvertTo-Json -Depth 3 } catch { echo 'ERROR: Failed to create case'; echo $_.Exception.Message; if ($_.Exception.Response) { $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); $responseBody = $reader.ReadToEnd(); echo 'Response body:'; echo $responseBody } }"

pause
