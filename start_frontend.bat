@echo off
echo ======================================================
echo   Starting CyberShield / TrustMatrix Frontend
echo ======================================================
set PATH=%USERPROFILE%\.gemini\antigravity\scratch\bin\nodejs;%PATH%
cd /d "%~dp0Frontend"

:: Free port 5173 if an older Vite instance is still listening
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Freeing occupied port 5173 (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

npm run dev
pause
