import fs from 'fs'
import path from 'path'
import os from 'os'

function applyEnvLine(line: string): void {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const eq = trimmed.indexOf('=')
  if (eq <= 0) return
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  if (!process.env[key]) process.env[key] = value
}

function loadEnvFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return
    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
      applyEnvLine(line)
    }
  } catch {
    // optional config file
  }
}

/** Load Turso and other secrets before the database client initializes. */
export function loadLuminaryEnv(): void {
  const configDir = path.join(os.homedir(), '.config', 'luminary')
  loadEnvFile(path.join(configDir, '.env'))
  // Dev: repo root .env
  loadEnvFile(path.join(process.cwd(), '.env'))
}
