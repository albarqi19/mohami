@echo off
chcp 65001 >nul
title Law Firm System - Starting Services
color 0A

echo.
echo ============================================================
echo    نظام إدارة المحاماة - تشغيل الخدمات
echo    Domain: brqq.site
echo ============================================================
echo.

:: تشغيل Backend
echo [1/3] Starting Backend API Server (Port 8000)...
start "Backend API - brqq.site" cmd /k "cd law-firm-backend && php artisan serve --host=0.0.0.0 --port=8000"
timeout /t 2 >nul

:: تشغيل Frontend
echo [2/3] Starting Frontend Dev Server (Port 5173)...
start "Frontend - brqq.site" cmd /k "cd law-firm-system && npm run dev"
timeout /t 3 >nul

:: تشغيل Cloudflare Tunnel
echo [3/3] Starting Cloudflare Tunnel (law-firm-brqq)...
echo.
echo ============================================================
echo    الخدمات متاحة على:
echo    - Frontend: https://brqq.site
echo    - API: https://api.brqq.site
echo    - Database: https://db.brqq.site
echo ============================================================
echo.

start "Cloudflare Tunnel - brqq.site" cmd /k "cloudflared.exe tunnel run law-firm-brqq"

echo.
echo ============================================================
echo    ✅ تم تشغيل جميع الخدمات بنجاح!
echo ============================================================
echo.
echo ملاحظة: انتظر 30 ثانية حتى تعمل جميع الخدمات
echo ثم افتح https://brqq.site في المتصفح
echo.
pause
