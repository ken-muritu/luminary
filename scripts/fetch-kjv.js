const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../apps/main/assets/bible');

// Book mapping
const books = [
  { id: 1, abbr: 'GEN', name: 'Genesis', chapters: 50 },
  { id: 2, abbr: 'EXO', name: 'Exodus', chapters: 40 },
  { id: 3, abbr: 'LEV', name: 'Leviticus', chapters: 27 },
  { id: 4, abbr: 'NUM', name: 'Numbers', chapters: 36 },
  { id: 5, abbr: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { id: 6, abbr: 'JOS', name: 'Joshua', chapters: 24 },
  { id: 7, abbr: 'JDG', name: 'Judges', chapters: 21 },
  { id: 8, abbr: 'RUT', name: 'Ruth', chapters: 4 },
  { id: 9, abbr: '1SA', name: '1 Samuel', chapters: 31 },
  { id: 10, abbr: '2SA', name: '2 Samuel', chapters: 24 },
  { id: 11, abbr: '1KI', name: '1 Kings', chapters: 22 },
  { id: 12, abbr: '2KI', name: '2 Kings', chapters: 25 },
  { id: 13, abbr: '1CH', name: '1 Chronicles', chapters: 29 },
  { id: 14, abbr: '2CH', name: '2 Chronicles', chapters: 36 },
  { id: 15, abbr: 'EZR', name: 'Ezra', chapters: 10 },
  { id: 16, abbr: 'NEH', name: 'Nehemiah', chapters: 13 },
  { id: 17, abbr: 'EST', name: 'Esther', chapters: 10 },
  { id: 18, abbr: 'JOB', name: 'Job', chapters: 42 },
  { id: 19, abbr: 'PSA', name: 'Psalms', chapters: 150 },
  { id: 20, abbr: 'PRO', name: 'Proverbs', chapters: 31 },
  { id: 21, abbr: 'ECC', name: 'Ecclesiastes', chapters: 12 },
  { id: 22, abbr: 'SNG', name: 'Song of Solomon', chapters: 8 },
  { id: 23, abbr: 'ISA', name: 'Isaiah', chapters: 66 },
  { id: 24, abbr: 'JER', name: 'Jeremiah', chapters: 52 },
  { id: 25, abbr: 'LAM', name: 'Lamentations', chapters: 5 },
  { id: 26, abbr: 'EZK', name: 'Ezekiel', chapters: 48 },
  { id: 27, abbr: 'DAN', name: 'Daniel', chapters: 12 },
  { id: 28, abbr: 'HOS', name: 'Hosea', chapters: 14 },
  { id: 29, abbr: 'JOL', name: 'Joel', chapters: 3 },
  { id: 30, abbr: 'AMO', name: 'Amos', chapters: 9 },
  { id: 31, abbr: 'OBA', name: 'Obadiah', chapters: 1 },
  { id: 32, abbr: 'JON', name: 'Jonah', chapters: 4 },
  { id: 33, abbr: 'MIC', name: 'Micah', chapters: 7 },
  { id: 34, abbr: 'NAM', name: 'Nahum', chapters: 3 },
  { id: 35, abbr: 'HAB', name: 'Habakkuk', chapters: 3 },
  { id: 36, abbr: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { id: 37, abbr: 'HAG', name: 'Haggai', chapters: 2 },
  { id: 38, abbr: 'ZEC', name: 'Zechariah', chapters: 14 },
  { id: 39, abbr: 'MAL', name: 'Malachi', chapters: 3 },
  { id: 40, abbr: 'MAT', name: 'Matthew', chapters: 28 },
  { id: 41, abbr: 'MRK', name: 'Mark', chapters: 16 },
  { id: 42, abbr: 'LUK', name: 'Luke', chapters: 24 },
  { id: 43, abbr: 'JHN', name: 'John', chapters: 21 },
  { id: 44, abbr: 'ACT', name: 'Acts', chapters: 28 },
  { id: 45, abbr: 'ROM', name: 'Romans', chapters: 16 },
  { id: 46, abbr: '1CO', name: '1 Corinthians', chapters: 16 },
  { id: 47, abbr: '2CO', name: '2 Corinthians', chapters: 13 },
  { id: 48, abbr: 'GAL', name: 'Galatians', chapters: 6 },
  { id: 49, abbr: 'EPH', name: 'Ephesians', chapters: 6 },
  { id: 50, abbr: 'PHP', name: 'Philippians', chapters: 4 },
  { id: 51, abbr: 'COL', name: 'Colossians', chapters: 4 },
  { id: 52, abbr: '1TH', name: '1 Thessalonians', chapters: 5 },
  { id: 53, abbr: '2TH', name: '2 Thessalonians', chapters: 3 },
  { id: 54, abbr: '1TI', name: '1 Timothy', chapters: 6 },
  { id: 55, abbr: '2TI', name: '2 Timothy', chapters: 4 },
  { id: 56, abbr: 'TIT', name: 'Titus', chapters: 3 },
  { id: 57, abbr: 'PHM', name: 'Philemon', chapters: 1 },
  { id: 58, abbr: 'HEB', name: 'Hebrews', chapters: 13 },
  { id: 59, abbr: 'JAS', name: 'James', chapters: 5 },
  { id: 60, abbr: '1PE', name: '1 Peter', chapters: 5 },
  { id: 61, abbr: '2PE', name: '2 Peter', chapters: 3 },
  { id: 62, abbr: '1JN', name: '1 John', chapters: 5 },
  { id: 63, abbr: '2JN', name: '2 John', chapters: 1 },
  { id: 64, abbr: '3JN', name: '3 John', chapters: 1 },
  { id: 65, abbr: 'JUD', name: 'Jude', chapters: 1 },
  { id: 66, abbr: 'REV', name: 'Revelation', chapters: 22 }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function downloadBible() {
  console.log('Fetching full KJV Bible data...');
  
  const allVerses = [];
  let totalCount = 0;
  
  // Using Bible API (free, public domain)
  const baseUrl = 'https://bible-api.com';
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`Downloading ${book.name} (${i + 1}/66)...`);
    
    for (let ch = 1; ch <= book.chapters; ch++) {
      try {
        const url = `${baseUrl}/${encodeURIComponent(book.name)} ${ch}?translation=kjv`;
        const data = await fetchJson(url);
        
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
            totalCount++;
          }
        }
        
        // Rate limiting - 100ms between requests
        await new Promise(r => setTimeout(r, 100));
        
      } catch (err) {
        console.error(`  Failed ${book.name} ${ch}: ${err.message}`);
      }
    }
  }
  
  const output = {
    translation: 'KJV',
    source: 'bible-api.com (public domain KJV)',
    total_verses: allVerses.length,
    books: 66,
    verses: allVerses
  };
  
  const outputPath = path.join(OUTPUT_DIR, 'kjv.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  const fileSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Saved ${allVerses.length} verses to kjv.json`);
  console.log(`  File size: ${fileSize} MB`);
  
  if (allVerses.length < 30000) {
    console.warn(`  ⚠️ Warning: Expected ~31,102 verses, got ${allVerses.length}`);
    console.warn(`  Some chapters may have failed to download.`);
  }
}

downloadBible().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
