# NFLPicks Complete Setup and Deployment Guide

This guide provides multiple methods to set up and run the NFLPicks application on any system, with full virtual environment isolation and automated dependency management.

## 🚀 Quick Start (Recommended)

### Method 1: Cross-Platform Python Script (Recommended)
```bash
# Download/clone the repository
git clone https://github.com/kristianyonuel/NFLPicks.git
cd NFLPicks

# Run the setup script (works on Windows, Linux, macOS)
python setup_and_run.py

# Or with custom settings
python setup_and_run.py --port 8080 --host 127.0.0.1
```

### Method 2: Linux/macOS Bash Script
```bash
# Make script executable
chmod +x setup_and_run.sh

# Run the setup
./setup_and_run.sh

# Or with custom settings
./setup_and_run.sh 8080 127.0.0.1
```

### Method 3: Windows Batch Script
```cmd
# Run the setup
setup_and_run.bat

# Or with custom settings
setup_and_run.bat 8080 127.0.0.1
```

## 📋 What the Setup Scripts Do

All setup scripts perform the following automated tasks:

1. **System Check**: Verify Python 3.8+ and required tools are installed
2. **Port Check**: Ensure the target port is available
3. **Virtual Environment**: Create isolated Python environment (`nflpicks_env/`)
4. **Dependencies**: Install all required packages from `requirements.txt`
5. **Database**: Initialize SQLite database with sample data
6. **Validation**: Test imports and environment integrity
7. **Launch**: Start the Flask application

## 🛠️ Manual Setup (If Automated Scripts Fail)

### Prerequisites
- Python 3.8 or higher
- pip package manager
- Internet connection for package downloads

### Step-by-Step Manual Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/kristianyonuel/NFLPicks.git
   cd NFLPicks
   ```

2. **Create Virtual Environment**
   ```bash
   # Linux/macOS
   python3 -m venv nflpicks_env
   source nflpicks_env/bin/activate
   
   # Windows
   python -m venv nflpicks_env
   nflpicks_env\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Initialize Database**
   ```bash
   python recreate_db.py
   ```

5. **Run Application**
   ```bash
   python app.py --host 0.0.0.0 --port 5000
   ```

## 🌐 Remote Server Deployment

### For Linux Servers (Ubuntu/CentOS/etc.)

1. **System Updates**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   sudo apt install python3 python3-pip python3-venv git -y
   
   # CentOS/RHEL
   sudo yum update -y
   sudo yum install python3 python3-pip git -y
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/kristianyonuel/NFLPicks.git
   cd NFLPicks
   
   # Run setup script
   chmod +x setup_and_run.sh
   ./setup_and_run.sh 5000 0.0.0.0
   ```

### For Windows Servers

1. **Install Python**
   - Download from https://python.org/downloads/
   - Check "Add Python to PATH" during installation

2. **Deploy Application**
   ```cmd
   git clone https://github.com/kristianyonuel/NFLPicks.git
   cd NFLPicks
   setup_and_run.bat 5000 0.0.0.0
   ```

## 🔧 Configuration Options

### Command Line Arguments
```bash
python setup_and_run.py --help
# or
python app.py --help
```

**Available Options:**
- `--port PORT`: Port number (default: 5000)
- `--host HOST`: Host address (default: 0.0.0.0)
- `--debug`: Enable debug mode (development only)

### Environment Variables
You can also set these environment variables:
```bash
export FLASK_APP=app.py
export FLASK_ENV=production  # or development
export FLASK_DEBUG=false     # or true for development
```

### API Keys Configuration
Edit `config.py` to set your API keys:
```python
BALLDONTLIE_API_KEY = 'your_api_key_here'
```

## 🌟 Features Included

### Core Features
- NFL game predictions using ESPN API
- Reddit sentiment analysis
- Historical game data
- Interactive dashboard
- Real-time data updates

### API Integrations
- **ESPN API**: Live NFL game data
- **Reddit API**: Public sentiment analysis (no authentication required)
- **BallDontLie API**: Additional sports statistics

### Background Processing
- Automated Reddit sentiment analysis
- Data caching for improved performance
- Scheduled data updates

## 📊 Available Endpoints

Once running, the application provides:

- **Main Dashboard**: `http://localhost:5000/`
- **API Status**: `http://localhost:5000/api/status`
- **Reddit Analysis**: `http://localhost:5000/api/reddit/analysis`
- **Predictions**: `http://localhost:5000/api/predictions`
- **Games Data**: `http://localhost:5000/api/games`

## 🔒 Security and Production

### Production Deployment Checklist
- [ ] Set `FLASK_ENV=production`
- [ ] Set `FLASK_DEBUG=false`
- [ ] Use a reverse proxy (nginx/Apache)
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Use a process manager (systemd/supervisor)
- [ ] Configure backup for database
- [ ] Monitor logs and performance

### Firewall Configuration
```bash
# Ubuntu/Debian
sudo ufw allow 5000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   netstat -tulpn | grep :5000
   # or
   lsof -i :5000
   
   # Kill process or use different port
   python setup_and_run.py --port 8080
   ```

2. **Python Module Not Found**
   ```bash
   # Ensure virtual environment is activated
   source nflpicks_env/bin/activate  # Linux/macOS
   nflpicks_env\Scripts\activate     # Windows
   
   # Reinstall packages
   pip install -r requirements.txt
   ```

3. **Database Issues**
   ```bash
   # Recreate database
   python recreate_db.py
   ```

4. **Permission Denied**
   ```bash
   # Linux/macOS
   chmod +x setup_and_run.sh
   
   # Or run with sudo if needed
   sudo ./setup_and_run.sh
   ```

### Log Files
- Application logs: Check terminal output
- Error logs: Flask will display errors in debug mode
- System logs: `/var/log/` (Linux) or Event Viewer (Windows)

## 📞 Support

If you encounter issues:

1. Check this troubleshooting section
2. Verify all prerequisites are installed
3. Ensure you're in the correct directory
4. Check that all required files are present
5. Try the manual setup method

## 🔄 Updates

To update the application:
```bash
cd NFLPicks
git pull origin main
pip install -r requirements.txt
python recreate_db.py  # If database schema changed
```

## 📝 Development

For development mode:
```bash
python app.py --debug --host 127.0.0.1 --port 5000
```

This enables:
- Auto-reload on file changes
- Detailed error messages
- Debug toolbar
- Local-only access (127.0.0.1)

---

**Note**: This application is designed for educational and demonstration purposes. For production use, implement additional security measures and monitoring.
