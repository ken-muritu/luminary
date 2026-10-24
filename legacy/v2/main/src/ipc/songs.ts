import { ipcMain } from 'electron'
import { z } from 'zod'
import { getDb } from '../database/client'

const SectionSchema = z.object({
  id:       z.number().int().optional(),
  type:     z.enum(['verse','chorus','bridge','pre_chorus','tag','outro','instrumental']).default('verse'),
  label:    z.string().max(100).default('Verse 1'),
  lyrics:   z.string().default(''),
  position: z.number().int().min(0).default(0),
})

const SongCreateSchema = z.object({
  title:        z.string().min(1).max(500),
  artist:       z.string().max(200).default(''),
  album:        z.string().max(200).default(''),
  keySig:       z.string().max(10).default(''),
  bpm:          z.number().int().min(20).max(300).nullable().default(null),
  ccliNumber:   z.string().max(20).default(''),
  copyright:    z.string().max(300).default(''),
  year:         z.number().int().min(1800).max(2100).nullable().default(null),
  licenseType:  z.enum(['public_domain','ccli','custom']).default('ccli'),
  sections:     z.array(SectionSchema).default([]),
})

const SongUpdateSchema = SongCreateSchema.partial().extend({ id: z.number().int() })

export function registerSongHandlers(): void {
  ipcMain.handle('songs:getAll', async () => {
    const db = getDb()
    const result = await db.execute(`
      SELECT s.*, GROUP_CONCAT(ss.id || '|' || ss.type || '|' || ss.label || '|' || ss.lyrics || '|' || ss.position, '§')
        AS sections_raw
      FROM songs s
      LEFT JOIN song_sections ss ON ss.song_id = s.id
      GROUP BY s.id
      ORDER BY s.title COLLATE NOCASE ASC
    `)
    return result.rows.map(parseSongRow)
  })

  ipcMain.handle('songs:getById', async (_e, rawId: unknown) => {
    const db = getDb()
    const id = z.number().int().parse(rawId)
    const result = await db.execute({
      sql: `
        SELECT s.*, GROUP_CONCAT(ss.id || '|' || ss.type || '|' || ss.label || '|' || ss.lyrics || '|' || ss.position, '§')
          AS sections_raw
        FROM songs s
        LEFT JOIN song_sections ss ON ss.song_id = s.id
        WHERE s.id = ?
        GROUP BY s.id
      `,
      args: [id]
    })
    if (result.rows.length === 0) return null
    return parseSongRow(result.rows[0])
  })

  ipcMain.handle('songs:create', async (_e, rawInput: unknown) => {
    const db = getDb()
    const data = SongCreateSchema.parse(rawInput)
    
    // Insert song
    const songResult = await db.execute({
      sql: `INSERT INTO songs (title, artist, album, key_sig, bpm, ccli_number, copyright, year, license_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [data.title, data.artist, data.album, data.keySig, data.bpm, data.ccliNumber, data.copyright, data.year, data.licenseType]
    })
    const songId = Number(songResult.lastInsertRowid)
    
    // Insert sections
    const sections = data.sections.length > 0 ? data.sections : [{ type: 'verse', label: 'Verse 1', lyrics: '', position: 0 }]
    for (const sec of sections) {
      await db.execute({
        sql: `INSERT INTO song_sections (song_id, type, label, lyrics, position) VALUES (?, ?, ?, ?, ?)`,
        args: [songId, sec.type, sec.label, sec.lyrics, sec.position]
      })
    }

    // Fetch created song
    const result = await db.execute({
      sql: `
        SELECT s.*, GROUP_CONCAT(ss.id || '|' || ss.type || '|' || ss.label || '|' || ss.lyrics || '|' || ss.position, '§')
          AS sections_raw
        FROM songs s
        LEFT JOIN song_sections ss ON ss.song_id = s.id
        WHERE s.id = ?
        GROUP BY s.id
      `,
      args: [songId]
    })
    return parseSongRow(result.rows[0])
  })

  ipcMain.handle('songs:update', async (_e, rawInput: unknown) => {
    const db = getDb()
    const data = SongUpdateSchema.parse(rawInput)
    const { id, sections, ...fields } = data

    // Build dynamic update
    const updates: string[] = []
    const args: unknown[] = []
    if (fields.title !== undefined) { updates.push('title = ?'); args.push(fields.title) }
    if (fields.artist !== undefined) { updates.push('artist = ?'); args.push(fields.artist) }
    if (fields.album !== undefined) { updates.push('album = ?'); args.push(fields.album) }
    if (fields.keySig !== undefined) { updates.push('key_sig = ?'); args.push(fields.keySig) }
    if (fields.bpm !== undefined) { updates.push('bpm = ?'); args.push(fields.bpm) }
    if (fields.ccliNumber !== undefined) { updates.push('ccli_number = ?'); args.push(fields.ccliNumber) }
    if (fields.copyright !== undefined) { updates.push('copyright = ?'); args.push(fields.copyright) }
    if (fields.year !== undefined) { updates.push('year = ?'); args.push(fields.year) }
    if (fields.licenseType !== undefined) { updates.push('license_type = ?'); args.push(fields.licenseType) }
    
    if (updates.length > 0) {
      args.push(id)
      await db.execute({
        sql: `UPDATE songs SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`,
        args: args as (string | number | null)[]
      })
    }

    // Update sections if provided
    if (sections !== undefined) {
      await db.execute({ sql: 'DELETE FROM song_sections WHERE song_id = ?', args: [id] })
      for (const sec of sections) {
        await db.execute({
          sql: `INSERT INTO song_sections (song_id, type, label, lyrics, position) VALUES (?, ?, ?, ?, ?)`,
          args: [id, sec.type, sec.label, sec.lyrics, sec.position]
        })
      }
    }

    // Fetch updated song
    const result = await db.execute({
      sql: `
        SELECT s.*, GROUP_CONCAT(ss.id || '|' || ss.type || '|' || ss.label || '|' || ss.lyrics || '|' || ss.position, '§')
          AS sections_raw
        FROM songs s
        LEFT JOIN song_sections ss ON ss.song_id = s.id
        WHERE s.id = ?
        GROUP BY s.id
      `,
      args: [id]
    })
    return parseSongRow(result.rows[0])
  })

  ipcMain.handle('songs:delete', async (_e, rawId: unknown) => {
    const db = getDb()
    const id = z.number().int().parse(rawId)
    await db.execute({ sql: 'DELETE FROM songs WHERE id = ?', args: [id] })
    return { success: true, id }
  })

  ipcMain.handle('songs:search', async (_e, rawQuery: unknown) => {
    const db = getDb()
    const query = z.string().parse(rawQuery)
    if (!query.trim()) {
      const result = await db.execute('SELECT * FROM songs ORDER BY title COLLATE NOCASE LIMIT 200')
      return result.rows
    }
    const like = `%${query}%`
    const result = await db.execute({
      sql: `SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? OR ccli_number LIKE ? ORDER BY title COLLATE NOCASE LIMIT 200`,
      args: [like, like, like]
    })
    return result.rows
  })
}

function parseSongRow(row: any) {
  const sections = row.sections_raw
    ? row.sections_raw.split('§').map((s: string) => {
        const [id, type, label, lyrics, position] = s.split('|')
        return { id: Number(id), type, label, lyrics, position: Number(position) }
      }).sort((a: any, b: any) => a.position - b.position)
    : []

  return {
    id:          row.id,
    title:       row.title,
    artist:      row.artist,
    album:       row.album,
    keySig:      row.key_sig,
    bpm:         row.bpm,
    ccliNumber:  row.ccli_number,
    copyright:   row.copyright,
    year:        row.year,
    licenseType: row.license_type,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
    sections,
  }
}
