#!/usr/bin/env node
/**
 * Download full Bible JSON for Luminary: KJV, NKJV, NLT, AMP
 * KJV  — scrollmapper/bible_databases (public domain)
 * NKJV/NLT/AMP — bolls.life API (chapter fetch; for development/licensing review in production)
 */
const fs = require('fs')
const https = require('https')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, '../apps/main/assets/bible')
const SCROLLMAPPER_KJV =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/KJV.json'

const BOOKS = [
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
  { id: 66, name: 'Revelation', chapters: 22 },
]

const NAME_TO_ID = Object.fromEntries(BOOKS.map((b) => [b.name, b.id]))

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Luminary-Bible-Downloader/1.0' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchJson(res.headers.location).then(resolve).catch(reject)
        }
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      })
      .on('error', reject)
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function stripHtml(text) {
  return String(text)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const ROMAN_BOOK_ALIASES = {
  'I Samuel': '1 Samuel',
  'II Samuel': '2 Samuel',
  'I Kings': '1 Kings',
  'II Kings': '2 Kings',
  'I Chronicles': '1 Chronicles',
  'II Chronicles': '2 Chronicles',
  'I Corinthians': '1 Corinthians',
  'II Corinthians': '2 Corinthians',
  'I Thessalonians': '1 Thessalonians',
  'II Thessalonians': '2 Thessalonians',
  'I Timothy': '1 Timothy',
  'II Timothy': '2 Timothy',
  'I Peter': '1 Peter',
  'II Peter': '2 Peter',
  'I John': '1 John',
  'II John': '2 John',
  'III John': '3 John',
  'Revelation of John': 'Revelation',
  'Revelation of St. John the Divine': 'Revelation',
  'Song of Solomon': 'Song of Solomon',
}

function convertScrollmapper(data, translation) {
  const verses = []
  for (const book of data.books || []) {
    const bookName = ROMAN_BOOK_ALIASES[book.name] ?? book.name
    const bookId = NAME_TO_ID[bookName]
    if (!bookId) {
      console.warn(`  Unknown book: ${book.name}`)
      continue
    }
    book.chapters.forEach((chapter, idx) => {
      const chapterNum = idx + 1
      for (const v of chapter.verses || []) {
        verses.push({
          translation,
          book_id: bookId,
          book: bookName,
          chapter: chapterNum,
          verse: v.verse,
          text: stripHtml(v.text),
        })
      }
    })
  }
  return verses
}

async function downloadKJV() {
  console.log('\n[KJV] Downloading from scrollmapper…')
  const data = await fetchJson(SCROLLMAPPER_KJV)
  const verses = convertScrollmapper(data, 'KJV')
  return writeTranslation('kjv.json', 'KJV', 'scrollmapper/bible_databases', verses)
}

async function downloadBollsTranslation(code) {
  console.log(`\n[${code}] Downloading from bolls.life (this takes several minutes)…`)
  const verses = []
  for (const book of BOOKS) {
    process.stdout.write(`  ${book.name}… `)
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const url = `https://bolls.life/get-text/${code}/${book.id}/${chapter}/`
      try {
        const rows = await fetchJson(url)
        for (const row of rows) {
          verses.push({
            translation: code,
            book_id: book.id,
            book: book.name,
            chapter,
            verse: row.verse,
            text: stripHtml(row.text),
          })
        }
      } catch (err) {
        console.error(`\n    Failed ${book.name} ${chapter}: ${err.message}`)
      }
      await sleep(80)
    }
    console.log('done')
  }
  return writeTranslation(`${code.toLowerCase()}.json`, code, 'bolls.life', verses)
}

function writeTranslation(filename, translation, source, verses) {
  const output = {
    translation,
    source,
    total_verses: verses.length,
    books: 66,
    verses,
  }
  const outPath = path.join(OUTPUT_DIR, filename)
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(output))
  const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2)
  console.log(`  ✓ ${translation}: ${verses.length} verses → ${outPath} (${mb} MB)`)
  return verses.length
}

async function main() {
  const only = process.argv.slice(2).map((s) => s.toUpperCase())
  const targets = only.length ? only : ['KJV', 'NKJV', 'NLT', 'AMP']

  console.log('Luminary Bible Downloader')
  console.log('Translations:', targets.join(', '))

  for (const code of targets) {
    if (code === 'KJV') await downloadKJV()
    else if (['NKJV', 'NLT', 'AMP'].includes(code)) await downloadBollsTranslation(code)
    else console.warn(`Unknown translation: ${code}`)
  }

  console.log('\nDone. Restart Luminary or run migrations to seed the database.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
