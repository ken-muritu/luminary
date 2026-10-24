/**
 * Backup & Restore IPC Handlers
 * Implements database backup, restore, and export functionality
 */

import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { closeDb, getDb } from '../database/client'

function getDbPath(): string {
  return path.join(app.getPath('userData'), 'luminary.db')
}

function getBackupDir(): string {
  const dir = path.join(app.getPath('userData'), 'backups')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export function registerBackupHandlers(): void {
  // Create manual backup
  ipcMain.handle('backup:create', async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(getBackupDir(), `luminary-backup-${timestamp}.db`)
      
      // SQLite file can be copied directly (libsql is file-based)
      fs.copyFileSync(getDbPath(), backupPath)
      
      return { 
        success: true, 
        path: backupPath,
        timestamp: new Date().toISOString(),
        size: fs.statSync(backupPath).size
      }
    } catch (error) {
      console.error('Backup creation failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Backup failed' 
      }
    }
  })

  // List all backups
  ipcMain.handle('backup:list', async () => {
    try {
      const files = fs.readdirSync(getBackupDir())
        .filter(f => f.startsWith('luminary-backup-') && f.endsWith('.db'))
        .map(f => {
          const stat = fs.statSync(path.join(getBackupDir(), f))
          return {
            name: f,
            path: path.join(getBackupDir(), f),
            size: stat.size,
            created: stat.birthtime.toISOString()
          }
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      
      return { success: true, backups: files }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to list backups' }
    }
  })

  // Restore from backup
  ipcMain.handle('backup:restore', async (_e, backupPath: string) => {
    try {
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup file not found' }
      }

      // Create emergency backup of current state
      const emergencyPath = path.join(getBackupDir(), `luminary-emergency-${Date.now()}.db`)
      if (fs.existsSync(getDbPath())) {
        fs.copyFileSync(getDbPath(), emergencyPath)
      }

      closeDb()
      fs.copyFileSync(backupPath, getDbPath())
      getDb()

      return { 
        success: true, 
        message: 'Database restored successfully',
        emergencyBackup: emergencyPath 
      }
    } catch (error) {
      console.error('Restore failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed' 
      }
    }
  })

  // Export database to user-selected location
  ipcMain.handle('backup:export', async () => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: `luminary-export-${new Date().toISOString().split('T')[0]}.db`,
        filters: [
          { name: 'SQLite Database', extensions: ['db'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      }) as unknown as { canceled: boolean; filePath?: string }

      if (result.canceled || !result.filePath) {
        return { success: false, cancelled: true }
      }

      fs.copyFileSync(getDbPath(), result.filePath)

      return { 
        success: true, 
        path: result.filePath,
        size: fs.statSync(result.filePath).size 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      }
    }
  })

  // Import database from user-selected file
  ipcMain.handle('backup:import', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'SQLite Database', extensions: ['db'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      }) as unknown as { canceled: boolean; filePaths?: string[] }

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, cancelled: true }
      }

      const importPath = result.filePaths[0]

      // Create emergency backup
      const emergencyPath = path.join(getBackupDir(), `luminary-emergency-${Date.now()}.db`)
      if (fs.existsSync(getDbPath())) {
        fs.copyFileSync(getDbPath(), emergencyPath)
      }

      closeDb()
      fs.copyFileSync(importPath, getDbPath())
      getDb()

      return { 
        success: true, 
        message: 'Database imported successfully',
        emergencyBackup: emergencyPath 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      }
    }
  })

  // Auto-backup on schedule (can be called from main process)
  ipcMain.handle('backup:auto', async () => {
    try {
      // Keep only last 10 automatic backups
      const autoBackupDir = path.join(getBackupDir(), 'auto')
      if (!fs.existsSync(autoBackupDir)) {
        fs.mkdirSync(autoBackupDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(autoBackupDir, `luminary-auto-${timestamp}.db`)

      fs.copyFileSync(getDbPath(), backupPath)

      // Clean up old auto-backups (keep last 10)
      const files = fs.readdirSync(autoBackupDir)
        .filter(f => f.startsWith('luminary-auto-'))
        .map(f => ({
          name: f,
          path: path.join(autoBackupDir, f),
          time: fs.statSync(path.join(autoBackupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)

      // Delete files beyond the 10 most recent
      files.slice(10).forEach(f => {
        try { fs.unlinkSync(f.path) } catch {}
      })

      return { success: true, path: backupPath }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Auto-backup failed' 
      }
    }
  })
}
