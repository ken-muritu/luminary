const fs = require('fs');
const https = require('https');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../apps/main/assets/bible');

// Bible book names and IDs (canonical order)
const books = [
  { id: 1, name: 'Genesis', testament: 'old', chapters: 50 },
  { id: 2, name: 'Exodus', testament: 'old', chapters: 40 },
  { id: 3, name: 'Leviticus', testament: 'old', chapters: 27 },
  { id: 4, name: 'Numbers', testament: 'old', chapters: 36 },
  { id: 5, name: 'Deuteronomy', testament: 'old', chapters: 34 },
  { id: 6, name: 'Joshua', testament: 'old', chapters: 24 },
  { id: 7, name: 'Judges', testament: 'old', chapters: 21 },
  { id: 8, name: 'Ruth', testament: 'old', chapters: 4 },
  { id: 9, name: '1 Samuel', testament: 'old', chapters: 31 },
  { id: 10, name: '2 Samuel', testament: 'old', chapters: 24 },
  { id: 11, name: '1 Kings', testament: 'old', chapters: 22 },
  { id: 12, name: '2 Kings', testament: 'old', chapters: 25 },
  { id: 13, name: '1 Chronicles', testament: 'old', chapters: 29 },
  { id: 14, name: '2 Chronicles', testament: 'old', chapters: 36 },
  { id: 15, name: 'Ezra', testament: 'old', chapters: 10 },
  { id: 16, name: 'Nehemiah', testament: 'old', chapters: 13 },
  { id: 17, name: 'Esther', testament: 'old', chapters: 10 },
  { id: 18, name: 'Job', testament: 'old', chapters: 42 },
  { id: 19, name: 'Psalms', testament: 'old', chapters: 150 },
  { id: 20, name: 'Proverbs', testament: 'old', chapters: 31 },
  { id: 21, name: 'Ecclesiastes', testament: 'old', chapters: 12 },
  { id: 22, name: 'Song of Solomon', testament: 'old', chapters: 8 },
  { id: 23, name: 'Isaiah', testament: 'old', chapters: 66 },
  { id: 24, name: 'Jeremiah', testament: 'old', chapters: 52 },
  { id: 25, name: 'Lamentations', testament: 'old', chapters: 5 },
  { id: 26, name: 'Ezekiel', testament: 'old', chapters: 48 },
  { id: 27, name: 'Daniel', testament: 'old', chapters: 12 },
  { id: 28, name: 'Hosea', testament: 'old', chapters: 14 },
  { id: 29, name: 'Joel', testament: 'old', chapters: 3 },
  { id: 30, name: 'Amos', testament: 'old', chapters: 9 },
  { id: 31, name: 'Obadiah', testament: 'old', chapters: 1 },
  { id: 32, name: 'Jonah', testament: 'old', chapters: 4 },
  { id: 33, name: 'Micah', testament: 'old', chapters: 7 },
  { id: 34, name: 'Nahum', testament: 'old', chapters: 3 },
  { id: 35, name: 'Habakkuk', testament: 'old', chapters: 3 },
  { id: 36, name: 'Zephaniah', testament: 'old', chapters: 3 },
  { id: 37, name: 'Haggai', testament: 'old', chapters: 2 },
  { id: 38, name: 'Zechariah', testament: 'old', chapters: 14 },
  { id: 39, name: 'Malachi', testament: 'old', chapters: 3 },
  { id: 40, name: 'Matthew', testament: 'new', chapters: 28 },
  { id: 41, name: 'Mark', testament: 'new', chapters: 16 },
  { id: 42, name: 'Luke', testament: 'new', chapters: 24 },
  { id: 43, name: 'John', testament: 'new', chapters: 21 },
  { id: 44, name: 'Acts', testament: 'new', chapters: 28 },
  { id: 45, name: 'Romans', testament: 'new', chapters: 16 },
  { id: 46, name: '1 Corinthians', testament: 'new', chapters: 16 },
  { id: 47, name: '2 Corinthians', testament: 'new', chapters: 13 },
  { id: 48, name: 'Galatians', testament: 'new', chapters: 6 },
  { id: 49, name: 'Ephesians', testament: 'new', chapters: 6 },
  { id: 50, name: 'Philippians', testament: 'new', chapters: 4 },
  { id: 51, name: 'Colossians', testament: 'new', chapters: 4 },
  { id: 52, name: '1 Thessalonians', testament: 'new', chapters: 5 },
  { id: 53, name: '2 Thessalonians', testament: 'new', chapters: 3 },
  { id: 54, name: '1 Timothy', testament: 'new', chapters: 6 },
  { id: 55, name: '2 Timothy', testament: 'new', chapters: 4 },
  { id: 56, name: 'Titus', testament: 'new', chapters: 3 },
  { id: 57, name: 'Philemon', testament: 'new', chapters: 1 },
  { id: 58, name: 'Hebrews', testament: 'new', chapters: 13 },
  { id: 59, name: 'James', testament: 'new', chapters: 5 },
  { id: 60, name: '1 Peter', testament: 'new', chapters: 5 },
  { id: 61, name: '2 Peter', testament: 'new', chapters: 3 },
  { id: 62, name: '1 John', testament: 'new', chapters: 5 },
  { id: 63, name: '2 John', testament: 'new', chapters: 1 },
  { id: 64, name: '3 John', testament: 'new', chapters: 1 },
  { id: 65, name: 'Jude', testament: 'new', chapters: 1 },
  { id: 66, name: 'Revelation', testament: 'new', chapters: 22 }
];

