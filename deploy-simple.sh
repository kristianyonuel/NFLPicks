#!/bin/bash

# NFL Analytics Dashboard - No Nginx Deployment
# Direct deployment without Nginx (avoids configuration conflicts)

echo "🚀 NFL Analytics Dashboard - Direct Deployment (No Nginx)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the NFL dashboard project directory"
    exit 1
fi

# Find available port (avoid 443 where Python is running)
APP_PORT=8080
if sudo lsof -i :8080 > /dev/null 2>&1; then
    APP_PORT=3000
    print_warning "Port 8080 in use, trying 3000"
fi

if sudo lsof -i :$APP_PORT > /dev/null 2>&1; then
    APP_PORT=5000
    print_warning "Port 3000 in use, trying 5000"
fi

print_info "Using port $APP_PORT for the application"

# Check .env file
if [ ! -f ".env" ]; then
    print_info "Creating .env file..."
    cp .env.example .env
    echo "📝 Please edit .env file with your OpenAI API key"
    read -p "Press Enter after configuring .env..."
fi

# Install dependencies
print_info "Installing dependencies..."
npm install

# Install global tools
if ! command -v pm2 &> /dev/null; then
    print_info "Installing PM2..."
    sudo npm install -g pm2 tsx
fi

# Update .env for production
print_info "Configuring for production..."
cp .env .env.backup 2>/dev/null || true
sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
sed -i "s/PORT=.*/PORT=$APP_PORT/" .env || echo "PORT=$APP_PORT" >> .env

# Build application
print_info "Building application..."
npm run build

# Stop any existing PM2 process
pm2 delete nfl-dashboard 2>/dev/null || true

# Start with PM2
print_info "Starting application with PM2..."
pm2 start server/index.ts --name "nfl-dashboard" --interpreter tsx

# Save PM2 config
pm2 save

# Configure firewall
print_info "Configuring firewall..."
sudo ufw allow $APP_PORT
sudo ufw allow 22  # SSH

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "🎉 Deployment Complete!"
echo "=================================="
print_status "NFL Analytics Dashboard is running directly (no Nginx)"
echo ""
echo "🌐 Access your application:"
echo "   Local:    http://localhost:$APP_PORT"
echo "   External: http://$SERVER_IP:$APP_PORT"
echo ""
echo "🔧 Management:"
echo "   Status:   pm2 status"
echo "   Logs:     pm2 logs nfl-dashboard"
echo "   Restart:  pm2 restart nfl-dashboard"
echo "   Stop:     pm2 stop nfl-dashboard"
echo ""
echo "📋 Configuration:"
echo "   App Port: $APP_PORT"
echo "   Mode:     Production"
echo "   Process:  PM2 managed"
echo ""
print_warning "Note: Python app is running on port 443 - no conflicts"
print_info "Your NFL dashboard is on port $APP_PORT"
echo ""