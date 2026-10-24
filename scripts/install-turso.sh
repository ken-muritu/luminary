#!/bin/bash
set -e

# Install Turso CLI
echo "Installing Turso CLI..."
curl -sSfL https://get.tur.so/install.sh | bash

# Add to PATH
export PATH="$HOME/.turso:$PATH"

# Verify installation
echo "Turso version:"
turso --version

echo ""
echo "Turso CLI installed successfully!"
echo "To login, run: turso auth login"
echo "Or use: turso auth token"
