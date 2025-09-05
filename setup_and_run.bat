@echo off
REM NFLPicks Remote Server Setup and Run Script (Windows)
REM This script sets up the complete environment and runs the application
REM Usage: setup_and_run.bat [port] [host]
REM Example: setup_and_run.bat 5000 0.0.0.0

setlocal EnableDelayedExpansion

REM Configuration
set DEFAULT_PORT=5000
set DEFAULT_HOST=0.0.0.0
set APP_NAME=NFLPicks
set VENV_NAME=nflpicks_env
set PYTHON_CMD=python

REM Parse command line arguments
if "%1"=="" (
    set PORT=%DEFAULT_PORT%
) else (
    set PORT=%1
)

if "%2"=="" (
    set HOST=%DEFAULT_HOST%
) else (
    set HOST=%2
)

echo ==========================================
echo 🏈 NFLPicks Remote Server Setup ^& Run
echo ==========================================
echo Port: %PORT%
echo Host: %HOST%
echo Python: %PYTHON_CMD%
echo Virtual Environment: %VENV_NAME%
echo ==========================================

REM Function to check if command exists
where %PYTHON_CMD% >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found!
    echo Please install Python 3.8+ first from: https://www.python.org/downloads/
    echo Make sure to add Python to your PATH during installation
    exit /b 1
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo ✅ Found Python %PYTHON_VER%

REM Check for pip
where pip >nul 2>&1
if errorlevel 1 (
    echo ❌ pip not found!
    echo Please ensure pip is installed with Python
    exit /b 1
)

echo 🔧 Setting up virtual environment...

REM Remove existing venv if it exists
if exist "%VENV_NAME%" (
    echo 🗑️  Removing existing virtual environment...
    rmdir /s /q "%VENV_NAME%"
)

REM Create new virtual environment
echo 🏗️  Creating virtual environment: %VENV_NAME%
python -m venv "%VENV_NAME%"

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call "%VENV_NAME%\Scripts\activate.bat"

REM Upgrade pip
echo ⬆️  Upgrading pip...
python -m pip install --upgrade pip

echo ✅ Virtual environment ready

echo 📦 Installing Python packages...

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo ❌ requirements.txt not found!
    echo Please ensure you're in the correct directory with requirements.txt
    exit /b 1
)

REM Install packages
echo 📥 Installing packages from requirements.txt...
pip install -r requirements.txt

echo ✅ All packages installed

echo 🗄️  Setting up database...

REM Check if recreate_db.py exists
if exist "recreate_db.py" (
    echo 🔄 Running database recreation script...
    python recreate_db.py
) else (
    echo ⚠️  recreate_db.py not found, skipping database setup
    echo You may need to manually initialize the database
)

echo ✅ Database setup complete

echo 🔍 Validating environment...

REM Check if main app file exists
if not exist "app.py" (
    echo ❌ app.py not found!
    echo Please ensure you're in the correct directory
    exit /b 1
)

REM Test import of main modules
echo 🧪 Testing Python imports...
python -c "import flask; print('✅ Flask import successful')"
if errorlevel 1 (
    echo ❌ Flask import failed
    exit /b 1
)

python -c "import app; print('✅ App import successful')"
if errorlevel 1 (
    echo ❌ App import failed - check your code for syntax errors
    exit /b 1
)

echo ✅ Environment validation complete

echo 🚀 Starting NFLPicks application...
echo 📍 URL: http://%HOST%:%PORT%
echo 🛑 Press Ctrl+C to stop the application
echo ==========================================

REM Set environment variables
set FLASK_APP=app.py
set FLASK_ENV=production
set FLASK_DEBUG=false

REM Start the application
python app.py --host=%HOST% --port=%PORT%

REM Cleanup on exit
echo.
echo 🧹 Cleaning up...
if defined VIRTUAL_ENV (
    call deactivate
)
echo 👋 Goodbye!

endlocal
