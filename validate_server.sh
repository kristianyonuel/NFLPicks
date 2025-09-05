#!/bin/bash
# Quick validation script to run on SSH server

echo "=== NFLPicks Server Validation ==="
echo ""

echo "1. Checking current directory:"
pwd
echo ""

echo "2. Checking available disk space:"
df -h .
echo ""

echo "3. Checking Python version:"
python3 --version
echo ""

echo "4. Checking current running processes on common ports:"
echo "Port 80 (CasaDeTodos HTTP):"
netstat -tlnp | grep :80 || echo "No process on port 80"

echo "Port 443 (CasaDeTodos HTTPS):"
netstat -tlnp | grep :443 || echo "No process on port 443"

echo "Port 5000 (Target for NFLPicks):"
netstat -tlnp | grep :5000 || echo "Port 5000 is available ✅"

echo "Port 8080 (Alternative):"
netstat -tlnp | grep :8080 || echo "Port 8080 is available"
echo ""

echo "5. Checking Git availability:"
git --version
echo ""

echo "6. Checking if NFLPicks directory exists:"
if [ -d "NFLPicks" ]; then
    echo "⚠️  NFLPicks directory already exists"
    ls -la NFLPicks/
else
    echo "✅ NFLPicks directory doesn't exist - ready for clean install"
fi
echo ""

echo "7. Checking Python modules needed:"
python3 -c "import sys; print(f'Python executable: {sys.executable}')"
python3 -c "import venv; print('✅ venv module available')" || echo "❌ venv module not available"
echo ""

echo "8. Memory and CPU info:"
free -h
echo "CPU cores: $(nproc)"
echo ""

echo "=== Validation Complete ==="
echo ""
echo "🚀 Ready to deploy NFLPicks on port 5000!"
echo "📋 CasaDeTodos will remain untouched on ports 80/443"
