#!/bin/bash
# Luminary Installation Script
# Supports Linux and macOS

set -e

APP_NAME="Luminary"
VERSION="2.0.0"
INSTALL_DIR="$HOME/.local/share/luminary"
DESKTOP_DIR="$HOME/.local/share/applications"
BIN_DIR="$HOME/.local/bin"

echo "========================================"
echo "  Luminary $VERSION Installer"
echo "  Professional Church Presentation Software"
echo "========================================"
echo ""

# Detect OS
OS=$(uname -s)
ARCH=$(uname -m)

echo "Detected: $OS $ARCH"

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Please install Node.js 20 or later."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ required, found $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install npm dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci

# Build application
echo ""
echo "🔨 Building application..."
npm run build

# Create directories
echo ""
echo "📁 Creating application directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DESKTOP_DIR"
mkdir -p "$BIN_DIR"

# Install based on OS
if [ "$OS" = "Linux" ]; then
    echo ""
    echo "🐧 Building Linux package..."
    
    # Build AppImage
    npm run dist -- --linux AppImage --x64
    
    # Copy to install directory
    cp "dist-electron/Luminary-$VERSION.AppImage" "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/Luminary-$VERSION.AppImage"
    
    # Create desktop entry
    cat > "$DESKTOP_DIR/luminary.desktop" << EOF
[Desktop Entry]
Name=Luminary
Comment=Professional Church Presentation Software
Exec=$INSTALL_DIR/Luminary-$VERSION.AppImage
Icon=$INSTALL_DIR/icon.png
Type=Application
Categories=AudioVideo;Presentation;
Terminal=false
StartupNotify=true
EOF
    
    # Create symlink
    ln -sf "$INSTALL_DIR/Luminary-$VERSION.AppImage" "$BIN_DIR/luminary"
    
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "🚀 Launch Luminary:"
    echo "   - From applications menu: 'Luminary'"
    echo "   - From terminal: luminary"
    echo ""
    
elif [ "$OS" = "Darwin" ]; then
    echo ""
    echo "🍎 Building macOS package..."
    npm run dist -- --mac dmg --x64 --arm64
    
    echo ""
    echo "✅ DMG created in dist-electron/"
    echo "   Mount the DMG and drag Luminary to Applications"
    
else
    echo "❌ Unsupported OS: $OS"
    exit 1
fi

# Setup data directory
echo ""
echo "📂 Setting up data directory..."
mkdir -p "$HOME/.local/share/luminary/data"
mkdir -p "$HOME/.local/share/luminary/backups"
mkdir -p "$HOME/.local/share/luminary/media"

echo ""
echo "========================================"
echo "  🎉 Installation Complete!"
echo "========================================"
echo ""
echo "Getting Started:"
echo "  1. Launch Luminary"
echo "  2. Complete the onboarding wizard"
echo "  3. Import your songs or start creating setlists"
echo "  4. Go Live and project to your congregation"
echo ""
echo "Documentation: https://github.com/ken-muritu/luminary"
echo "Support: Open an issue on GitHub"
echo ""
