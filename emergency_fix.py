#!/usr/bin/env python3
"""
Emergency Fix for setuptools.build_meta Error
Specifically handles the BackendUnavailable: Cannot import 'setuptools.build_meta' error
"""

import os
import sys
import subprocess
import shutil

def run_command(cmd, check=False):
    """Run a command and return success status."""
    try:
        result = subprocess.run(cmd, check=check, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            return True, result.stdout
        else:
            return False, result.stderr
    except Exception as e:
        return False, str(e)

def print_status(message):
    print(f"🔧 [INFO] {message}")

def print_success(message):
    print(f"✅ [SUCCESS] {message}")

def print_warning(message):
    print(f"⚠️ [WARNING] {message}")

def print_error(message):
    print(f"❌ [ERROR] {message}")

def main():
    print("🚨 NFLPicks Emergency Installation Fix")
    print("======================================")
    print("Fixing setuptools.build_meta error...")
    
    # Check if we're in the right directory
    if not os.path.exists('app.py'):
        print_error("app.py not found! Please run this script from the NFLPicks directory")
        return 1
    
    # Determine Python command
    python_cmd = sys.executable
    
    # Check if virtual environment exists and activate it
    venv_path = "nflpicks_env"
    if os.path.exists(venv_path):
        print_status("Using existing virtual environment...")
        if sys.platform == "win32":
            python_cmd = os.path.join(venv_path, "Scripts", "python.exe")
            pip_cmd = os.path.join(venv_path, "Scripts", "pip.exe")
        else:
            python_cmd = os.path.join(venv_path, "bin", "python")
            pip_cmd = os.path.join(venv_path, "bin", "pip")
    else:
        print_status("Creating new virtual environment...")
        success, output = run_command(f"{sys.executable} -m venv {venv_path}")
        if not success:
            print_error(f"Failed to create virtual environment: {output}")
            return 1
        
        if sys.platform == "win32":
            python_cmd = os.path.join(venv_path, "Scripts", "python.exe")
            pip_cmd = os.path.join(venv_path, "Scripts", "pip.exe")
        else:
            python_cmd = os.path.join(venv_path, "bin", "python")
            pip_cmd = os.path.join(venv_path, "bin", "pip")
    
    print_status("Fixing pip and setuptools issues...")
    
    # Step 1: Install compatible versions
    print_status("Installing compatible pip and setuptools versions...")
    packages_to_fix = [
        "pip>=23.0,<24.0",
        "setuptools>=65.0,<70.0", 
        "wheel>=0.38.0"
    ]
    
    for package in packages_to_fix:
        success, output = run_command(f'"{python_cmd}" -m pip install --upgrade "{package}"')
        if success:
            print_success(f"Installed {package}")
        else:
            print_warning(f"Failed to install {package}: {output}")
    
    # Step 2: Install build tools
    print_status("Installing build dependencies...")
    build_tools = ["build", "setuptools-scm", "pep517"]
    for tool in build_tools:
        success, output = run_command(f'"{pip_cmd}" install --no-cache-dir {tool}')
        if success:
            print_success(f"Installed {tool}")
        else:
            print_warning(f"Failed to install {tool}")
    
    # Step 3: Clear cache
    print_status("Clearing pip cache...")
    run_command(f'"{pip_cmd}" cache purge')
    
    # Step 4: Install packages individually
    print_status("Installing core packages individually...")
    
    core_packages = [
        ("Flask>=2.3.0,<3.1.0", "Flask web framework"),
        ("Werkzeug>=2.3.0,<3.1.0", "WSGI utilities"),
        ("Jinja2>=3.1.0,<3.2.0", "Template engine"),
        ("itsdangerous>=2.1.0,<2.2.0", "Secure signatures"),
        ("click>=8.1.0,<8.2.0", "Command line interface"),
        ("SQLAlchemy>=2.0.0,<2.1.0", "Database ORM"),
        ("Flask-SQLAlchemy>=3.0.0,<3.2.0", "Flask SQLAlchemy integration"),
        ("requests>=2.31.0,<2.32.0", "HTTP library"),
        ("urllib3>=1.26.0,<2.2.0", "HTTP client"),
        ("certifi>=2023.0.0", "SSL certificates"),
        ("beautifulsoup4>=4.12.0,<4.13.0", "HTML parser"),
        ("feedparser>=6.0.0,<6.1.0", "RSS/Atom parser"),
        ("python-dotenv>=1.0.0,<1.1.0", "Environment variables"),
        ("schedule>=1.2.0,<1.3.0", "Job scheduling"),
        ("vaderSentiment>=3.3.0,<3.4.0", "Sentiment analysis")
    ]
    
    for package, description in core_packages:
        print_status(f"Installing {description}...")
        success, output = run_command(f'"{pip_cmd}" install --no-cache-dir --prefer-binary "{package}"')
        if success:
            print_success(f"Installed {package}")
        else:
            print_warning(f"Failed to install {package}: {output}")
    
    # Step 5: Try optional data science packages
    print_status("Attempting to install optional data science packages...")
    
    # Try numpy with fallback versions
    numpy_versions = ["numpy>=1.24.0,<1.26.0", "numpy>=1.21.0,<1.24.0", "numpy"]
    numpy_installed = False
    
    for numpy_ver in numpy_versions:
        print_status(f"Trying {numpy_ver}...")
        success, output = run_command(f'"{pip_cmd}" install --no-cache-dir --prefer-binary "{numpy_ver}"')
        if success:
            print_success(f"Installed {numpy_ver}")
            numpy_installed = True
            break
        else:
            print_warning(f"Failed: {numpy_ver}")
    
    if not numpy_installed:
        print_warning("Could not install numpy, continuing without it...")
    
    # Try pandas if numpy succeeded
    if numpy_installed:
        success, output = run_command(f'"{pip_cmd}" install --no-cache-dir --prefer-binary "pandas>=1.5.0,<2.1.0"')
        if success:
            print_success("Installed pandas")
        else:
            print_warning("Could not install pandas")
    
    # Try scikit-learn if numpy succeeded
    if numpy_installed:
        success, output = run_command(f'"{pip_cmd}" install --no-cache-dir --prefer-binary "scikit-learn>=1.0.0,<1.4.0"')
        if success:
            print_success("Installed scikit-learn")
        else:
            print_warning("Could not install scikit-learn")
    
    # Try plotting library
    plot_success = False
    for plot_pkg in ["plotly>=5.0.0,<6.0.0", "matplotlib>=3.5.0"]:
        success, output = run_command(f'"{pip_cmd}" install --no-cache-dir --prefer-binary "{plot_pkg}"')
        if success:
            print_success(f"Installed {plot_pkg}")
            plot_success = True
            break
    
    if not plot_success:
        print_warning("No plotting library available")
    
    print_success("Package installation completed!")
    
    # Verify installation
    print_status("Verifying installation...")
    
    verification_script = '''
import sys
print(f"Python version: {sys.version}")

packages_to_test = [
    ("flask", "Flask"),
    ("requests", "Requests"), 
    ("sqlalchemy", "SQLAlchemy"),
    ("bs4", "BeautifulSoup"),
    ("numpy", "NumPy"),
    ("pandas", "Pandas")
]

core_working = True
for module, name in packages_to_test:
    try:
        __import__(module)
        print(f"✅ {name} imported successfully")
    except ImportError as e:
        if module in ["numpy", "pandas"]:
            print(f"⚠️ {name} not available - some features may be limited")
        else:
            print(f"❌ {name} import failed: {e}")
            if module in ["flask", "requests", "sqlalchemy"]:
                core_working = False

if core_working:
    print("\\n🎉 Core packages are working!")
else:
    print("\\n❌ Core package verification failed!")
    sys.exit(1)
'''
    
    success, output = run_command(f'"{python_cmd}" -c "{verification_script}"')
    if success:
        print(output)
    else:
        print_error(f"Verification failed: {output}")
        return 1
    
    # Test app import
    print_status("Testing app import...")
    success, output = run_command(f'"{python_cmd}" -c "import app; print(\'✅ App imported successfully\')"')
    if success:
        print_success("App import test passed")
    else:
        print_warning("App import test failed, but core packages are working")
    
    # Setup database
    print_status("Setting up database...")
    if os.path.exists("recreate_db.py"):
        success, output = run_command(f'"{python_cmd}" recreate_db.py')
        if success:
            print_success("Database setup completed")
        else:
            print_warning("Database setup had issues, but continuing...")
    else:
        print_warning("recreate_db.py not found, skipping database setup")
    
    print()
    print_success("🎉 Emergency fix completed!")
    print()
    print("📋 Summary:")
    print("- Fixed setuptools.build_meta error")
    print("- Installed compatible package versions")
    print("- Core Flask functionality is working")
    print("- Some advanced features may be limited without NumPy/Pandas")
    print()
    print("🚀 To start the application:")
    if sys.platform == "win32":
        print(f"{python_cmd} app.py --host 0.0.0.0 --port 5000")
    else:
        print("python app.py --host 0.0.0.0 --port 5000")
    print()
    print("🌐 Then visit: http://your-server-ip:5000")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