// Sample verses for each book (first chapter, first verse as placeholder)
// In production, this would be complete KJV data
function generateSampleVerses() {
  const verses = [];
  
  // Genesis 1:1-5
  verses.push(
    { translation: 'KJV', book_id: 1, book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
    { translation: 'KJV', book_id: 1, book: 'Genesis', chapter: 1, verse: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
    { translation: 'KJV', book_id: 1, book: 'Genesis', chapter: 1, verse: 3, text: 'And God said, Let there be light: and there was light.' },
    { translation: 'KJV', book_id: 1, book: 'Genesis', chapter: 1, verse: 4, text: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
    { translation: 'KJV', book_id: 1, book: 'Genesis', chapter: 1, verse: 5, text: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.' }
  );
  
  // Psalm 23
  verses.push(
    { translation: 'KJV', book_id: 19, book: 'Psalms', chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.' },
    { translation: 'KJV', book_id: 19, book: 'Psalms', chapter: 23, verse: 2, text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
    { translation: 'KJV', book_id: 19, book: 'Psalms', chapter: 23, verse: 3, text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
    { translation: 'KJV', book_id: 19, book: 'Psalms', chapter: 23, verse: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
    { translation: 'KJV', book_id: 19, book: 'Psalms', chapter: 23, verse: 5, text: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.' },
    { translation: 'KJV', book_id: 19, book: 'Psalms', chapter: 23, verse: 6, text: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.' }
  );
  
  // John 3:16-18 (already seeded, but included for completeness)
  verses.push(
    { translation: 'KJV', book_id: 43, book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { translation: 'KJV', book_id: 43, book: 'John', chapter: 3, verse: 17, text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.' },
    { translation: 'KJV', book_id: 43, book: 'John', chapter: 3, verse: 18, text: 'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.' }
  );
  
  return verses;
}

// Download full KJV from bible-api.com (free public domain)
async function downloadFullBible() {
  console.log('Downloading full KJV Bible data...');
  
  const verses = [];
  const baseUrl = 'https://bible-api.com';
  
  for (const book of books) {
    console.log(`Downloading ${book.name}...`);
    
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      try {
        const reference = `${encodeURIComponent(book.name)} ${chapter}`;
        const url = `${baseUrl}/${reference}?translation=kjv`;
        
        const data = await fetchJson(url);
        
        if (data.verses) {
          for (const v of data.verses) {
            verses.push({
              translation: 'KJV',
              book_id: book.id,
              book: book.name,
              chapter: chapter,
              verse: v.verse,
              text: v.text.trim()
            });
          }
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 100));
        
      } catch (err) {
        console.error(`Failed to download ${book.name} ${chapter}:`, err.message);
      }
    }
  }
  
  return verses;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Bible Data Download Script');
  console.log('==========================');
  
  // Check if we should download full Bible or create sample
  const useSample = process.argv.includes('--sample');
  
  let verses;
  if (useSample) {
    console.log('Generating sample verses...');
    verses = generateSampleVerses();
  } else {
    verses = await downloadFullBible();
  }
  
  const output = {
    translation: 'KJV',
    source: useSample ? 'sample' : 'bible-api.com',
    total_verses: verses.length,
    books: books.length,
    verses: verses
  };
  
  const outputPath = path.join(OUTPUT_DIR, 'kjv.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\nDone! Saved ${verses.length} verses to ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
