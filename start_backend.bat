@echo off
echo ======================================================
echo   Starting CyberShield AI Backend (Port 5000)
echo ======================================================
set PATH=%USERPROFILE%\.gemini\antigravity\scratch\bin\nodejs;%PATH%
cd /d "%~dp0backend"
node server.js
pause
