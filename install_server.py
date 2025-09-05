#!/usr/bin/env python3
"""
NFLPicks Robust Server Installer
Handles metadata-generation-failed errors and other common installation issues.
"""

import os
import sys
import subprocess
import platform
import shutil
import json
from pathlib import Path

class RobustInstaller:
    def __init__(self):
        self.system = platform.system().lower()
        self.venv_name = "nflpicks_env"
        self.python_cmd = self._get_python_command()
        
    def _get_python_command(self):
        """Get the appropriate Python command."""
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
        
    def _get_pip_executable(self):
        """Get pip executable in virtual environment."""
        if self.system == 'windows':
            return os.path.join(self.venv_name, 'Scripts', 'pip.exe')
        else:
            return os.path.join(self.venv_name, 'bin', 'pip')
            
    def _get_python_executable(self):
        """Get Python executable in virtual environment."""
        if self.system == 'windows':
            return os.path.join(self.venv_name, 'Scripts', 'python.exe')
        else:
            return os.path.join(self.venv_name, 'bin', 'python')
            
    def print_status(self, message):
        print(f"🔧 [INFO] {message}")
        
    def print_success(self, message):
        print(f"✅ [SUCCESS] {message}")
        
    def print_warning(self, message):
        print(f"⚠️ [WARNING] {message}")
        
    def print_error(self, message):
        print(f"❌ [ERROR] {message}")
        
    def run_command(self, cmd, check=True, capture_output=False):
        """Run a command with error handling."""
        try:
            result = subprocess.run(cmd, check=check, capture_output=capture_output, text=True)
            return result
        except subprocess.CalledProcessError as e:
            if capture_output:
                self.print_error(f"Command failed: {' '.join(cmd)}")
                self.print_error(f"Error: {e.stderr}")
            return None
        except FileNotFoundError:
            self.print_error(f"Command not found: {cmd[0]}")
            return None
            
    def get_system_info(self):
        """Get and display system information."""
        self.print_status("Detecting system information...")
        
        print(f"OS: {platform.system()} {platform.release()}")
        print(f"Architecture: {platform.machine()}")
        print(f"Python: {self.python_cmd}")
        
        if self.python_cmd:
            result = self.run_command([self.python_cmd, '--version'], capture_output=True)
            if result:
                print(f"Python Version: {result.stdout.strip()}")
                
    def install_system_dependencies(self):
        """Install system dependencies based on the platform."""
        self.print_status("Installing system dependencies...")
        
        if self.system == 'linux':
            # Try to detect the distribution
            try:
                if shutil.which('apt-get'):
                    self.print_status("Detected Debian/Ubuntu system")
                    commands = [
                        ['sudo', 'apt-get', 'update'],
                        ['sudo', 'apt-get', 'install', '-y', 
                         'python3-dev', 'python3-pip', 'python3-venv',
                         'build-essential', 'gcc', 'g++', 'make',
                         'libssl-dev', 'libffi-dev', 'libxml2-dev', 
                         'libxslt1-dev', 'zlib1g-dev']
                    ]
                elif shutil.which('yum'):
                    self.print_status("Detected RHEL/CentOS system")
                    commands = [
                        ['sudo', 'yum', 'update', '-y'],
                        ['sudo', 'yum', 'groupinstall', '-y', 'Development Tools'],
                        ['sudo', 'yum', 'install', '-y',
                         'python3-devel', 'python3-pip', 'gcc', 'gcc-c++',
                         'make', 'openssl-devel', 'libffi-devel', 
                         'libxml2-devel', 'libxslt-devel', 'zlib-devel']
                    ]
                elif shutil.which('dnf'):
                    self.print_status("Detected Fedora system")
                    commands = [
                        ['sudo', 'dnf', 'update', '-y'],
                        ['sudo', 'dnf', 'groupinstall', '-y', 'Development Tools'],
                        ['sudo', 'dnf', 'install', '-y',
                         'python3-devel', 'python3-pip', 'gcc', 'gcc-c++',
                         'make', 'openssl-devel', 'libffi-devel',
                         'libxml2-devel', 'libxslt-devel', 'zlib-devel']
                    ]
                else:
                    self.print_warning("Could not detect package manager")
                    return True
                    
                for cmd in commands:
                    result = self.run_command(cmd, check=False)
                    if result is None or result.returncode != 0:
                        self.print_warning(f"Command failed: {' '.join(cmd)}")
                        
            except Exception as e:
                self.print_warning(f"System dependency installation failed: {e}")
                
        self.print_success("System dependencies installation completed")
        return True
        
    def setup_virtual_environment(self):
        """Setup virtual environment."""
        self.print_status("Setting up virtual environment...")
        
        # Remove existing venv
        if os.path.exists(self.venv_name):
            self.print_warning("Removing existing virtual environment...")
            shutil.rmtree(self.venv_name)
            
        # Create new venv
        result = self.run_command([self.python_cmd, '-m', 'venv', self.venv_name])
        if not result:
            return False
            
        # Upgrade pip, setuptools, wheel
        pip_exe = self._get_pip_executable()
        self.print_status("Upgrading pip, setuptools, and wheel...")
        
        upgrade_packages = ['pip', 'setuptools', 'wheel']
        for package in upgrade_packages:
            self.run_command([pip_exe, 'install', '--upgrade', package], check=False)
            
        self.print_success("Virtual environment created and configured")
        return True
        
    def install_packages_robust(self):
        """Install packages with multiple fallback strategies."""
        self.print_status("Installing Python packages with robust error handling...")
        
        pip_exe = self._get_pip_executable()
        
        # Strategy 1: Server-optimized requirements
        if os.path.exists('requirements_server.txt'):
            self.print_status("Trying server-optimized requirements...")
            result = self.run_command([
                pip_exe, 'install', '-r', 'requirements_server.txt',
                '--prefer-binary', '--no-cache-dir'
            ], check=False)
            if result and result.returncode == 0:
                self.print_success("Server-optimized requirements installed")
                return True
                
        # Strategy 2: Original requirements with binary preference
        if os.path.exists('requirements.txt'):
            self.print_status("Trying original requirements with binary preference...")
            result = self.run_command([
                pip_exe, 'install', '-r', 'requirements.txt',
                '--prefer-binary', '--no-cache-dir', '--force-reinstall'
            ], check=False)
            if result and result.returncode == 0:
                self.print_success("Original requirements installed")
                return True
                
        # Strategy 3: Individual package installation
        return self._install_packages_individually()
        
    def _install_packages_individually(self):
        """Install packages one by one with specific handling."""
        self.print_status("Installing packages individually...")
        
        pip_exe = self._get_pip_executable()
        
        # Core packages that rarely fail
        core_packages = [
            'Flask==3.0.0',
            'requests==2.31.0',
            'python-dotenv==1.0.0',
            'SQLAlchemy==2.0.25',
            'Flask-SQLAlchemy==3.1.1',
            'beautifulsoup4==4.12.2',
            'feedparser==6.0.10',
            'vaderSentiment==3.3.2',
            'schedule==1.2.0'
        ]
        
        for package in core_packages:
            self.print_status(f"Installing {package}...")
            result = self.run_command([
                pip_exe, 'install', package, '--prefer-binary', '--no-cache-dir'
            ], check=False)
            if not result or result.returncode != 0:
                self.print_error(f"Failed to install {package}")
                return False
                
        # Data science packages with special handling
        self._install_data_science_packages()
        
        self.print_success("Individual package installation completed")
        return True
        
    def _install_data_science_packages(self):
        """Install data science packages with fallback versions."""
        pip_exe = self._get_pip_executable()
        
        # Try numpy first
        numpy_versions = ['numpy==1.24.4', 'numpy>=1.21.0,<1.25.0', 'numpy']
        for numpy_ver in numpy_versions:
            self.print_status(f"Trying {numpy_ver}...")
            result = self.run_command([
                pip_exe, 'install', numpy_ver, '--prefer-binary', '--no-cache-dir'
            ], check=False)
            if result and result.returncode == 0:
                self.print_success(f"Numpy installed: {numpy_ver}")
                break
        else:
            self.print_warning("Could not install numpy")
            
        # Try pandas
        pandas_versions = ['pandas==2.0.3', 'pandas>=1.5.0,<2.1.0', 'pandas']
        for pandas_ver in pandas_versions:
            self.print_status(f"Trying {pandas_ver}...")
            result = self.run_command([
                pip_exe, 'install', pandas_ver, '--prefer-binary', '--no-cache-dir'
            ], check=False)
            if result and result.returncode == 0:
                self.print_success(f"Pandas installed: {pandas_ver}")
                break
        else:
            self.print_warning("Could not install pandas")
            
        # Try scikit-learn
        sklearn_versions = ['scikit-learn==1.3.2', 'scikit-learn>=1.0.0,<1.4.0', 'scikit-learn']
        for sklearn_ver in sklearn_versions:
            self.print_status(f"Trying {sklearn_ver}...")
            result = self.run_command([
                pip_exe, 'install', sklearn_ver, '--prefer-binary', '--no-cache-dir'
            ], check=False)
            if result and result.returncode == 0:
                self.print_success(f"Scikit-learn installed: {sklearn_ver}")
                break
        else:
            self.print_warning("Could not install scikit-learn")
            
        # Try plotting library
        plot_packages = ['plotly==5.17.0', 'matplotlib>=3.5.0']
        for plot_pkg in plot_packages:
            result = self.run_command([
                pip_exe, 'install', plot_pkg, '--prefer-binary', '--no-cache-dir'
            ], check=False)
            if result and result.returncode == 0:
                self.print_success(f"Plotting library installed: {plot_pkg}")
                break
        else:
            self.print_warning("Could not install plotting library")
            
    def create_minimal_setup(self):
        """Create minimal setup with only essential packages."""
        self.print_warning("Creating minimal setup...")
        
        pip_exe = self._get_pip_executable()
        minimal_packages = [
            'Flask', 'requests', 'SQLAlchemy', 'Flask-SQLAlchemy',
            'beautifulsoup4', 'python-dotenv', 'vaderSentiment'
        ]
        
        for package in minimal_packages:
            self.run_command([
                pip_exe, 'install', package, '--prefer-binary', '--no-cache-dir'
            ], check=False)
            
        self.print_success("Minimal setup completed")
        
    def verify_installation(self):
        """Verify the installation."""
        self.print_status("Verifying installation...")
        
        python_exe = self._get_python_executable()
        
        # Test core imports
        test_script = """
try:
    import flask
    import requests
    import sqlalchemy
    print('✅ Core packages imported successfully')
except Exception as e:
    print(f'❌ Core import failed: {e}')
    exit(1)
"""
        
        result = self.run_command([python_exe, '-c', test_script], check=False)
        if not result or result.returncode != 0:
            self.print_error("Core package verification failed")
            return False
            
        # Test app import
        if os.path.exists('app.py'):
            app_test = """
try:
    import app
    print('✅ App module imported successfully')
except Exception as e:
    print(f'⚠️ App import warning: {e}')
"""
            self.run_command([python_exe, '-c', app_test], check=False)
            
        self.print_success("Installation verification completed")
        return True
        
    def setup_database(self):
        """Setup the database."""
        self.print_status("Setting up database...")
        
        if os.path.exists('recreate_db.py'):
            python_exe = self._get_python_executable()
            result = self.run_command([python_exe, 'recreate_db.py'], check=False)
            if result and result.returncode == 0:
                self.print_success("Database setup completed")
            else:
                self.print_warning("Database setup had issues, but continuing...")
        else:
            self.print_warning("recreate_db.py not found, skipping database setup")
            
    def run_installation(self):
        """Run the complete installation process."""
        print("🚀 Starting NFLPicks robust installation...")
        print("=" * 50)
        
        # Get system info
        self.get_system_info()
        
        # Install system dependencies
        if not self.install_system_dependencies():
            self.print_error("Failed to install system dependencies")
            return False
            
        # Setup virtual environment
        if not self.setup_virtual_environment():
            self.print_error("Failed to setup virtual environment")
            return False
            
        # Install packages
        if not self.install_packages_robust():
            self.print_warning("Robust installation failed, trying minimal setup...")
            self.create_minimal_setup()
            
        # Verify installation
        if not self.verify_installation():
            self.print_error("Installation verification failed")
            return False
            
        # Setup database
        self.setup_database()
        
        print()
        self.print_success("🎉 NFLPicks installation completed!")
        print()
        self.print_status("To start the application:")
        if self.system == 'windows':
            self.print_status(f"1. Activate: {self.venv_name}\\Scripts\\activate")
        else:
            self.print_status(f"1. Activate: source {self.venv_name}/bin/activate")
        self.print_status("2. Run: python app.py --host 0.0.0.0 --port 5000")
        
        return True

def main():
    """Main function."""
    installer = RobustInstaller()
    
    if not installer.python_cmd:
        installer.print_error("Python 3 not found! Please install Python 3.8+")
        return 1
        
    try:
        success = installer.run_installation()
        return 0 if success else 1
    except KeyboardInterrupt:
        installer.print_warning("Installation interrupted by user")
        return 1
    except Exception as e:
        installer.print_error(f"Unexpected error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
