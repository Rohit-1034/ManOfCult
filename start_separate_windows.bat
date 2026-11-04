@echo off
setlocal
title CineMatch AI - Multi-Window Launcher

cd /d "%~dp0"

echo.
echo ===================================================================
echo   🎬 CINEMATCH AI - MULTI-WINDOW LAUNCHER
echo ===================================================================
echo.
echo Launching services in dedicated terminal windows...
echo.

echo Starting Python FastAPI ML Service (Port 8000)...
start "CineMatch ML Service (Port 8000)" cmd /k "cd /d "%~dp0" && python -m uvicorn main:app --app-dir ml-service --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting Node.js Backend API (Port 5000)...
start "CineMatch Node Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting React Vite Frontend (Port 5173)...
start "CineMatch Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo Opening browser to http://localhost:5173 ...
start "" http://localhost:5173

echo.
echo [✓] All 3 services have been launched in separate windows!
echo You may close this window.
timeout /t 5 >nul
exit /b 0
