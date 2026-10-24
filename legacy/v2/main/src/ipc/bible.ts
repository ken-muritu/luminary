import { ipcMain } from 'electron'
import { z } from 'zod'
import { getDb } from '../database/client'

const SearchSchema = z.object({
  query: z.string().min(1),
  translation: z.string().optional(),
  limit: z.number().int().positive().default(50),
})

const VersePayloadSchema = z.object({
  translation: z.string(),
  bookId: z.number().int(),
  chapter: z.number().int(),
  verse: z.number().int(),
})

const RangePayloadSchema = z.object({
  translation: z.string(),
  bookId: z.number().int(),
  chapter: z.number().int(),
  startVerse: z.number().int(),
  endVerse: z.number().int(),
})

const ChapterPayloadSchema = z.object({
  translation: z.string(),
  bookId: z.number().int(),
  chapter: z.number().int(),
})

const ParseReferenceSchema = z.object({
  reference: z.string(),
  translation: z.string().optional(),
})

export function registerBibleHandlers(): void {
  ipcMain.handle('bible:getTranslations', async () => {
    const db = getDb()
    const result = await db.execute('SELECT * FROM bible_translations ORDER BY name')
    return result.rows
  })

  ipcMain.handle('bible:getBooks', async () => {
    const db = getDb()
    const result = await db.execute('SELECT * FROM bible_books ORDER BY position')
    return result.rows
  })

  ipcMain.handle('bible:getVerse', async (_e, rawPayload: unknown) => {
    const db = getDb()
    const payload = VersePayloadSchema.parse(rawPayload)
    const result = await db.execute({
      sql: `
        SELECT v.*, b.name as book_name
        FROM bible_verses v
        JOIN bible_books b ON v.book_id = b.id
        WHERE v.translation = ? AND v.book_id = ? AND v.chapter = ? AND v.verse = ?
      `,
      args: [payload.translation, payload.bookId, payload.chapter, payload.verse]
    })
    return result.rows[0] || null
  })

  ipcMain.handle('bible:getRange', async (_e, rawPayload: unknown) => {
    const db = getDb()
    const payload = RangePayloadSchema.parse(rawPayload)
    const result = await db.execute({
      sql: `
        SELECT v.*, b.name as book_name
        FROM bible_verses v
        JOIN bible_books b ON v.book_id = b.id
        WHERE v.translation = ? AND v.book_id = ? AND v.chapter = ? AND v.verse >= ? AND v.verse <= ?
        ORDER BY v.verse
      `,
      args: [payload.translation, payload.bookId, payload.chapter, payload.startVerse, payload.endVerse]
    })
    return result.rows
  })

  ipcMain.handle('bible:getChapter', async (_e, rawPayload: unknown) => {
    const db = getDb()
    const payload = ChapterPayloadSchema.parse(rawPayload)
    const result = await db.execute({
      sql: `
        SELECT v.*, b.name as book_name
        FROM bible_verses v
        JOIN bible_books b ON v.book_id = b.id
        WHERE v.translation = ? AND v.book_id = ? AND v.chapter = ?
        ORDER BY v.verse
      `,
      args: [payload.translation, payload.bookId, payload.chapter]
    })
    return result.rows
  })

  ipcMain.handle('bible:search', async (_e, rawPayload: unknown) => {
    const db = getDb()
    const payload = SearchSchema.parse(rawPayload)
    const limit = payload.limit || 50
    const translation = payload.translation

    if (translation) {
      const result = await db.execute({
        sql: `
          SELECT v.*, b.name as book_name, rank
          FROM bible_verses_fts fts
          JOIN bible_verses v ON fts.rowid = v.id
          JOIN bible_books b ON v.book_id = b.id
          WHERE bible_verses_fts MATCH ? AND v.translation = ?
          ORDER BY rank
          LIMIT ?
        `,
        args: [payload.query, translation, limit]
      })
      return {
        results: result.rows.map((row: any) => ({
          reference: `${row.book_name} ${row.chapter}:${row.verse}`,
          text: row.text as string,
          translation: row.translation as string,
          rank: Number(row.rank ?? 0),
        })),
      }
    } else {
      const result = await db.execute({
        sql: `
          SELECT v.*, b.name as book_name, rank
          FROM bible_verses_fts fts
          JOIN bible_verses v ON fts.rowid = v.id
          JOIN bible_books b ON v.book_id = b.id
          WHERE bible_verses_fts MATCH ?
          ORDER BY rank
          LIMIT ?
        `,
        args: [payload.query, limit]
      })
      return {
        results: result.rows.map((row: any) => ({
          reference: `${row.book_name} ${row.chapter}:${row.verse}`,
          text: row.text as string,
          translation: row.translation as string,
          rank: Number(row.rank ?? 0),
        })),
      }
    }
  })

  ipcMain.handle('bible:parseReference', async (_e, rawPayload: unknown) => {
    const payload = ParseReferenceSchema.parse(rawPayload)
    const translation = payload.translation || 'KJV'

    const parsed = parseBibleReference(payload.reference)
    if (!parsed) return { success: false, error: 'Could not parse reference' }

    const db = getDb()
    const bookResult = await db.execute({
      sql: 'SELECT * FROM bible_books WHERE name = ? OR short_name = ? COLLATE NOCASE',
      args: [parsed.book, parsed.book]
    })
    const book = bookResult.rows[0] as unknown as { id: number; name: string } | undefined

    if (!book) return { success: false, error: 'Book not found' }

    let verses: unknown[] = []

    if (parsed.endVerse) {
      const result = await db.execute({
        sql: `
          SELECT v.*, b.name as book_name
          FROM bible_verses v
          JOIN bible_books b ON v.book_id = b.id
          WHERE v.translation = ? AND v.book_id = ? AND v.chapter = ? AND v.verse >= ? AND v.verse <= ?
          ORDER BY v.verse
        `,
        args: [translation, book.id, parsed.chapter, parsed.startVerse, parsed.endVerse]
      })
      verses = result.rows
    } else {
      const result = await db.execute({
        sql: `
          SELECT v.*, b.name as book_name
          FROM bible_verses v
          JOIN bible_books b ON v.book_id = b.id
          WHERE v.translation = ? AND v.book_id = ? AND v.chapter = ? AND v.verse = ?
        `,
        args: [translation, book.id, parsed.chapter, parsed.startVerse]
      })
      verses = result.rows
    }

    return {
      success: true,
      book: book.name,
      chapter: parsed.chapter,
      verses,
      formatted: `${book.name} ${parsed.chapter}:${parsed.startVerse}${parsed.endVerse ? `-${parsed.endVerse}` : ''}`
    }
  })
}

interface ParsedReference {
  book: string
  chapter: number
  startVerse: number
  endVerse?: number
}

function parseBibleReference(ref: string): ParsedReference | null {
  const patterns = [
    /^(\d?\s*\w+)\s+(\d+):(\d+)(?:-(\d+))?$/,
    /^(\d?\s*\w+)\s+(\d+)\s+(\d+)(?:-(\d+))?$/,
    /^(\w+)\s+(\d+):(\d+)(?:-(\d+))?$/,
  ]

  for (const pattern of patterns) {
    const match = ref.trim().match(pattern)
    if (match) {
      const book = match[1].trim()
      const chapter = parseInt(match[2])
      const startVerse = parseInt(match[3])
      const endVerse = match[4] ? parseInt(match[4]) : undefined

      if (chapter > 0 && startVerse > 0) {
        return { book, chapter, startVerse, endVerse }
      }
    }
  }

  return null
}
