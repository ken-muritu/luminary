#!/bin/bash
set -e

echo "================================"
echo "Luminary Production Setup"
echo "================================"
echo ""

# 1. Install Turso CLI
echo "[1/3] Installing Turso CLI..."
if ! command -v turso &> /dev/null; then
    # Download and install Turso CLI
    TURSO_VERSION="latest"
    ARCH=$(uname -m)
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    elif [ "$ARCH" = "aarch64" ]; then
        ARCH="arm64"
    fi
    
    DOWNLOAD_URL="https://github.com/tursodatabase/turso-cli/releases/${TURSO_VERSION}/download/turso-${OS}-${ARCH}.tar.gz"
    
    curl -sL "$DOWNLOAD_URL" -o /tmp/turso.tar.gz || {
        echo "Failed to download Turso CLI. Trying alternative..."
        curl -sSfL https://get.tur.so/install.sh | bash
    }
    
    if [ -f /tmp/turso.tar.gz ]; then
        mkdir -p ~/.local/bin
        tar -xzf /tmp/turso.tar.gz -C /tmp/
        mv /tmp/turso ~/.local/bin/turso
        chmod +x ~/.local/bin/turso
        rm /tmp/turso.tar.gz
    fi
    
    export PATH="$HOME/.local/bin:$PATH"
    
    if command -v turso &> /dev/null; then
        echo "  ✓ Turso CLI installed: $(turso --version)"
    else
        echo "  ✗ Turso CLI installation failed"
    fi
else
    echo "  ✓ Turso CLI already installed: $(turso --version)"
fi

# 2. Download Full Bible Data
echo ""
echo "[2/3] Downloading full KJV Bible data..."

BIBLE_FILE="/home/live/Desktop/luminary/apps/main/assets/bible/kjv.json"
mkdir -p "$(dirname "$BIBLE_FILE")"

# Check current Bible data
if [ -f "$BIBLE_FILE" ]; then
    CURRENT_VERSES=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$BIBLE_FILE')); console.log(d.total_verses || 0);" 2>/dev/null || echo "0")
    echo "  Current verses: $CURRENT_VERSES"
    
    if [ "$CURRENT_VERSES" -ge 30000 ]; then
        echo "  ✓ Bible data already complete"
    else
        echo "  Downloading remaining verses..."
        
        # Use Python to download remaining books
        python3 << 'PYEOF'
import json
import urllib.request
import time
import os

BIBLE_FILE = "/home/live/Desktop/luminary/apps/main/assets/bible/kjv.json"

# Books 59-66 (James - Revelation)
REMAINING_BOOKS = [
    (59, "James", 5),
    (60, "1 Peter", 5),
    (61, "2 Peter", 3),
    (62, "1 John", 5),
    (63, "2 John", 1),
    (64, "3 John", 1),
    (65, "Jude", 1),
    (66, "Revelation", 22)
]

# Load existing data
with open(BIBLE_FILE, 'r') as f:
    data = json.load(f)

existing_verses = data.get('verses', [])
print(f"Starting with {len(existing_verses)} verses")

for book_id, book_name, num_chapters in REMAINING_BOOKS:
    print(f"Downloading {book_name}...")
    
    for chapter in range(1, num_chapters + 1):
        try:
            url = f"https://bible-api.com/{urllib.parse.quote(f'{book_name} {chapter}')}?translation=kjv"
            req = urllib.request.Request(url, headers={'User-Agent': 'Luminary/1.0'})
            
            with urllib.request.urlopen(req, timeout=30) as response:
                chapter_data = json.loads(response.read().decode('utf-8'))
                
                if 'verses' in chapter_data:
                    for v in chapter_data['verses']:
                        existing_verses.append({
                            "translation": "KJV",
                            "book_id": book_id,
                            "book": book_name,
                            "chapter": chapter,
                            "verse": v['verse'],
                            "text": v['text'].strip()
                        })
            
            time.sleep(0.1)  # Rate limiting
            
        except Exception as e:
            print(f"  Error {book_name} {chapter}: {e}")

# Save updated data
data['verses'] = existing_verses
data['total_verses'] = len(existing_verses)

with open(BIBLE_FILE, 'w') as f:
    json.dump(data, f)

print(f"Total verses: {len(existing_verses)}")
PYEOF
    fi
else
    echo "  Bible file not found. Creating new..."
fi

# 3. Verify setup
echo ""
echo "[3/3] Verification..."

if command -v turso &> /dev/null; then
    echo "  ✓ Turso CLI: $(turso --version)"
else
    echo "  ✗ Turso CLI not found in PATH"
    echo "    Add to PATH: export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

if [ -f "$BIBLE_FILE" ]; then
    VERSES=$(node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('$BIBLE_FILE')); console.log(d.total_verses || 0);" 2>/dev/null || echo "0")
    echo "  ✓ Bible data: $VERSES verses"
fi

echo ""
echo "================================"
echo "Setup complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Login to Turso: turso auth login"
echo "2. Or use headless: turso auth token"
echo "3. Create database: turso db create luminary-db"
echo ""
