import { ipcMain } from 'electron'
import { z } from 'zod'
import { getDb } from '../database/client'

const VALID_KEYS = new Set([
  'isOnboarded', 'defaultTranslation', 'showVerseNumbers', 'fontFamily',
  'baseFontSize', 'fontWeight', 'shadowDepth', 'glowDepth', 'autoBackup',
  'cloudSync', 'reducedMotion', 'largeFontMode', 'licenseTier', 'licenseKey',
  'language', 'audioInputDevice', 'aiMode', 'aiModel', 'aiSensitivity',
  'aiConfidenceThreshold',
])

const SettingsSetSchema = z.object({
  key:   z.string().refine((k) => VALID_KEYS.has(k), { message: 'Unknown settings key' }),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

const SettingsBulkSchema = z.record(z.union([z.string(), z.number(), z.boolean()]))

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', async () => {
    const db = getDb()
    const result = await db.execute('SELECT key, value FROM settings')
    return Object.fromEntries(result.rows.map((r: any) => [r.key, coerce(r.key, r.value)]))
  })

  ipcMain.handle('settings:get', async (_e, rawKey: unknown) => {
    const db = getDb()
    const key = z.string().parse(rawKey)
    const result = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] })
    const row = result.rows[0] as unknown as { value: string } | undefined
    return row ? coerce(key, row.value) : null
  })

  ipcMain.handle('settings:set', async (_e, rawInput: unknown) => {
    const db = getDb()
    const parsed = SettingsSetSchema.parse(rawInput)
    await db.execute({
      sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      args: [parsed.key, String(parsed.value)]
    })
    return { success: true }
  })

  ipcMain.handle('settings:setBulk', async (_e, rawInput: unknown) => {
    const db = getDb()
    const data = SettingsBulkSchema.parse(rawInput)
    for (const [k, v] of Object.entries(data)) {
      if (VALID_KEYS.has(k)) {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          args: [k, String(v)]
        })
      }
    }
    return { success: true }
  })
}

const BOOLEAN_KEYS = new Set([
  'isOnboarded', 'showVerseNumbers', 'autoBackup', 'cloudSync',
  'reducedMotion', 'largeFontMode',
])
const NUMBER_KEYS = new Set([
  'baseFontSize', 'shadowDepth', 'glowDepth', 'aiConfidenceThreshold',
])

function coerce(key: string, value: string): string | number | boolean {
  if (BOOLEAN_KEYS.has(key)) return value === 'true'
  if (NUMBER_KEYS.has(key)) return Number(value)
  return value
}
