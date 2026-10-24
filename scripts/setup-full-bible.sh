#!/bin/bash
set -e

echo "================================"
echo "Full KJV Bible Data Download"
echo "================================"
echo ""

ASSETS_DIR="/home/live/Desktop/luminary/apps/main/assets/bible"
mkdir -p "$ASSETS_DIR"

# Method 1: Download from GitHub (scrollmapper)
echo "Method 1: Cloning scrollmapper/bible_databases..."
TEMP_DIR=$(mktemp -d)

git clone --depth 1 https://github.com/scrollmapper/bible_databases.git "$TEMP_DIR" 2>/dev/null || {
    echo "Git clone failed, trying direct download..."
    
    # Method 2: Download raw JSON files
    mkdir -p "$TEMP_DIR/json"
    
    # Download KJV JSON
    curl -sL "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/json/t_kjv.json" \
        -o "$TEMP_DIR/kjv_raw.json" || {
        echo "ERROR: Failed to download Bible data"
        echo "Please manually download from: https://github.com/scrollmapper/bible_databases"
        exit 1
    }
}

# Convert to Luminary format
echo "Converting to Luminary format..."

node -e "
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!fs.existsSync(inputFile)) {
    console.error('Input file not found:', inputFile);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

const bookMap = {
    'Gen': 1, 'Exo': 2, 'Lev': 3, 'Num': 4, 'Deu': 5,
    'Jos': 6, 'Jdg': 7, 'Rut': 8, '1Sa': 9, '2Sa': 10,
    '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14, 'Ezr': 15,
    'Neh': 16, 'Est': 17, 'Job': 18, 'Psa': 19, 'Pro': 20,
    'Ecc': 21, 'Son': 22, 'Isa': 23, 'Jer': 24, 'Lam': 25,
    'Eze': 26, 'Dan': 27, 'Hos': 28, 'Joe': 29, 'Amo': 30,
    'Oba': 31, 'Jon': 32, 'Mic': 33, 'Nah': 34, 'Hab': 35,
    'Zep': 36, 'Hag': 37, 'Zec': 38, 'Mal': 39,
    'Mat': 40, 'Mar': 41, 'Luk': 42, 'Joh': 43, 'Act': 44,
    'Rom': 45, '1Co': 46, '2Co': 47, 'Gal': 48, 'Eph': 49,
    'Phi': 50, 'Col': 51, '1Th': 52, '2Th': 53, '1Ti': 54,
    '2Ti': 55, 'Tit': 56, 'Phm': 57, 'Heb': 58, 'Jam': 59,
    '1Pe': 60, '2Pe': 61, '1Jo': 62, '2Jo': 63, '3Jo': 64,
    'Jud': 65, 'Rev': 66
};

const bookNames = {
    'Gen': 'Genesis', 'Exo': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deu': 'Deuteronomy',
    'Jos': 'Joshua', 'Jdg': 'Judges', 'Rut': 'Ruth', '1Sa': '1 Samuel', '2Sa': '2 Samuel',
    '1Ki': '1 Kings', '2Ki': '2 Kings', '1Ch': '1 Chronicles', '2Ch': '2 Chronicles',
    'Ezr': 'Ezra', 'Neh': 'Nehemiah', 'Est': 'Esther', 'Job': 'Job', 'Psa': 'Psalms',
    'Pro': 'Proverbs', 'Ecc': 'Ecclesiastes', 'Son': 'Song of Solomon', 'Isa': 'Isaiah',
    'Jer': 'Jeremiah', 'Lam': 'Lamentations', 'Eze': 'Ezekiel', 'Dan': 'Daniel',
    'Hos': 'Hosea', 'Joe': 'Joel', 'Amo': 'Amos', 'Oba': 'Obadiah', 'Jon': 'Jonah',
    'Mic': 'Micah', 'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zep': 'Zephaniah',
    'Hag': 'Haggai', 'Zec': 'Zechariah', 'Mal': 'Malachi',
    'Mat': 'Matthew', 'Mar': 'Mark', 'Luk': 'Luke', 'Joh': 'John', 'Act': 'Acts',
    'Rom': 'Romans', '1Co': '1 Corinthians', '2Co': '2 Corinthians', 'Gal': 'Galatians',
    'Eph': 'Ephesians', 'Phi': 'Philippians', 'Col': 'Colossians', '1Th': '1 Thessalonians',
    '2Th': '2 Thessalonians', '1Ti': '1 Timothy', '2Ti': '2 Timothy', 'Tit': 'Titus',
    'Phm': 'Philemon', 'Heb': 'Hebrews', 'Jam': 'James', '1Pe': '1 Peter', '2Pe': '2 Peter',
    '1Jo': '1 John', '2Jo': '2 John', '3Jo': '3 John', 'Jud': 'Jude', 'Rev': 'Revelation'
};

const verses = [];

for (const item of data) {
    const bookAbbr = item.book;
    const bookId = bookMap[bookAbbr];
    const bookName = bookNames[bookAbbr];
    
    if (!bookId) {
        console.warn('Unknown book:', bookAbbr);
        continue;
    }
    
    verses.push({
        translation: 'KJV',
        book_id: bookId,
        book: bookName,
        chapter: parseInt(item.chapter),
        verse: parseInt(item.verse),
        text: item.text
    });
}

const output = {
    translation: 'KJV',
    source: 'scrollmapper/bible_databases',
    total_verses: verses.length,
    books: 66,
    verses: verses
};

fs.writeFileSync(outputFile, JSON.stringify(output));
console.log('Created KJV Bible with ' + verses.length + ' verses');
" "$TEMP_DIR/json/t_kjv.json" "$ASSETS_DIR/kjv.json" 2>/dev/null || {
    # Fallback: use raw file if conversion script fails
    cp "$TEMP_DIR/kjv_raw.json" "$ASSETS_DIR/kjv.json" 2>/dev/null || true
}

# Cleanup
rm -rf "$TEMP_DIR"

# Show result
if [ -f "$ASSETS_DIR/kjv.json" ]; then
    FILE_SIZE=$(ls -lh "$ASSETS_DIR/kjv.json" | awk '{print $5}')
    echo ""
    echo "✓ Full KJV Bible saved!"
    echo "  Location: $ASSETS_DIR/kjv.json"
    echo "  Size: $FILE_SIZE"
    
    # Count verses
    VERSE_COUNT=$(grep -c '"verse"' "$ASSETS_DIR/kjv.json" || echo "unknown")
    echo "  Verses: $VERSE_COUNT"
else
    echo "✗ Download failed"
    exit 1
fi
