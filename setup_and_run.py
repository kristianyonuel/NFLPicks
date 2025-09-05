#!/usr/bin/env python3
"""
NFLPicks Remote Server Setup and Run Script (Cross-Platform)
This script sets up the complete environment and runs the application on any platform.

Usage: python setup_and_run.py [--port PORT] [--host HOST] [--help]
Example: python setup_and_run.py --port 5000 --host 0.0.0.0
"""

import os
import sys
import subprocess
import platform
import argparse
import socket
import shutil
from pathlib import Path

class NFLPicksSetup:
    def __init__(self):
        self.platform = platform.system().lower()
        self.venv_name = "nflpicks_env"
        self.python_cmd = self._get_python_command()
        self.pip_cmd = self._get_pip_command()
        
    def _get_python_command(self):
        """Get the appropriate Python command for this platform."""
        commands = ['python3', 'python']
        for cmd in commands:
            if shutil.which(cmd):
                try:
                    result = subprocess.run([cmd, '--version'], 
                                          capture_output=True, text=True)
                    if result.returncode == 0 and 'Python 3.' in result.stdout:
                        return cmd
                except:
                    continue
        return None
        
    def _get_pip_command(self):
        """Get the appropriate pip command for this platform."""
        if self.platform == 'windows':
            return os.path.join(self.venv_name, 'Scripts', 'pip.exe')
        else:
            return os.path.join(self.venv_name, 'bin', 'pip')
            
    def _get_python_executable(self):
        """Get the Python executable in the virtual environment."""
        if self.platform == 'windows':
            return os.path.join(self.venv_name, 'Scripts', 'python.exe')
        else:
            return os.path.join(self.venv_name, 'bin', 'python')
            
    def print_header(self, port, host):
        """Print the setup header."""
        print("=" * 50)
        print("🏈 NFLPicks Remote Server Setup & Run")
        print("=" * 50)
        print(f"Platform: {platform.system()} {platform.release()}")
        print(f"Port: {port}")
        print(f"Host: {host}")
        print(f"Python: {self.python_cmd}")
        print(f"Virtual Environment: {self.venv_name}")
        print("=" * 50)
        
    def check_port(self, port):
        """Check if the port is available."""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return True
        except OSError:
            print(f"❌ Port {port} is already in use!")
            print("Please choose a different port or stop the service using that port.")
            return False
            
    def check_system_dependencies(self):
        """Check for required system dependencies."""
        print("📦 Checking system dependencies...")
        
        # Check for Python
        if not self.python_cmd:
            print("❌ Python 3 not found!")
            print("Please install Python 3.8+ first:")
            if self.platform == 'windows':
                print("  Download from: https://www.python.org/downloads/")
                print("  Make sure to check 'Add Python to PATH' during installation")
            elif self.platform == 'linux':
                print("  Ubuntu/Debian: sudo apt update && sudo apt install python3 python3-pip python3-venv")
                print("  CentOS/RHEL: sudo yum install python3 python3-pip")
            elif self.platform == 'darwin':
                print("  macOS: Install from https://www.python.org/downloads/ or use Homebrew:")
                print("  brew install python")
            return False
            
        # Check Python version
        try:
            result = subprocess.run([self.python_cmd, '--version'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip().split()[1]
                print(f"✅ Found Python {version}")
            else:
                print("❌ Could not determine Python version")
                return False
        except Exception as e:
            print(f"❌ Error checking Python version: {e}")
            return False
            
        # Check for venv module
        try:
            result = subprocess.run([self.python_cmd, '-m', 'venv', '--help'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                print("❌ Python venv module not found!")
                if self.platform == 'linux':
                    print("Please install python3-venv package:")
                    print("  Ubuntu/Debian: sudo apt install python3-venv")
                return False
        except Exception as e:
            print(f"❌ Error checking venv module: {e}")
            return False
            
        print("✅ All system dependencies satisfied")
        return True
        
    def setup_virtual_environment(self):
        """Setup the virtual environment."""
        print("🔧 Setting up virtual environment...")
        
        # Remove existing venv if it exists
        if os.path.exists(self.venv_name):
            print("🗑️  Removing existing virtual environment...")
            shutil.rmtree(self.venv_name)
            
        # Create new virtual environment
        print(f"🏗️  Creating virtual environment: {self.venv_name}")
        try:
            subprocess.run([self.python_cmd, '-m', 'venv', self.venv_name], 
                          check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create virtual environment: {e}")
            return False
            
        # Upgrade pip
        print("⬆️  Upgrading pip...")
        try:
            pip_exe = self._get_python_executable()
            subprocess.run([pip_exe, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                          check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to upgrade pip: {e}")
            return False
            
        print("✅ Virtual environment ready")
        return True
        
    def install_packages(self):
        """Install Python packages from requirements.txt."""
        print("📦 Installing Python packages...")
        
        # Check if requirements.txt exists
        if not os.path.exists('requirements.txt'):
            print("❌ requirements.txt not found!")
            print("Please ensure you're in the correct directory with requirements.txt")
            return False
            
        # Install packages
        print("📥 Installing packages from requirements.txt...")
        try:
            pip_exe = self._get_pip_command()
            subprocess.run([pip_exe, 'install', '-r', 'requirements.txt'], 
                          check=True)
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install packages: {e}")
            return False
            
        print("✅ All packages installed")
        return True
        
    def setup_database(self):
        """Setup the database."""
        print("🗄️  Setting up database...")
        
        # Check if recreate_db.py exists
        if os.path.exists('recreate_db.py'):
            print("🔄 Running database recreation script...")
            try:
                python_exe = self._get_python_executable()
                subprocess.run([python_exe, 'recreate_db.py'], check=True)
            except subprocess.CalledProcessError as e:
                print(f"⚠️  Database setup failed: {e}")
                print("You may need to manually initialize the database")
        else:
            print("⚠️  recreate_db.py not found, skipping database setup")
            print("You may need to manually initialize the database")
            
        print("✅ Database setup complete")
        return True
        
    def validate_environment(self):
        """Validate the environment setup."""
        print("🔍 Validating environment...")
        
        # Check if main app file exists
        if not os.path.exists('app.py'):
            print("❌ app.py not found!")
            print("Please ensure you're in the correct directory")
            return False
            
        # Test import of main modules
        print("🧪 Testing Python imports...")
        python_exe = self._get_python_executable()
        
        try:
            subprocess.run([python_exe, '-c', 'import flask; print("✅ Flask import successful")'], 
                          check=True)
        except subprocess.CalledProcessError:
            print("❌ Flask import failed")
            return False
            
        try:
            subprocess.run([python_exe, '-c', 'import app; print("✅ App import successful")'], 
                          check=True)
        except subprocess.CalledProcessError:
            print("❌ App import failed - check your code for syntax errors")
            return False
            
        print("✅ Environment validation complete")
        return True
        
    def start_application(self, host, port):
        """Start the Flask application."""
        print("🚀 Starting NFLPicks application...")
        print(f"📍 URL: http://{host}:{port}")
        print("🛑 Press Ctrl+C to stop the application")
        print("=" * 50)
        
        # Set environment variables
        env = os.environ.copy()
        env['FLASK_APP'] = 'app.py'
        env['FLASK_ENV'] = 'production'
        env['FLASK_DEBUG'] = 'false'
        
        # Start the application
        try:
            python_exe = self._get_python_executable()
            subprocess.run([python_exe, 'app.py', '--host', host, '--port', str(port)], 
                          env=env)
        except KeyboardInterrupt:
            print("\n🛑 Application stopped by user")
        except Exception as e:
            print(f"❌ Error starting application: {e}")
            return False
            
        return True
        
    def run_setup(self, host, port):
        """Run the complete setup process."""
        self.print_header(port, host)
        
        # Check port availability
        if not self.check_port(port):
            return False
            
        # Check system dependencies
        if not self.check_system_dependencies():
            return False
            
        # Setup virtual environment
        if not self.setup_virtual_environment():
            return False
            
        # Install packages
        if not self.install_packages():
            return False
            
        # Setup database
        self.setup_database()
        
        # Validate environment
        if not self.validate_environment():
            return False
            
        # Start application
        return self.start_application(host, port)

def main():
    """Main function to parse arguments and run setup."""
    parser = argparse.ArgumentParser(description='NFLPicks Remote Server Setup & Run')
    parser.add_argument('--port', type=int, default=5000, 
                       help='Port to run the application on (default: 5000)')
    parser.add_argument('--host', default='0.0.0.0', 
                       help='Host to bind the application to (default: 0.0.0.0)')
    
    args = parser.parse_args()
    
    setup = NFLPicksSetup()
    
    try:
        success = setup.run_setup(args.host, args.port)
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🧹 Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
