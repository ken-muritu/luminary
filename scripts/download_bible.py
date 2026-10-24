#!/usr/bin/env python3
"""Download full KJV Bible from bible-api.com"""
import json
import time
import urllib.request
import urllib.error
import os

BOOKS = [
    ("Genesis", 50), ("Exodus", 40), ("Leviticus", 27), ("Numbers", 36), ("Deuteronomy", 34),
    ("Joshua", 24), ("Judges", 21), ("Ruth", 4), ("1 Samuel", 31), ("2 Samuel", 24),
    ("1 Kings", 22), ("2 Kings", 25), ("1 Chronicles", 29), ("2 Chronicles", 36), ("Ezra", 10),
    ("Nehemiah", 13), ("Esther", 10), ("Job", 42), ("Psalms", 150), ("Proverbs", 31),
    ("Ecclesiastes", 12), ("Song of Solomon", 8), ("Isaiah", 66), ("Jeremiah", 52),
    ("Lamentations", 5), ("Ezekiel", 48), ("Daniel", 12), ("Hosea", 14), ("Joel", 3),
    ("Amos", 9), ("Obadiah", 1), ("Jonah", 4), ("Micah", 7), ("Nahum", 3),
    ("Habakkuk", 3), ("Zephaniah", 3), ("Haggai", 2), ("Zechariah", 14), ("Malachi", 3),
    ("Matthew", 28), ("Mark", 16), ("Luke", 24), ("John", 21), ("Acts", 28),
    ("Romans", 16), ("1 Corinthians", 16), ("2 Corinthians", 13), ("Galatians", 6),
    ("Ephesians", 6), ("Philippians", 4), ("Colossians", 4), ("1 Thessalonians", 5),
    ("2 Thessalonians", 3), ("1 Timothy", 6), ("2 Timothy", 4), ("Titus", 3),
    ("Philemon", 1), ("Hebrews", 13), ("James", 5), ("1 Peter", 5), ("2 Peter", 3),
    ("1 John", 5), ("2 John", 1), ("3 John", 1), ("Jude", 1), ("Revelation", 22)
]

def fetch_chapter(book_name, chapter):
    """Fetch a single chapter from bible-api.com"""
    encoded = urllib.parse.quote(f"{book_name} {chapter}")
    url = f"https://bible-api.com/{encoded}?translation=kjv"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Luminary-App/1.0'})
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get('verses', [])
    except Exception as e:
        print(f"    Error fetching {book_name} {chapter}: {e}")
        return []

def main():
    print("="*60)
    print("Full KJV Bible Download")
    print("="*60)
    print()
    
    verses = []
    book_id = 1
    
    for book_name, num_chapters in BOOKS:
        print(f"Downloading {book_name} ({book_id}/66)...")
        
        for chapter in range(1, num_chapters + 1):
            chapter_verses = fetch_chapter(book_name, chapter)
            
            for v in chapter_verses:
                verses.append({
                    "translation": "KJV",
                    "book_id": book_id,
                    "book": book_name,
                    "chapter": chapter,
                    "verse": v.get('verse', 0),
                    "text": v.get('text', '').strip()
                })
            
            # Rate limiting
            time.sleep(0.1)
        
        book_id += 1
    
    # Save
    output = {
        "translation": "KJV",
        "source": "bible-api.com (public domain)",
        "total_verses": len(verses),
        "books": 66,
        "verses": verses
    }
    
    output_path = "/home/live/Desktop/luminary/apps/main/assets/bible/kjv.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(output, f)
    
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print()
    print(f"✓ Downloaded {len(verses)} verses")
    print(f"  Saved to: {output_path}")
    print(f"  File size: {file_size:.2f} MB")

if __name__ == "__main__":
    main()
