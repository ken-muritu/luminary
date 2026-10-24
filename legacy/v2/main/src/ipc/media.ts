import { ipcMain, dialog } from 'electron'
import { z } from 'zod'
import { getDb } from '../database/client'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
  }
  return map[ext] || 'application/octet-stream'
}

const CATEGORY_SCHEMA = z.enum(['backgrounds', 'announcements', 'countdowns', 'video_loops'])

const ImportSchema = z.object({
  filePath: z.string(),
  category: CATEGORY_SCHEMA.default('backgrounds'),
})

const DeleteSchema = z.object({
  id: z.number().int().positive(),
})

function inferCategory(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const basename = path.basename(filePath).toLowerCase()
  
  if (basename.includes('countdown')) return 'countdowns'
  if (basename.includes('announcement') || basename.includes('slide')) return 'announcements'
  if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return 'video_loops'
  return 'backgrounds'
}

async function generateThumbnail(filePath: string): Promise<string | null> {
  try {
    const ext = path.extname(filePath).toLowerCase()
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
    
    if (!isImage) return null
    
    const thumbnailDir = path.join(path.dirname(filePath), '.thumbnails')
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true })
    }
    
    const thumbnailPath = path.join(thumbnailDir, `${path.basename(filePath, ext)}.thumb.jpg`)
    
    await sharp(filePath)
      .resize(320, 180, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)
    
    return thumbnailPath
  } catch (err) {
    console.error('Thumbnail generation failed:', err)
    return null
  }
}

export function registerMediaHandlers(): void {
  ipcMain.handle('media:list', async () => {
    const db = getDb()
    const result = await db.execute('SELECT * FROM media_assets ORDER BY imported_at DESC')
    return { items: result.rows }
  })

  ipcMain.handle('media:import', async (_event, raw: unknown) => {
    const db = getDb()
    const input = ImportSchema.parse(raw)
    const stats = fs.statSync(input.filePath)
    const mimeType = getMimeType(input.filePath)
    const thumbnail = await generateThumbnail(input.filePath)
    
    const result = await db.execute({
      sql: `INSERT INTO media_assets (file_path, file_name, category, mime_type, file_size, tags, thumbnail)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        input.filePath,
        path.basename(input.filePath),
        input.category,
        mimeType,
        stats.size,
        '',
        thumbnail
      ]
    })
    
    const id = Number(result.lastInsertRowid)
    const rowResult = await db.execute({
      sql: 'SELECT * FROM media_assets WHERE id = ?',
      args: [id]
    })
    
    return { success: true, asset: rowResult.rows[0] }
  })

  ipcMain.handle('media:importDialog', async () => {
    const filePaths = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
        { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'webm'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!filePaths || filePaths.length === 0) {
      return { success: false, cancelled: true }
    }
    
    const db = getDb()
    const results = []
    
    for (const filePath of filePaths) {
      const category = inferCategory(filePath)
      const stats = fs.statSync(filePath)
      const mimeType = getMimeType(filePath)
      const thumbnail = await generateThumbnail(filePath)
      
      try {
        const result = await db.execute({
          sql: `INSERT INTO media_assets (file_path, file_name, category, mime_type, file_size, tags, thumbnail)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            filePath,
            path.basename(filePath),
            category,
            mimeType,
            stats.size,
            '',
            thumbnail
          ]
        })
        
        const id = Number(result.lastInsertRowid)
        const rowResult = await db.execute({
          sql: 'SELECT * FROM media_assets WHERE id = ?',
          args: [id]
        })
        
        results.push(rowResult.rows[0])
      } catch (err) {
        console.error('Failed to import:', filePath, err)
      }
    }
    
    return { success: true, items: results }
  })

  ipcMain.handle('media:delete', async (_event, raw: unknown) => {
    const db = getDb()
    const input = DeleteSchema.parse(raw)
    
    // Get thumbnail path first
    const result = await db.execute({
      sql: 'SELECT thumbnail FROM media_assets WHERE id = ?',
      args: [input.id]
    })
    
    const row = result.rows[0] as unknown as { thumbnail: string | null } | undefined
    if (row?.thumbnail && fs.existsSync(row.thumbnail)) {
      fs.unlinkSync(row.thumbnail)
    }
    
    await db.execute({
      sql: 'DELETE FROM media_assets WHERE id = ?',
      args: [input.id]
    })
    
    return { success: true, id: input.id }
  })
}
