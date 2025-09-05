# Troubleshooting: metadata-generation-failed Error

This guide helps resolve the "metadata-generation-failed" error commonly encountered when installing Python packages on remote servers.

## 🚨 Quick Fix Commands

### Option 1: Use the Robust Installer (Recommended)
```bash
# Download and run the robust installer
chmod +x install_server.sh
./install_server.sh

# Or use the Python version
python install_server.py
```

### Option 2: Manual Fix Commands

#### Update System Dependencies (Linux)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3-dev python3-pip build-essential gcc g++ make libssl-dev libffi-dev

# CentOS/RHEL/Fedora
sudo yum update -y
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3-devel python3-pip gcc gcc-c++ make openssl-devel libffi-devel
```

#### Fix pip and use binary packages
```bash
# Activate your virtual environment first
source nflpicks_env/bin/activate  # Linux/macOS
# or
nflpicks_env\Scripts\activate     # Windows

# Upgrade pip and tools
pip install --upgrade pip setuptools wheel

# Install with binary preference (no compilation)
pip install -r requirements.txt --prefer-binary --no-cache-dir

# If that fails, try server-optimized requirements
pip install -r requirements_server.txt --prefer-binary --no-cache-dir
```

## 🔍 What Causes metadata-generation-failed?

1. **Missing Build Tools**: Server lacks GCC, make, or development headers
2. **Outdated pip**: Old pip versions have trouble with newer package formats
3. **Source-only Packages**: Package has no precompiled wheel for your platform
4. **Memory Issues**: Server runs out of memory during compilation
5. **Network Issues**: Download interrupted or corrupted

## 🛠️ Step-by-Step Resolution

### Step 1: Install System Build Tools

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y \
    python3-dev \
    python3-pip \
    python3-venv \
    build-essential \
    gcc \
    g++ \
    make \
    libc6-dev \
    libssl-dev \
    libffi-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev
```

**CentOS/RHEL:**
```bash
sudo yum update -y
sudo yum groupinstall -y "Development Tools"
sudo yum install -y \
    python3-devel \
    python3-pip \
    gcc \
    gcc-c++ \
    make \
    openssl-devel \
    libffi-devel \
    libxml2-devel \
    libxslt-devel \
    zlib-devel
```

**Fedora:**
```bash
sudo dnf update -y
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y \
    python3-devel \
    python3-pip \
    gcc \
    gcc-c++ \
    make \
    openssl-devel \
    libffi-devel \
    libxml2-devel \
    libxslt-devel \
    zlib-devel
```

### Step 2: Create Clean Virtual Environment

```bash
# Remove old environment
rm -rf nflpicks_env

# Create new environment
python3 -m venv nflpicks_env
source nflpicks_env/bin/activate

# Upgrade core tools
pip install --upgrade pip setuptools wheel
```

### Step 3: Install Packages Strategically

```bash
# Method 1: Use precompiled wheels only
pip install --only-binary=all -r requirements.txt

# Method 2: If that fails, prefer binary but allow source as fallback
pip install --prefer-binary --no-cache-dir -r requirements.txt

# Method 3: Use server-optimized requirements
pip install --prefer-binary --no-cache-dir -r requirements_server.txt

# Method 4: Install individually (for troublesome packages)
pip install Flask requests beautifulsoup4 SQLAlchemy Flask-SQLAlchemy
pip install numpy --prefer-binary --no-cache-dir
pip install pandas --prefer-binary --no-cache-dir
pip install scikit-learn --prefer-binary --no-cache-dir
```

### Step 4: Handle Specific Problem Packages

#### NumPy Issues
```bash
# Try different numpy versions
pip install "numpy>=1.21.0,<1.25.0" --prefer-binary --no-cache-dir
# or
pip install numpy==1.24.4 --prefer-binary --no-cache-dir
```

#### Pandas Issues
```bash
# Try compatible pandas version
pip install "pandas>=1.5.0,<2.1.0" --prefer-binary --no-cache-dir
```

#### Scikit-learn Issues
```bash
# Install with specific version
pip install "scikit-learn>=1.0.0,<1.4.0" --prefer-binary --no-cache-dir
```

#### NLTK Issues (if using)
```bash
# Skip NLTK if causing issues, use alternative
pip install textblob vaderSentiment
```

### Step 5: Minimal Installation (If All Else Fails)

```bash
# Install only essential packages
pip install Flask requests SQLAlchemy Flask-SQLAlchemy beautifulsoup4 python-dotenv vaderSentiment

# Test if app runs
python app.py --host 0.0.0.0 --port 5000
```

## 🔧 Alternative Solutions

### Use Conda Instead of pip
```bash
# Install miniconda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh

# Create conda environment
conda create -n nflpicks python=3.9
conda activate nflpicks

# Install packages via conda (has more precompiled packages)
conda install flask requests pandas numpy scikit-learn beautifulsoup4
pip install Flask-SQLAlchemy python-dotenv vaderSentiment
```

### Use Docker
```bash
# Create Dockerfile with pre-built environment
# See docker deployment section in main guide
```

### Use Different Python Version
```bash
# Sometimes different Python versions have better wheel support
# Try Python 3.9 or 3.10 instead of 3.11+
sudo apt install python3.9 python3.9-venv python3.9-dev
python3.9 -m venv nflpicks_env
```

## 📊 Verify Installation

```bash
# Test core imports
python -c "import flask, requests, sqlalchemy; print('✅ Core packages OK')"

# Test app
python -c "import app; print('✅ App imports OK')"

# Start application
python app.py --host 0.0.0.0 --port 5000
```

## 🆘 If Nothing Works

### Create Issue Report
If all methods fail, create an issue with this information:

```bash
# Gather system info
uname -a
python --version
pip --version
gcc --version
cat /etc/os-release

# Show exact error
pip install -r requirements.txt --verbose

# Show available space
df -h
free -h
```

### Use Cloud Services
Consider using cloud platforms with pre-configured environments:
- **Heroku**: Has Python buildpacks with common packages
- **Railway**: Simple deployment with automatic dependency handling
- **Render**: Free tier with Python support
- **PythonAnywhere**: Pre-installed scientific packages

## 📞 Quick Help Commands

```bash
# Check what's installed
pip list

# Check package dependencies
pip show package_name

# Force reinstall specific package
pip install --force-reinstall --no-cache-dir package_name

# Install without dependencies (if dependency conflict)
pip install --no-deps package_name

# Check pip configuration
pip config list

# Clear pip cache
pip cache purge
```

---

**Remember**: The robust installer scripts (`install_server.sh` and `install_server.py`) handle most of these issues automatically. Try them first before manual troubleshooting!
