@echo off
title Stop All Services
color 0C

echo ============================================================
echo    Stopping Law Firm System Services
echo ============================================================
echo.

echo Stopping Cloudflare Tunnel...
taskkill /FI "WINDOWTITLE eq Cloudflare Tunnel*" /F 2>nul

echo Stopping Frontend Server...
taskkill /FI "WINDOWTITLE eq Frontend*" /F 2>nul

echo Stopping Backend API Server...
taskkill /FI "WINDOWTITLE eq Backend*" /F 2>nul

echo.
echo ============================================================
echo    All services stopped!
echo ============================================================
echo.
pause
