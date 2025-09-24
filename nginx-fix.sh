#!/bin/bash

# Quick fix for Nginx configuration issues

echo "🔧 Quick Fix: Resolving Nginx Configuration Issues..."

# Stop Nginx
sudo systemctl stop nginx

# Backup current config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.broken.backup

# Remove and reinstall Nginx to get clean config
echo "📦 Reinstalling Nginx with clean configuration..."
sudo apt remove --purge nginx nginx-common -y
sudo apt update
sudo apt install nginx -y

# Create simple site configuration
echo "⚙️ Creating simple site configuration..."
sudo tee /etc/nginx/sites-available/nfl-dashboard > /dev/null <<'EOF'
server {
    listen 8080 default_server;
    listen [::]:8080 default_server;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Remove default and enable our site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/nfl-dashboard /etc/nginx/sites-enabled/

# Test configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Start Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Allow port 8080
    sudo ufw allow 8080
    
    echo ""
    echo "✅ Quick Fix Complete!"
    echo "🌐 Your app will be accessible at:"
    echo "   http://localhost:8080"
    echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):8080"
    echo ""
    echo "📝 Note: Using port 8080 to avoid conflict with your Python app on 443"
    echo ""
else
    echo "❌ Nginx configuration still has issues"
    sudo nginx -t
fi