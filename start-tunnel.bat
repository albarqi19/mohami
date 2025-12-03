@echo off
chcp 65001 >nul
title Cloudflare Tunnel - brqq.site
color 0B

echo.
echo ========================================
echo   🚀 تشغيل Cloudflare Tunnel
echo ========================================
echo.
echo Tunnel: law-firm-brqq
echo Domain: brqq.site
echo.
echo Frontend: https://brqq.site
echo API: https://api.brqq.site
echo Database: https://db.brqq.site
echo.
echo ========================================
echo.

cloudflared.exe tunnel run law-firm-brqq

pause
