@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo Stable Diffusion Prompt Builder - Launcher Script
echo ======================================================
echo.

REM Check if Node.js is installed
echo Checking: Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is NOT installed! Please install Node.js from: https://nodejs.org/
    echo The application cannot start without Node.js.
    pause
    exit /b 1
)

set NODE_VERSION=
for /f "tokens=1,2,3 delims=." %%a in ('node -v') do (
    set NODE_VERSION_MAJOR=%%a
    set NODE_VERSION_MAJOR=!NODE_VERSION_MAJOR:~1!
)

echo Node.js version: !NODE_VERSION_MAJOR! (v%NODE_VERSION%)
if !NODE_VERSION_MAJOR! LSS 14 (
    echo WARNING: This application requires Node.js v14 or newer!
    echo Please update Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
echo Checking: npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is NOT installed! npm should have been installed with Node.js.
    echo Please reinstall Node.js.
    pause
    exit /b 1
)

REM Check if we're in the project directory (package.json)
echo Checking: project files...
if not exist package.json (
    echo ERROR: package.json file not found!
    echo Please make sure the script is running in the project root directory.
    pause
    exit /b 1
)

REM Check if Ollama is installed
echo Checking: Ollama...
where ollama >nul 2>nul
set OLLAMA_INSTALLED=%ERRORLEVEL%

if %OLLAMA_INSTALLED% NEQ 0 (
    echo Ollama is NOT installed!
    echo WARNING: Ollama is required for the full functionality of this application.
    echo Please install Ollama from: https://ollama.ai/download
    echo.
    echo The application will work without Ollama, but AI features will be unavailable.
    echo.
)

REM Check if dependencies are installed (node_modules directory)
echo Checking: dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Dependency installation failed!
        pause
        exit /b 1
    )
    echo Dependencies successfully installed!
) else (
    echo Dependencies are already installed.
)

REM Check if Ollama models are installed (only if Ollama is installed)
if %OLLAMA_INSTALLED% EQU 0 (
    echo Checking: Ollama models...
    
    REM Check if Ollama is running
    tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
    if %ERRORLEVEL% NEQ 0 (
        echo Ollama is not running. Starting Ollama server...
        start /B ollama serve
        echo Waiting 5 seconds for Ollama to start...
        timeout /T 5 /NOBREAK >nul
    ) else (
        echo Ollama is already running.
    )
    
    REM Check models
    echo Checking: installed models...
    for /f "tokens=1" %%m in ('ollama list 2^>^&1 ^| find "llama2"') do (
        set LLAMA_INSTALLED=1
    )
    
    if not defined LLAMA_INSTALLED (
        echo Installing base llama2 model (this may take a few minutes)...
        ollama pull llama2
    ) else (
        echo Llama2 model is already installed.
    )
    
    REM Check for llava multi-modal model
    for /f "tokens=1" %%m in ('ollama list 2^>^&1 ^| find "llava"') do (
        set LLAVA_INSTALLED=1
    )
    
    if not defined LLAVA_INSTALLED (
        echo WARNING: Llava model is NOT installed!
        echo The llava model is needed for image analysis features.
        echo If you want to use image recognition features, install it manually:
        echo     ollama pull llava
        echo.
    ) else (
        echo Llava model is already installed.
    )
) else (
    echo Ollama not found, skipping model checks.
)

REM Start the server if it's not already running
echo Checking: server running status...
netstat -ano | find "LISTENING" | find ":3001" > nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting server in the background...
    start /B cmd /c "node server.js"
    echo Waiting 3 seconds for the server to start...
    timeout /T 3 /NOBREAK >nul
) else (
    echo Server is already running on port 3001.
)

REM Start the frontend dev server if it's not already running
echo Checking: frontend development server running status...
netstat -ano | find "LISTENING" | find ":5173" > nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting frontend development server in the background...
    start /B cmd /c "npm run dev"
    echo Waiting 5 seconds for the development server to start...
    timeout /T 5 /NOBREAK >nul
) else (
    echo Development server is already running on port 5173.
)

REM Open the website in the browser
echo Opening website in browser...
start http://localhost:5173

echo.
echo ======================================================
echo Stable Diffusion Prompt Builder successfully launched!
echo To stop the application, close this window.
echo ======================================================
echo.

REM Keep the script running, so the servers keep running too
echo The server is running. To close it, press Ctrl+C...
echo.
echo If you want to restart the application, close this window,
echo then run the start.bat file again.

REM Infinite loop to keep the console window open
:loop
timeout /T 60 /NOBREAK > nul
goto loop