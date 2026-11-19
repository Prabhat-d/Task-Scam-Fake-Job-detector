@echo off
echo ======================================================
echo   Starting CyberShield AI Backend (Port 5000)
echo ======================================================
set PATH=%USERPROFILE%\.gemini\antigravity\scratch\bin\nodejs;%PATH%
cd /d "%~dp0backend"

:: Automatically free port 5000 if an older process is still listening
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Freeing occupied port 5000 (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

node server.js
pause
