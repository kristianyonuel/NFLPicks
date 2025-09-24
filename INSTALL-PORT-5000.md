# 🏈 NFL Analytics Dashboard - Quick Install (Port 5000)

One-command installation for Ubuntu servers.

## ⚡ Quick Install

```bash
# 1. Clone repository
git clone https://github.com/kristianyonuel/nfltest.git
cd nfltest

# 2. Set up your API key
cp .env.example .env
nano .env  # Add your OpenAI API key

# 3. Run installation script
chmod +x install-port-5000.sh
./install-port-5000.sh
```

## 🔑 Required: OpenAI API Key

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys) and add it to `.env`:

```properties
OPENAI_API_KEY=sk-proj-your-actual-key-here
NODE_ENV=production
PORT=5000
```

## 🌐 Access

After installation, access your dashboard at:
- **http://your-server-ip:5000**

## 📊 Features

- ✅ Real-time NFL game data and statistics
- ✅ AI-powered game predictions with confidence scores
- ✅ Professional betting odds and recommendations
- ✅ Expert analysis from 6 sports analysis sources
- ✅ Advanced search and filtering capabilities
- ✅ Responsive design for all devices
- ✅ Robust fallback systems for API reliability

## 🔧 Management

```bash
# Check status
pm2 status

# View logs
pm2 logs nfl-dashboard

# Restart application
pm2 restart nfl-dashboard

# Update application
git pull origin main
npm run build
pm2 restart nfl-dashboard
```

## 🎯 What the Install Script Does

1. Installs Node.js 20 LTS
2. Installs PM2 process manager
3. Configures environment for production
4. Builds the application
5. Starts the app on port 5000
6. Configures firewall
7. Sets up auto-start on boot

## 📝 Requirements

- Ubuntu 18.04+ 
- sudo access
- OpenAI API key
- Internet connection

## 🎉 First Use

1. Open **http://your-server-ip:5000**
2. Click **"Refresh Data"** to load current NFL week
3. Explore games, predictions, and expert analysis
4. Use search and filters to find specific matchups

Enjoy your NFL Analytics Dashboard! 🏈