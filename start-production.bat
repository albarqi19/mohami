@echo off
title Law Firm System - Production Startup
color 0A

echo ============================================================
echo    Law Firm Management System - Production Mode
echo    Domain: brqq.site
echo ============================================================
echo.

:: تحقق من وجود Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js غير مثبت!
    echo الرجاء تثبيت Node.js من: https://nodejs.org/
    pause
    exit /b 1
)

:: تحقق من وجود PHP
where php >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PHP غير مثبت!
    echo الرجاء تثبيت PHP أو تشغيل XAMPP/WAMP
    pause
    exit /b 1
)

echo [1/4] Starting Backend API Server...
echo.
start "Backend API - Port 8000" cmd /k "cd law-firm-backend && php artisan serve --host=0.0.0.0 --port=8000"
timeout /t 3 >nul

echo [2/4] Building Frontend...
echo.
cd law-firm-system
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] فشل بناء Frontend!
    pause
    exit /b 1
)

echo [3/4] Starting Frontend Preview Server...
echo.
start "Frontend Preview - Port 5173" cmd /k "npm run preview -- --port 5173"
timeout /t 3 >nul
cd ..

echo [4/4] Starting Cloudflare Tunnel...
echo.
echo ============================================================
echo   الخدمات متاحة على:
echo   - Frontend: https://brqq.site
echo   - API: https://api.brqq.site
echo   - Database: https://db.brqq.site
echo ============================================================
echo.
echo ملاحظة: تأكد من إعداد DNS Records في Cloudflare Dashboard
echo.

start "Cloudflare Tunnel - brqq.site" cmd /k "cloudflared.exe tunnel --config cloudflare-tunnel-config.yml run"

echo.
echo ============================================================
echo   جميع الخدمات تعمل الآن!
echo ============================================================
echo.
echo اضغط أي زر للعودة إلى القائمة الرئيسية...
pause >nul
