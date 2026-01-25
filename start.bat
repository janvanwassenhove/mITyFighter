@echo off
title mITyFighter

echo ========================================
echo         mITyFighter Game Launcher
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed. Make sure Node.js is installed.
        pause
        exit /b 1
    )
    echo.
)

echo Starting development server...
echo.
echo Game will open at: http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.

npm run dev
