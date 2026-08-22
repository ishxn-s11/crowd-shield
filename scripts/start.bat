@echo off
echo ============================================
echo     CROWDSHIELD — Safety Platform
echo     Starting all services...
echo ============================================
echo.

cd /d "%~dp0\.."

echo [1/4] Starting API server on port 8000...
cd services\api
start "CrowdShield API" cmd /c "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..\..

echo [2/4] Waiting for API to start...
timeout /t 5 /nobreak >nul
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo     API server running on http://localhost:8000
) else (
    echo     WARNING: API may not be running yet
)

echo [3/4] Starting Dashboard on port 5173...
cd apps\dashboard
start "CrowdShield Dashboard" cmd /c "npx vite --host 0.0.0.0 --port 5173"
cd ..\..

echo [4/4] Done!
echo.
echo ============================================
echo   CROWDSHIELD IS RUNNING!
echo.
echo   Dashboard:  http://localhost:5173
echo   API:        http://localhost:8000
echo   API Docs:   http://localhost:8000/docs
echo.
echo   Demo: Click a scenario to start!
echo ============================================
echo.
echo Press any key to stop all services...
pause >nul

taskkill /FI "WINDOWTITLE eq CrowdShield API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq CrowdShield Dashboard*" /F >nul 2>&1
echo Services stopped.
