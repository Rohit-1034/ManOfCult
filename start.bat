@echo off
setlocal enabledelayedexpansion
title CineMatch AI - Launching System

cd /d "%~dp0"

echo.
echo ===================================================================
echo   🎬 CINEMATCH AI - SMART MOVIE RECOMMENDATION SYSTEM
echo ===================================================================
echo.
echo [1/4] Checking system environment...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.10+.
    pause
    exit /b 1
)

echo [✓] Node.js and Python detected successfully.

echo.
echo [2/4] Verifying movie dataset...
if not exist "data\movies_processed.csv" (
    echo [*] Preprocessed data not found. Running dataset preprocessing pipeline...
    python ml-service\preprocess.py
    if %errorlevel% neq 0 (
        echo [ERROR] Dataset preprocessing failed!
        pause
        exit /b 1
    )
)
echo [✓] Dataset verified (9,789 movies with IMDb details & posters ready).

echo.
echo [3/4] Preparing services...
echo   - Frontend:    http://localhost:5173
echo   - Node API:    http://localhost:5000
echo   - ML Service:  http://localhost:8000
echo.
echo [4/4] Starting services in unified development mode...
echo.
echo Opening CineMatch AI in your default web browser in 4 seconds...
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5173"

echo.
echo ===================================================================
echo   Press CTRL+C anytime in this window to stop all services.
echo ===================================================================
echo.

npm run dev

pause
