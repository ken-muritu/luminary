import path from 'path'
import { app } from 'electron'
import { createClient, Client } from '@libsql/client'

let _client: Client | null = null

function resolveDbConfig(): { url: string; authToken?: string } {
  const tursoUrl = process.env.LUMINARY_TURSO_URL?.trim()
  const tursoToken = process.env.LUMINARY_TURSO_AUTH_TOKEN?.trim()

  if (tursoUrl && tursoToken) {
    return { url: tursoUrl, authToken: tursoToken }
  }

  const dbPath = path.join(app.getPath('userData'), 'luminary.db')
  return { url: `file:${dbPath}` }
}

export function getDb(): Client {
  if (_client) return _client
  _client = createClient(resolveDbConfig())
  return _client
}

export function isTursoRemote(): boolean {
  return Boolean(process.env.LUMINARY_TURSO_URL && process.env.LUMINARY_TURSO_AUTH_TOKEN)
}

export function closeDb(): void {
  _client = null
}

export async function executeBatch(statements: { sql: string; args?: unknown[] }[]): Promise<void> {
  const db = getDb()
  for (const stmt of statements) {
    await db.execute({ sql: stmt.sql, args: (stmt.args || []) as (string | number | null)[] })
  }
}
