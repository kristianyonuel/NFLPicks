# 🚀 NFL Analytics Dashboard - Ubuntu Deployment

Quick deployment guide for Ubuntu server.

## 📋 Prerequisites

- Ubuntu 18.04+ server
- sudo access
- Internet connection

## ⚡ Quick Deployment (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/kristianyonuel/nfltest.git
cd nfltest

# 2. Set up environment variables
cp .env.example .env
nano .env  # Add your OpenAI API key

# 3. Run the deployment script
chmod +x deploy.sh
./deploy.sh
```

That's it! Your NFL Analytics Dashboard will be available at `http://your-server-ip`

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# 1. Clone and setup
git clone https://github.com/kristianyonuel/nfltest.git
cd nfltest
cp .env.example .env
nano .env  # Configure your API keys

# 2. Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs npm -y
npm install

# 3. Quick setup
chmod +x quick-setup.sh
./quick-setup.sh
```

## 🔑 Environment Variables

Edit `.env` file with your API keys:

```properties
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=5000
ODDS_API_KEY=your_odds_api_key_here  # Optional
```

## 📊 Management Commands

```bash
# Check application status
pm2 status

# View application logs
pm2 logs nfl-dashboard

# Restart application
pm2 restart nfl-dashboard

# Stop application
pm2 stop nfl-dashboard

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

## 🌐 Access Your Application

After deployment:
- Local: `http://localhost`
- External: `http://your-server-ip`

## 🔄 Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
npm run build
pm2 restart nfl-dashboard
```

## 🛠️ Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs nfl-dashboard

# Check if port 5000 is available
sudo lsof -i :5000
```

### Nginx issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Port issues
```bash
# Check what's using port 80
sudo lsof -i :80

# Allow port through firewall
sudo ufw allow 80
```

## 📝 File Locations

- Application: `/path/to/nfltest/`
- Nginx config: `/etc/nginx/sites-available/nfl-dashboard`
- Environment: `.env`
- Logs: `pm2 logs nfl-dashboard`

## 🔒 Security Notes

- The `.env` file contains sensitive API keys - never commit it to git
- Consider setting up SSL certificates for production use
- Regular security updates are recommended

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs nfl-dashboard`
2. Verify Nginx: `sudo nginx -t`
3. Check firewall: `sudo ufw status`
4. Open an issue on GitHub