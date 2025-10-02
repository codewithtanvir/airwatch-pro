#!/usr/bin/env python3
"""
AirWatch Backend Startup Script
Ensures proper environment setup and starts the FastAPI server
"""

import os
import sys
import subprocess
from pathlib import Path

# Get the directory where this script is located (backend directory)
BACKEND_DIR = Path(__file__).parent.absolute()
APP_DIR = BACKEND_DIR / "app"

# Add the backend directory to Python path
sys.path.insert(0, str(BACKEND_DIR))

# Change to backend directory
os.chdir(BACKEND_DIR)

# Set environment variables
os.environ['PYTHONPATH'] = str(BACKEND_DIR)

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'supabase',
        'httpx',
        'pydantic'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Missing required packages: {', '.join(missing_packages)}")
        print("Please install dependencies with: pip install -r requirements.txt")
        return False
    
    return True

def check_environment():
    """Check if required environment files exist"""
    env_file = BACKEND_DIR / ".env"
    if not env_file.exists():
        print(f"Environment file not found: {env_file}")
        print("Please create a .env file with required configuration")
        return False
    
    return True

def main():
    """Main startup function"""
    print("🚀 Starting AirWatch Backend...")
    print(f"📁 Backend directory: {BACKEND_DIR}")
    print(f"📁 App directory: {APP_DIR}")
    print(f"🐍 Python path: {sys.path[0]}")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Check if app module can be imported
    try:
        from app.main import app
        print("✅ App module imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import app module: {e}")
        sys.exit(1)
    
    # Start the server
    print("🌐 Starting uvicorn server...")
    
    try:
        import uvicorn
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            reload_dirs=[str(BACKEND_DIR)],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()