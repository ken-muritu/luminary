import { ipcMain } from 'electron'
import { z } from 'zod'
import { getDb } from '../database/client'

const SetlistItemSchema = z.object({
  type:       z.enum(['song', 'verse', 'media', 'timer', 'announcement', 'blank']),
  title:      z.string().default(''),
  subtitle:   z.string().default(''),
  song_id:    z.number().int().nullable().optional(),
  verse_ref:  z.string().nullable().optional(),
  translation:z.string().nullable().optional(),
  media_path: z.string().nullable().optional(),
  duration_s: z.number().int().nullable().optional(),
  position:   z.number().int().default(0),
})

const CreateSetlistSchema = z.object({
  name:         z.string().min(1),
  service_date: z.string().nullable().optional(),
  is_template:  z.boolean().optional().default(false),
  notes:        z.string().optional().default(''),
  items:        z.array(SetlistItemSchema).optional().default([]),
})

const UpdateSetlistSchema = CreateSetlistSchema.partial().extend({
  id: z.number().int().positive(),
})

interface SetlistRow {
  id: number
  name: string
  service_date: string | null
  is_template: number
  notes: string
  created_at: string
  updated_at: string
}

interface SetlistItemRow {
  id: number
  setlist_id: number
  type: string
  title: string
  subtitle: string
  song_id: number | null
  verse_ref: string | null
  translation: string | null
  media_path: string | null
  duration_s: number | null
  position: number
  created_at: string
}

function rowToSetlist(row: SetlistRow, items: SetlistItemRow[]) {
  return {
    id:          row.id,
    name:        row.name,
    serviceDate: row.service_date,
    isTemplate:  Boolean(row.is_template),
    notes:       row.notes,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
    items:       items.map((i) => ({
      id:          i.id,
      setlistId:   i.setlist_id,
      type:        i.type,
      title:       i.title,
      subtitle:    i.subtitle,
      songId:      i.song_id,
      verseRef:    i.verse_ref,
      translation: i.translation,
      mediaPath:   i.media_path,
      durationS:   i.duration_s,
      position:    i.position,
    })),
  }
}

async function getItems(db: ReturnType<typeof getDb>, setlistId: number): Promise<SetlistItemRow[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM setlist_items WHERE setlist_id = ? ORDER BY position ASC',
    args: [setlistId]
  })
  return result.rows as unknown as SetlistItemRow[]
}

export function registerSetlistHandlers(): void {
  ipcMain.handle('setlists:getAll', async () => {
    const db = getDb()
    const result = await db.execute('SELECT * FROM setlists ORDER BY updated_at DESC')
    const rows = result.rows as unknown as SetlistRow[]
    const setlists = await Promise.all(
      rows.map(async (r) => rowToSetlist(r, await getItems(db, r.id)))
    )
    return setlists
  })

  ipcMain.handle('setlists:getById', async (_e, rawId: unknown) => {
    const db = getDb()
    const id = z.number().int().positive().parse(rawId)
    const result = await db.execute({
      sql: 'SELECT * FROM setlists WHERE id = ?',
      args: [id]
    })
    const row = result.rows[0] as unknown as SetlistRow | undefined
    if (!row) return null
    return rowToSetlist(row, await getItems(db, row.id))
  })

  ipcMain.handle('setlists:create', async (_e, raw: unknown) => {
    const db = getDb()
    const input = CreateSetlistSchema.parse(raw)
    const now = new Date().toISOString()

    const setlistResult = await db.execute({
      sql: `INSERT INTO setlists (name, service_date, is_template, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [input.name, input.service_date ?? null, input.is_template ? 1 : 0, input.notes, now, now]
    })
    const id = Number(setlistResult.lastInsertRowid)

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]
      await db.execute({
        sql: `INSERT INTO setlist_items (setlist_id, type, title, subtitle, song_id, verse_ref, translation, media_path, duration_s, position)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, item.type, item.title, item.subtitle, item.song_id ?? null, item.verse_ref ?? null,
               item.translation ?? null, item.media_path ?? null, item.duration_s ?? null, item.position ?? i]
      })
    }

    const result = await db.execute({ sql: 'SELECT * FROM setlists WHERE id = ?', args: [id] })
    return rowToSetlist(result.rows[0] as unknown as SetlistRow, await getItems(db, id))
  })

  ipcMain.handle('setlists:update', async (_e, raw: unknown) => {
    const db = getDb()
    const input = UpdateSetlistSchema.parse(raw)
    const { id, items, ...fields } = input
    const now = new Date().toISOString()

    const updates: string[] = []
    const args: unknown[] = []
    if (fields.name !== undefined) { updates.push('name = ?'); args.push(fields.name) }
    if (fields.service_date !== undefined) { updates.push('service_date = ?'); args.push(fields.service_date ?? null) }
    if (fields.is_template !== undefined) { updates.push('is_template = ?'); args.push(fields.is_template ? 1 : 0) }
    if (fields.notes !== undefined) { updates.push('notes = ?'); args.push(fields.notes) }

    if (updates.length > 0) {
      args.push(now, id)
      await db.execute({
        sql: `UPDATE setlists SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
        args: args as (string | number | null)[]
      })
    }

    if (items !== undefined) {
      await db.execute({ sql: 'DELETE FROM setlist_items WHERE setlist_id = ?', args: [id] })
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        await db.execute({
          sql: `INSERT INTO setlist_items (setlist_id, type, title, subtitle, song_id, verse_ref, translation, media_path, duration_s, position)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, item.type, item.title, item.subtitle, item.song_id ?? null, item.verse_ref ?? null,
                 item.translation ?? null, item.media_path ?? null, item.duration_s ?? null, item.position ?? i]
        })
      }
    }

    const result = await db.execute({ sql: 'SELECT * FROM setlists WHERE id = ?', args: [id] })
    return rowToSetlist(result.rows[0] as unknown as SetlistRow, await getItems(db, id))
  })

  ipcMain.handle('setlists:delete', async (_e, rawId: unknown) => {
    const db = getDb()
    const id = z.number().int().positive().parse(rawId)
    await db.execute({ sql: 'DELETE FROM setlists WHERE id = ?', args: [id] })
    return { success: true, id }
  })

  ipcMain.handle('setlists:addItem', async (_e, raw: unknown) => {
    const db = getDb()
    const input = SetlistItemSchema.extend({ setlist_id: z.number().int().positive() }).parse(raw)
    const result = await db.execute({
      sql: `INSERT INTO setlist_items (setlist_id, type, title, subtitle, song_id, verse_ref, translation, media_path, duration_s, position)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [input.setlist_id, input.type, input.title, input.subtitle, input.song_id ?? null,
             input.verse_ref ?? null, input.translation ?? null, input.media_path ?? null,
             input.duration_s ?? null, input.position]
    })
    const itemResult = await db.execute({
      sql: 'SELECT * FROM setlist_items WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    })
    return itemResult.rows[0]
  })

  ipcMain.handle('setlists:removeItem', async (_e, rawId: unknown) => {
    const db = getDb()
    const id = z.number().int().positive().parse(rawId)
    await db.execute({ sql: 'DELETE FROM setlist_items WHERE id = ?', args: [id] })
    return { success: true, id }
  })

  ipcMain.handle('setlists:reorderItems', async (_e, raw: unknown) => {
    const db = getDb()
    const input = z.array(z.object({ id: z.number().int(), position: z.number().int() })).parse(raw)
    for (const item of input) {
      await db.execute({
        sql: 'UPDATE setlist_items SET position = ? WHERE id = ?',
        args: [item.position, item.id]
      })
    }
    return { success: true }
  })
}
