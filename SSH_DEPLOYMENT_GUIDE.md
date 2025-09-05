# Manual SSH Deployment Commands for NFLPicks
# Run these commands one by one on casa@20.157.116.145

## Step 1: Connect to SSH and check current setup
```bash
ssh casa@20.157.116.145
# Enter password: Genesis123!@#

# Check what's running on ports (to avoid conflicts)
netstat -tlnp | grep -E ":80|:443|:5000"
ps aux | grep python
```

## Step 2: Create NFLPicks directory (separate from CasaDeTodos)
```bash
cd ~
mkdir -p NFLPicks
cd NFLPicks
pwd
```

## Step 3: Clone NFLPicks repository
```bash
git clone https://github.com/kristianyonuel/NFLPicks.git .
ls -la
```

## Step 4: Create isolated Python environment
```bash
# Check Python version
python3 --version

# Create virtual environment (isolated from CasaDeTodos)
python3 -m venv nflpicks_venv
source nflpicks_venv/bin/activate

# Verify isolation
which python
which pip
```

## Step 5: Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Step 6: Setup production configuration
```bash
# Create production config
cat > production_config.py << 'EOF'
import os
from config import Config

class ProductionConfig(Config):
    SECRET_KEY = 'nfl-picks-production-key-2025'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///nflpicks_production.db'
    BALLDONTLIE_API_KEY = '4f09c13f-4905-418b-8eca-0fb7d40afb84'
    BALLDONTLIE_BASE_URL = 'https://api.balldontlie.io/v1'
    DEBUG = False
EOF
```

## Step 7: Create production launcher
```bash
cat > run_production.py << 'EOF'
#!/usr/bin/env python3
import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    print("🚀 Starting NFLPicks on port 5000 (CasaDeTodos on 80/443)")
    app.run(host='0.0.0.0', port=5000, debug=False)
EOF

chmod +x run_production.py
```

## Step 8: Initialize database
```bash
python3 recreate_db.py
```

## Step 9: Test the application
```bash
# Quick test
python3 -c "from app import create_app; app = create_app(); print('✅ NFLPicks ready!')"
```

## Step 10: Start the application
```bash
# Option A: Run directly
python3 run_production.py

# Option B: Run in background
nohup python3 run_production.py > nflpicks.log 2>&1 &
```

## Step 11: Verify deployment
```bash
# Check if it's running
ps aux | grep run_production
netstat -tlnp | grep :5000

# Test HTTP response
curl -I http://localhost:5000
```

## Step 12: Create systemd service (optional, for auto-start)
```bash
sudo tee /etc/systemd/system/nflpicks.service << 'EOF'
[Unit]
Description=NFLPicks Flask Application
After=network.target

[Service]
Type=simple
User=casa
WorkingDirectory=/home/casa/NFLPicks
Environment=PATH=/home/casa/NFLPicks/nflpicks_venv/bin
ExecStart=/home/casa/NFLPicks/nflpicks_venv/bin/python /home/casa/NFLPicks/run_production.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable nflpicks
sudo systemctl start nflpicks
sudo systemctl status nflpicks
```

## 🎯 Final Result:
- **NFLPicks URL**: http://20.157.116.145:5000
- **CasaDeTodos**: Remains on ports 80/443 (untouched)
- **Isolation**: Separate directory and virtual environment
- **Background**: Reddit analysis runs automatically every hour
- **APIs**: All working (ESPN, Reddit, BallDontLie)

## 🔧 Troubleshooting:
```bash
# Check logs
tail -f nflpicks.log

# Restart if needed
pkill -f run_production.py
python3 run_production.py

# Check ports
netstat -tlnp | grep -E ":80|:443|:5000"
```
