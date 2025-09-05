# NFLPicks Setup Scripts Summary

This document summarizes all the automated setup scripts created for easy deployment of the NFLPicks application.

## 🚀 Available Setup Methods

### 1. Universal Launcher (Recommended)
**File**: `launch.py`
**Usage**: `python launch.py [port] [host]`
**Description**: Automatically detects your platform and uses the best setup method. Falls back to manual instructions if automated methods fail.

**Advantages**:
- Cross-platform compatibility
- Automatic platform detection
- Fallback to manual instructions
- Simple one-command setup

### 2. Cross-Platform Python Script
**File**: `setup_and_run.py`
**Usage**: `python setup_and_run.py --port 5000 --host 0.0.0.0`
**Description**: Comprehensive Python-based setup script that works on Windows, Linux, and macOS.

**Features**:
- Full system dependency checking
- Virtual environment creation and management
- Package installation with error handling
- Database initialization
- Environment validation
- Application startup

### 3. Unix Shell Script (Linux/macOS)
**File**: `setup_and_run.sh`
**Usage**: `./setup_and_run.sh [port] [host]`
**Description**: Bash script optimized for Unix-like systems.

**Features**:
- Native bash implementation
- System package checking
- Port availability verification
- Cleanup on exit
- Error handling and validation

### 4. Windows Batch Script
**File**: `setup_and_run.bat`
**Usage**: `setup_and_run.bat [port] [host]`
**Description**: Windows Command Prompt batch script.

**Features**:
- Windows-native implementation
- Python environment validation
- Virtual environment setup
- Package installation
- Database initialization

## 📁 Setup Script Features Comparison

| Feature | launch.py | setup_and_run.py | setup_and_run.sh | setup_and_run.bat |
|---------|-----------|-------------------|-------------------|-------------------|
| Platform Detection | ✅ | ✅ | ❌ (Unix only) | ❌ (Windows only) |
| Dependency Checking | ✅ | ✅ | ✅ | ✅ |
| Virtual Environment | ✅ | ✅ | ✅ | ✅ |
| Package Installation | ✅ | ✅ | ✅ | ✅ |
| Database Setup | ✅ | ✅ | ✅ | ✅ |
| Port Checking | ✅ | ✅ | ✅ | ❌ |
| Error Handling | ✅ | ✅ | ✅ | ✅ |
| Fallback Options | ✅ | ❌ | ❌ | ❌ |

## 🛠️ What Each Script Does

### Common Operations (All Scripts)
1. **System Check**: Verify Python 3.8+ is installed
2. **Virtual Environment**: Create isolated `nflpicks_env/` directory
3. **Dependencies**: Install all packages from `requirements.txt`
4. **Database**: Run `recreate_db.py` to initialize SQLite database
5. **Validation**: Test imports and environment integrity
6. **Launch**: Start Flask application with specified host/port

### Additional Features

#### launch.py
- Detects operating system
- Tries multiple setup methods in order of preference
- Provides manual setup instructions if all automated methods fail

#### setup_and_run.py
- Comprehensive error messages with platform-specific instructions
- Socket-based port availability checking
- Detailed system information display
- Command-line argument parsing with help

#### setup_and_run.sh
- Native Unix process management
- Signal handling for clean shutdown
- Netstat/ss port checking
- Executable permission handling

#### setup_and_run.bat
- Windows-specific path handling
- Environment variable management
- Windows command-line interface integration

## 🚀 Quick Start Guide

### For Any Platform
```bash
git clone https://github.com/kristianyonuel/NFLPicks.git
cd NFLPicks
python launch.py
```

### For Specific Platforms

#### Linux/macOS
```bash
chmod +x setup_and_run.sh
./setup_and_run.sh
```

#### Windows
```cmd
setup_and_run.bat
```

#### Cross-Platform Python
```bash
python setup_and_run.py --port 8080 --host 0.0.0.0
```

## 📦 Requirements

All scripts automatically handle these requirements:
- Python 3.8 or higher
- pip package manager
- Virtual environment support (venv module)
- Internet connection for package downloads

## 🔧 Customization

### Command Line Arguments
Most scripts support these arguments:
- **Port**: `--port 8080` or as first argument
- **Host**: `--host 127.0.0.1` or as second argument
- **Help**: `--help` for usage information

### Environment Variables
Scripts set these Flask environment variables:
```bash
FLASK_APP=app.py
FLASK_ENV=production
FLASK_DEBUG=false
```

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **Python Not Found**
   - Install Python 3.8+ from python.org
   - Ensure Python is in system PATH

2. **Permission Denied (Linux/macOS)**
   ```bash
   chmod +x setup_and_run.sh
   ```

3. **Port Already in Use**
   ```bash
   python setup_and_run.py --port 8080
   ```

4. **Module Import Errors**
   - Delete `nflpicks_env/` folder and re-run script
   - Check internet connection for package downloads

5. **Virtual Environment Issues**
   - Ensure `python -m venv --help` works
   - Install python3-venv package on Linux

## 📋 Post-Setup Verification

After running any setup script, verify the installation:

1. **Application Running**: Check `http://localhost:5000`
2. **API Endpoints**: Test `/api/status` endpoint
3. **Database**: Verify games and predictions exist
4. **Reddit Analysis**: Check `/api/reddit/analysis` endpoint

## 🔄 Updates and Maintenance

To update the application:
```bash
cd NFLPicks
git pull origin main
# Re-run your preferred setup script
python launch.py
```

## 📞 Support

If setup scripts fail:
1. Check the troubleshooting section above
2. Review error messages for specific issues
3. Try the manual setup in `COMPLETE_SETUP_GUIDE.md`
4. Ensure all prerequisites are installed

---

**Note**: These scripts are designed to be robust and handle most common setup scenarios. They create isolated virtual environments to prevent conflicts with your system Python installation.
