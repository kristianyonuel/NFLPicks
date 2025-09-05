#!/usr/bin/env python3
"""
NFLPicks Universal Launcher
Automatically detects platform and uses the best setup method.
"""

import os
import sys
import platform
import subprocess
import shutil

def run_command(cmd, shell=False):
    """Run a command and return success status."""
    try:
        result = subprocess.run(cmd, shell=shell, check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError:
        return False
    except FileNotFoundError:
        return False

def main():
    """Main launcher function."""
    print("🏈 NFLPicks Universal Launcher")
    print("🔍 Detecting platform and best setup method...")
    
    system = platform.system().lower()
    
    # Get command line arguments (port and host)
    args = sys.argv[1:] if len(sys.argv) > 1 else []
    
    print(f"📱 Platform detected: {platform.system()} {platform.release()}")
    
    # Try Python script first (most reliable and cross-platform)
    if os.path.exists('setup_and_run.py'):
        print("🐍 Using Python setup script (recommended)")
        cmd = [sys.executable, 'setup_and_run.py']
        if args:
            if len(args) >= 1:
                cmd.extend(['--port', args[0]])
            if len(args) >= 2:
                cmd.extend(['--host', args[1]])
        
        if run_command(cmd):
            return 0
        else:
            print("❌ Python setup script failed, trying alternatives...")
    
    # Try platform-specific scripts
    if system == 'windows':
        if os.path.exists('setup_and_run.bat'):
            print("🪟 Using Windows batch script")
            cmd = ['cmd', '/c', 'setup_and_run.bat'] + args
            if run_command(cmd, shell=True):
                return 0
    else:
        # Unix-like systems (Linux, macOS, etc.)
        if os.path.exists('setup_and_run.sh'):
            print("🐧 Using Unix shell script")
            # Make executable
            os.chmod('setup_and_run.sh', 0o755)
            cmd = ['./setup_and_run.sh'] + args
            if run_command(cmd):
                return 0
    
    # Fall back to manual instructions
    print("❌ All automated setup methods failed!")
    print("📖 Please follow the manual setup instructions:")
    print()
    print("1. Ensure Python 3.8+ is installed")
    print("2. Create virtual environment: python -m venv nflpicks_env")
    if system == 'windows':
        print("3. Activate environment: nflpicks_env\\Scripts\\activate")
    else:
        print("3. Activate environment: source nflpicks_env/bin/activate")
    print("4. Install packages: pip install -r requirements.txt")
    print("5. Setup database: python recreate_db.py")
    print("6. Run application: python app.py")
    print()
    print("📄 See COMPLETE_SETUP_GUIDE.md for detailed instructions")
    
    return 1

if __name__ == '__main__':
    sys.exit(main())
