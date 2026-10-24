import { ipcMain } from 'electron'
import { z } from 'zod'
import { getDb } from '../database/client'

const UsageLogSchema = z.object({
  song_id: z.number().int().nullable().optional(),
  song_title: z.string(),
  ccli_number: z.string().nullable().optional(),
  service_date: z.string().optional(),
})

export function registerReportHandlers(): void {
  ipcMain.handle('reports:getUsageLog', async (_e, raw: unknown) => {
    const db = getDb()
    const { days } = z.object({ days: z.number().int().positive().default(30) }).parse(raw ?? {})
    const result = await db.execute({
      sql: `SELECT * FROM song_usage_log
            WHERE service_date >= date('now', '-' || ? || ' days')
            ORDER BY logged_at DESC`,
      args: [days]
    })
    return { rows: result.rows }
  })

  ipcMain.handle('reports:logSongUsage', async (_e, raw: unknown) => {
    const db = getDb()
    const data = UsageLogSchema.parse(raw)
    const now = new Date().toISOString()
    const serviceDate = data.service_date || now.split('T')[0]

    await db.execute({
      sql: `INSERT INTO song_usage_log (song_id, song_title, ccli_number, service_date)
            VALUES (?, ?, ?, ?)`,
      args: [data.song_id ?? null, data.song_title, data.ccli_number ?? null, serviceDate]
    })
    return { success: true }
  })

  ipcMain.handle('reports:getTopSongs', async (_e, raw: unknown) => {
    const db = getDb()
    const { days, limit } = z.object({
      days: z.number().int().positive().default(30),
      limit: z.number().int().positive().default(20),
    }).parse(raw ?? {})

    const result = await db.execute({
      sql: `SELECT
              song_title,
              ccli_number,
              COUNT(*) as count,
              MAX(service_date) as last_projected
            FROM song_usage_log
            WHERE service_date >= date('now', '-' || ? || ' days')
            GROUP BY song_title
            ORDER BY count DESC
            LIMIT ?`,
      args: [days, limit]
    })
    return { rows: result.rows }
  })

  ipcMain.handle('reports:getMonthlyTotals', async (_e, raw: unknown) => {
    const db = getDb()
    const { months } = z.object({ months: z.number().int().positive().default(12) }).parse(raw ?? {})

    const result = await db.execute({
      sql: `SELECT
              strftime('%Y-%m', service_date) as month,
              COUNT(*) as count
            FROM song_usage_log
            WHERE service_date >= date('now', '-' || ? || ' months')
            GROUP BY month
            ORDER BY month DESC`,
      args: [months]
    })
    return { rows: result.rows }
  })

  ipcMain.handle('reports:getSummary', async (_e, raw: unknown) => {
    const db = getDb()
    const { days } = z.object({ days: z.number().int().positive().default(30) }).parse(raw ?? {})

    const totalResult = await db.execute({
      sql: `SELECT COUNT(*) as n FROM song_usage_log
            WHERE service_date >= date('now', '-' || ? || ' days')`,
      args: [days]
    })

    const uniqueResult = await db.execute({
      sql: `SELECT COUNT(DISTINCT song_title) as n FROM song_usage_log
            WHERE service_date >= date('now', '-' || ? || ' days')`,
      args: [days]
    })

    const missingResult = await db.execute(
      'SELECT COUNT(*) as n FROM songs WHERE ccli_number = "" OR ccli_number IS NULL'
    )

    return {
      total: Number((totalResult.rows[0] as unknown as { n: number }).n),
      unique: Number((uniqueResult.rows[0] as unknown as { n: number }).n),
      missingCcli: Number((missingResult.rows[0] as unknown as { n: number }).n),
    }
  })

  ipcMain.handle('reports:exportCCLI', async (_e, raw: unknown) => {
    const db = getDb()
    const { days } = z.object({ days: z.number().int().positive().default(30) }).parse(raw ?? {})

    const result = await db.execute({
      sql: `SELECT * FROM song_usage_log
            WHERE service_date >= date('now', '-' || ? || ' days')
            ORDER BY service_date ASC, song_title ASC`,
      args: [days]
    })

    const rows = result.rows as unknown as Array<{
      song_title: string
      ccli_number: string | null
      service_date: string
    }>

    const csvHeader = 'Title,CCLI Number,Service Date\n'
    const csvRows = rows.map(r => {
      const title = (r.song_title || '').replace(/"/g, '""')
      const ccli = r.ccli_number || ''
      return `"${title}","${ccli}","${r.service_date}"`
    }).join('\n')

    return { csv: csvHeader + csvRows, count: rows.length }
  })
}
