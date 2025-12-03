@echo off
setlocal enabledelayedexpansion
echo =================================
echo   Testing Law Firm System API
echo =================================
echo.

echo [1] Testing Login...
curl -X POST "http://localhost:8000/api/v1/auth/login" ^
     -H "Content-Type: application/json" ^
     -H "Accept: application/json" ^
     -d "{\"national_id\":\"1234567890\",\"pin\":\"1234\"}" ^
     -o login_response.json -w "Status: %%{http_code}\n"

if exist login_response.json (
    echo Login Response:
    type login_response.json
    echo.
    
    echo [2] Extracting token...
    REM Use PowerShell to extract token from JSON
    for /f %%i in ('powershell -command "(Get-Content login_response.json | ConvertFrom-Json).data.token"') do set "token=%%i"
    
    echo Token: !token!
    echo.
    
    echo [3] Testing Cases with token...
    curl -X GET "http://localhost:8000/api/v1/cases" ^
         -H "Content-Type: application/json" ^
         -H "Accept: application/json" ^
         -H "Authorization: Bearer !token!" ^
         -w "Status: %%{http_code}\n"
         
    echo.
    echo [4] Testing specific case...
    curl -X GET "http://localhost:8000/api/v1/cases?page=1&limit=10" ^
         -H "Content-Type: application/json" ^
         -H "Accept: application/json" ^
         -H "Authorization: Bearer !token!" ^
         -w "Status: %%{http_code}\n"
) else (
    echo Login failed - no response file created
)

echo.
echo =================================
echo   Test Complete
echo =================================
pause
