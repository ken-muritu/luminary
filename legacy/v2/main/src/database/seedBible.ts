import { getDb } from './client'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Client } from '@libsql/client'

interface BibleVerseRow {
  translation: string
  book_id: number
  book: string
  chapter: number
  verse: number
  text: string
}

interface TranslationFile {
  translation: string
  verses: BibleVerseRow[]
}

const TARGET_TRANSLATIONS = ['KJV', 'NKJV', 'NLT', 'AMP'] as const
const FULL_BIBLE_MIN_VERSES = 28_000

const MINIMAL_BY_TRANSLATION: Record<string, { b: number; c: number; v: number; text: string }[]> = {
  KJV: [
    { b: 43, c: 3, v: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  ],
  NKJV: [
    { b: 43, c: 3, v: 16, text: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.' },
  ],
  NLT: [
    { b: 43, c: 3, v: 16, text: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.' },
  ],
  AMP: [
    { b: 43, c: 3, v: 16, text: 'For God so [greatly] loved and dearly prized the world, that He [even] gave His [One and] only begotten Son, so that whoever believes and trusts in Him [as Savior] shall not perish, but have eternal life.' },
  ],
}

function assetsDir(): string {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), 'apps/main/assets/bible')
  }
  return path.join(__dirname, '../../assets/bible')
}

export async function seedBibleIfEmpty(): Promise<void> {
  const db = getDb()

  for (const code of TARGET_TRANSLATIONS) {
    await seedTranslation(db, code)
  }
}

async function seedTranslation(db: Client, code: string): Promise<void> {
  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM bible_verses WHERE translation = ?',
    args: [code],
  })
  const existing = Number((countResult.rows[0] as unknown as { count: number }).count)

  if (existing >= FULL_BIBLE_MIN_VERSES) {
    console.log(`[Bible] ${code} complete (${existing} verses)`)
    return
  }

  if (existing === 0) {
    const minimal = MINIMAL_BY_TRANSLATION[code] ?? []
    for (const v of minimal) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO bible_verses (translation, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)',
        args: [code, v.b, v.c, v.v, v.text],
      })
    }
    console.log(`[Bible] ${code} minimal seed (${minimal.length} verses)`)
  }

  const filePath = path.join(assetsDir(), `${code.toLowerCase()}.json`)
  if (!fs.existsSync(filePath)) {
    console.log(`[Bible] ${code} — no ${code.toLowerCase()}.json; run: npm run bible:download -- ${code}`)
    return
  }

  if (existing < FULL_BIBLE_MIN_VERSES) {
    console.log(`[Bible] ${code} partial (${existing} verses) — replacing with full import…`)
    await db.execute({ sql: 'DELETE FROM bible_verses WHERE translation = ?', args: [code] })
  }

  await importTranslationFile(db, code, filePath)
}

async function importTranslationFile(db: Client, code: string, filePath: string): Promise<void> {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TranslationFile
    if (!Array.isArray(data.verses)) {
      console.error(`[Bible] ${code} invalid JSON format`)
      return
    }

    console.log(`[Bible] Importing ${code} (${data.verses.length} verses)…`)
    const chunkSize = 500
    const insertSql = 'INSERT OR IGNORE INTO bible_verses (translation, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)'
    for (let i = 0; i < data.verses.length; i += chunkSize) {
      const chunk = data.verses.slice(i, i + chunkSize)
      const statements = chunk.map((v) => ({
        sql: insertSql,
        args: [v.translation || code, v.book_id, v.chapter, v.verse, v.text] as (string | number)[],
      }))
      await db.batch(statements, 'write')
      if (i % 5000 === 0 && i > 0) {
        console.log(`[Bible] ${code}: ${i + chunk.length}/${data.verses.length}`)
      }
    }
    console.log(`[Bible] ${code} import complete`)
  } catch (err) {
    console.error(`[Bible] Failed to import ${code}:`, err)
  }
}
