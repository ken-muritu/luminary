const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../apps/main/assets/bible/kjv.json');

const books = [
  { id: 1, name: 'Genesis', chapters: 50 },
  { id: 2, name: 'Exodus', chapters: 40 },
  { id: 3, name: 'Leviticus', chapters: 27 },
  { id: 4, name: 'Numbers', chapters: 36 },
  { id: 5, name: 'Deuteronomy', chapters: 34 },
  { id: 6, name: 'Joshua', chapters: 24 },
  { id: 7, name: 'Judges', chapters: 21 },
  { id: 8, name: 'Ruth', chapters: 4 },
  { id: 9, name: '1 Samuel', chapters: 31 },
  { id: 10, name: '2 Samuel', chapters: 24 },
  { id: 11, name: '1 Kings', chapters: 22 },
  { id: 12, name: '2 Kings', chapters: 25 },
  { id: 13, name: '1 Chronicles', chapters: 29 },
  { id: 14, name: '2 Chronicles', chapters: 36 },
  { id: 15, name: 'Ezra', chapters: 10 },
  { id: 16, name: 'Nehemiah', chapters: 13 },
  { id: 17, name: 'Esther', chapters: 10 },
  { id: 18, name: 'Job', chapters: 42 },
  { id: 19, name: 'Psalms', chapters: 150 },
  { id: 20, name: 'Proverbs', chapters: 31 },
  { id: 21, name: 'Ecclesiastes', chapters: 12 },
  { id: 22, name: 'Song of Solomon', chapters: 8 },
  { id: 23, name: 'Isaiah', chapters: 66 },
  { id: 24, name: 'Jeremiah', chapters: 52 },
  { id: 25, name: 'Lamentations', chapters: 5 },
  { id: 26, name: 'Ezekiel', chapters: 48 },
  { id: 27, name: 'Daniel', chapters: 12 },
  { id: 28, name: 'Hosea', chapters: 14 },
  { id: 29, name: 'Joel', chapters: 3 },
  { id: 30, name: 'Amos', chapters: 9 },
  { id: 31, name: 'Obadiah', chapters: 1 },
  { id: 32, name: 'Jonah', chapters: 4 },
  { id: 33, name: 'Micah', chapters: 7 },
  { id: 34, name: 'Nahum', chapters: 3 },
  { id: 35, name: 'Habakkuk', chapters: 3 },
  { id: 36, name: 'Zephaniah', chapters: 3 },
  { id: 37, name: 'Haggai', chapters: 2 },
  { id: 38, name: 'Zechariah', chapters: 14 },
  { id: 39, name: 'Malachi', chapters: 3 },
  { id: 40, name: 'Matthew', chapters: 28 },
  { id: 41, name: 'Mark', chapters: 16 },
  { id: 42, name: 'Luke', chapters: 24 },
  { id: 43, name: 'John', chapters: 21 },
  { id: 44, name: 'Acts', chapters: 28 },
  { id: 45, name: 'Romans', chapters: 16 },
  { id: 46, name: '1 Corinthians', chapters: 16 },
  { id: 47, name: '2 Corinthians', chapters: 13 },
  { id: 48, name: 'Galatians', chapters: 6 },
  { id: 49, name: 'Ephesians', chapters: 6 },
  { id: 50, name: 'Philippians', chapters: 4 },
  { id: 51, name: 'Colossians', chapters: 4 },
  { id: 52, name: '1 Thessalonians', chapters: 5 },
  { id: 53, name: '2 Thessalonians', chapters: 3 },
  { id: 54, name: '1 Timothy', chapters: 6 },
  { id: 55, name: '2 Timothy', chapters: 4 },
  { id: 56, name: 'Titus', chapters: 3 },
  { id: 57, name: 'Philemon', chapters: 1 },
  { id: 58, name: 'Hebrews', chapters: 13 },
  { id: 59, name: 'James', chapters: 5 },
  { id: 60, name: '1 Peter', chapters: 5 },
  { id: 61, name: '2 Peter', chapters: 3 },
  { id: 62, name: '1 John', chapters: 5 },
  { id: 63, name: '2 John', chapters: 1 },
  { id: 64, name: '3 John', chapters: 1 },
  { id: 65, name: 'Jude', chapters: 1 },
  { id: 66, name: 'Revelation', chapters: 22 }
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Luminary/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function downloadBible() {
  console.log('Downloading KJV Bible from bible-api.com...');
  console.log('This will take ~5-10 minutes due to rate limiting.');
  console.log('');
  
  const allVerses = [];
  let totalCount = 0;
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`[${i + 1}/66] Downloading ${book.name}...`);
    
    for (let ch = 1; ch <= book.chapters; ch++) {
      try {
        const url = `https://bible-api.com/${encodeURIComponent(book.name)} ${ch}?translation=kjv`;
        const data = await fetch(url);
        
        if (data.verses) {
          for (const v of data.verses) {
            allVerses.push({
              translation: 'KJV',
              book_id: book.id,
              book: book.name,
              chapter: ch,
              verse: v.verse,
              text: v.text.trim()
            });
          }
          totalCount += data.verses.length;
        }
        
        // Rate limiting: 100ms between requests
        await sleep(100);
        
      } catch (err) {
        console.error(`  ERROR: ${book.name} ${ch} - ${err.message}`);
      }
    }
  }
  
  const output = {
    translation: 'KJV',
    source: 'bible-api.com (public domain)',
    total_verses: allVerses.length,
    books: 66,
    verses: allVerses
  };
  
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);
  console.log('');
  console.log(`✓ Download complete!`);
  console.log(`  Total verses: ${allVerses.length}`);
  console.log(`  File: ${OUTPUT_FILE}`);
  console.log(`  Size: ${fileSize} MB`);
}

downloadBible().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
