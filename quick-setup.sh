#!/bin/bash

# NFL Analytics Dashboard - Quick Setup Script
# Use this if you just want to enable the site after npm install

echo "🚀 Quick Setup: Enabling NFL Analytics Dashboard..."

# Check if we have the required files
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run from project root directory."
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it from .env.example first."
    exit 1
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2 tsx
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Update .env for production
echo "⚙️ Configuring for production..."
cp .env .env.backup
sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env

# Start with PM2
echo "🚀 Starting application..."
pm2 delete nfl-dashboard 2>/dev/null || true
pm2 start server/index.ts --name "nfl-dashboard" --interpreter tsx

# Save PM2 config
pm2 save

# Configure Nginx (simple setup)
echo "🌐 Configuring Nginx..."
sudo apt install nginx -y

# Create simple Nginx config
sudo tee /etc/nginx/sites-available/nfl-dashboard > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/nfl-dashboard
sudo ln -s /etc/nginx/sites-available/nfl-dashboard /etc/nginx/sites-enabled/

# Test and restart Nginx
if sudo nginx -t; then
    sudo systemctl restart nginx
    echo "✅ Nginx configured successfully"
else
    echo "❌ Nginx configuration failed"
    exit 1
fi

# Allow HTTP traffic
sudo ufw allow 80 2>/dev/null || true

echo ""
echo "✅ Setup Complete!"
echo "🌐 Your app should be accessible at:"
echo "   http://localhost"
echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
echo "📊 Management:"
echo "   pm2 status          - Check app status"
echo "   pm2 logs nfl-dashboard - View logs"
echo "   pm2 restart nfl-dashboard - Restart app"
echo ""