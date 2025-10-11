@echo off
REM Cosmos Predictions - Quick Start Script (Windows)
REM Run: setup.bat

echo.
echo 🌌 Cosmos Predictions - Quick Setup
echo ====================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Install from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Clean install
echo 📦 Installing dependencies...
echo.

REM Remove old files
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .next rmdir /s /q .next

REM Install dependencies
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ npm install failed!
    echo.
    echo Try manually:
    echo   npm install
    echo   npm install --legacy-peer-deps
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed!
echo.

REM Check .env.local
if not exist .env.local (
    echo ⚠️  .env.local not found!
    echo.
    echo Creating from example...
    copy .env.local.example .env.local
    echo.
    echo ⚠️  IMPORTANT: Edit .env.local and add your API key:
    echo    ANTHROPIC_API_KEY=sk-ant-your-key-here
    echo.
    pause
)

echo.
echo ✅ Environment configured!
echo.

REM Start server
echo 🚀 Starting development server...
echo.
echo    Visit: http://localhost:3000
echo.
echo    Press Ctrl+C to stop
echo.

call npm run dev
