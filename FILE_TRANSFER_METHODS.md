# Methods to Pull Files from Different Server

## 1. 🔄 Git Clone (RECOMMENDED for NFLPicks)
```bash
# On the target server (casa@20.157.116.145)
git clone https://github.com/kristianyonuel/NFLPicks.git
cd NFLPicks

# Or clone to specific directory
git clone https://github.com/kristianyonuel/NFLPicks.git /home/casa/NFLPicks
```

## 2. 📥 Direct Download from GitHub
```bash
# Download as ZIP
wget https://github.com/kristianyonuel/NFLPicks/archive/refs/heads/main.zip
unzip main.zip
mv NFLPicks-main NFLPicks

# Or using curl
curl -L https://github.com/kristianyonuel/NFLPicks/archive/refs/heads/main.zip -o nflpicks.zip
unzip nflpicks.zip
```

## 3. 📂 SCP (Secure Copy) - From your local machine
```bash
# Copy entire project folder to server
scp -r C:\Users\cjuarbe\source\repos\Solution1\ casa@20.157.116.145:~/NFLPicks/

# Copy specific files
scp C:\Users\cjuarbe\source\repos\Solution1\app.py casa@20.157.116.145:~/NFLPicks/
scp C:\Users\cjuarbe\source\repos\Solution1\requirements.txt casa@20.157.116.145:~/NFLPicks/
```

## 4. 🔗 SFTP (SSH File Transfer Protocol)
```bash
# Connect via SFTP
sftp casa@20.157.116.145

# SFTP commands
put -r C:\Users\cjuarbe\source\repos\Solution1\* /home/casa/NFLPicks/
quit
```

## 5. 🌐 Direct Download Individual Files
```bash
# Download specific deployment scripts
curl -o deploy_nflpicks.sh https://raw.githubusercontent.com/kristianyonuel/NFLPicks/main/deploy_nflpicks.sh
curl -o validate_server.sh https://raw.githubusercontent.com/kristianyonuel/NFLPicks/main/validate_server.sh
curl -o requirements.txt https://raw.githubusercontent.com/kristianyonuel/NFLPicks/main/requirements.txt
```

## 6. 🐳 rsync (if available)
```bash
# Sync from local to remote
rsync -avz -e ssh C:\Users\cjuarbe\source\repos\Solution1\ casa@20.157.116.145:~/NFLPicks/
```

## 🎯 For Your NFLPicks Deployment - RECOMMENDED APPROACH:

### Step 1: Connect to SSH
```bash
ssh casa@20.157.116.145
# Enter password: Genesis123!@#
```

### Step 2: Create directory and clone
```bash
mkdir -p ~/NFLPicks
cd ~/NFLPicks
git clone https://github.com/kristianyonuel/NFLPicks.git .
```

### Step 3: Verify files
```bash
ls -la
cat README.md
```

## 🚀 Alternative: One-liner deployment
```bash
# This will download and run the deployment script directly
ssh casa@20.157.116.145 "curl -s https://raw.githubusercontent.com/kristianyonuel/NFLPicks/main/deploy_nflpicks.sh | bash"
```

## 🔧 Troubleshooting:

### If git is not available:
```bash
# Install git (Ubuntu/Debian)
sudo apt update && sudo apt install git

# Install git (CentOS/RHEL)
sudo yum install git
```

### If wget/curl not available:
```bash
# Try python download
python3 -c "
import urllib.request
urllib.request.urlretrieve('https://github.com/kristianyonuel/NFLPicks/archive/refs/heads/main.zip', 'nflpicks.zip')
"
```

## 📋 For Your Specific Case:

Since your NFLPicks repository is already on GitHub, the **git clone** method is the best approach:

1. SSH into the server
2. Run: `git clone https://github.com/kristianyonuel/NFLPicks.git`
3. All files will be pulled automatically with proper structure
4. Run the deployment script

This ensures you get the latest version with all the enhancements we just added!
