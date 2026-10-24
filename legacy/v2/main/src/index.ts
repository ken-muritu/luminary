import { app, BrowserWindow, ipcMain, session, screen, globalShortcut } from 'electron'
import path from 'path'
import { loadLuminaryEnv } from './env'

loadLuminaryEnv()

import { runMigrations } from './database/migrations'
import { closeDb } from './database/client'
import { registerSongHandlers } from './ipc/songs'
import { registerSettingsHandlers } from './ipc/settings'
import {
  createOutputWindow, destroyOutputWindow, getOutputWindow,
  createStageWindow, destroyStageWindow,
  pushSlide, pushBlank, pushLogo, pushFreeze, pushStageContent, setOutputConfig,
  flushPendingSlide,
  type SlidePayload,
} from './display/outputWindow'
import { registerSetlistHandlers } from './ipc/setlists'
import { registerReportHandlers } from './ipc/reports'
import { registerBibleHandlers } from './ipc/bible'
import { registerBackupHandlers } from './ipc/backup'
import { registerMediaHandlers } from './ipc/media'
import { seedBibleIfEmpty } from './database/seedBible'
import { getDb } from './database/client'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#13131A',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const rendererHtml = path.join(app.getAppPath(), 'apps/renderer/dist/index.html')
    mainWindow.loadFile(rendererHtml)
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })

  return mainWindow
}

function setupCSP(): void {
  if (isDev) return

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp =
      "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: blob:; " +
      "media-src 'self' blob:; " +
      "connect-src 'self' http://localhost:5173 ws://localhost:5173; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "object-src 'none'; " +
      "base-uri 'self'"
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': csp } as any })
  })
}

async function registerCoreHandlers(): Promise<void> {
  ipcMain.handle('app:version', () => app.getVersion())

  const { validateLicenseKey, setTier, getTier } = await import('./license/guard')

  ipcMain.handle('license:validate', async (_e, key: string) => {
    const result = validateLicenseKey(String(key ?? ''))
    if (result.valid) {
      setTier(result.tier)
      const db = getDb()
      await db.execute({ sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('licenseTier', ?)", args: [result.tier] })
      await db.execute({ sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('licenseKey', ?)", args: [String(key).trim()] })
    }
    return result
  })

  ipcMain.handle('license:getStatus', async () => {
    const db = getDb()
    const tierResult = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'licenseTier'", args: [] })
    const keyResult = await db.execute({ sql: "SELECT value FROM settings WHERE key = 'licenseKey'", args: [] })
    const tier = String((tierResult.rows[0] as { value?: string } | undefined)?.value ?? getTier())
    const key = String((keyResult.rows[0] as { value?: string } | undefined)?.value ?? '')
    const validation = key ? validateLicenseKey(key) : { valid: tier !== 'community', tier: getTier() }
    return { tier, key, valid: validation.valid }
  })

  ipcMain.handle('output:goLive', async () => {
    const existing = getOutputWindow()
    createOutputWindow()
    if (existing) flushPendingSlide()
    return { success: true }
  })

  ipcMain.handle('output:endLive', async () => {
    destroyOutputWindow()
    return { success: true }
  })

  ipcMain.handle('output:setSlide', async (_e, rawPayload: unknown) => {
    const payload = rawPayload as SlidePayload
    pushSlide(payload)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('output:previewUpdated', payload)
    }
    return { success: true }
  })

  ipcMain.handle('output:setBlank', async (_e, isBlank: unknown) => {
    pushBlank(Boolean(isBlank))
    return { success: true }
  })

  ipcMain.handle('output:setLogo', async (_e, isLogo: unknown) => {
    pushLogo(Boolean(isLogo))
    return { success: true }
  })

  ipcMain.handle('output:setFreeze', async (_e, isFrozen: unknown) => {
    pushFreeze(Boolean(isFrozen))
    return { success: true }
  })

  ipcMain.handle('output:getDisplays', async () => screen.getAllDisplays())

  ipcMain.handle('output:mapDisplay', async (_e, data: unknown) => {
    const d = data as { displayId?: number }
    const displays = screen.getAllDisplays()
    const target = displays.find((disp) => disp.id === d?.displayId)
    if (target) {
      const win = getOutputWindow()
      if (win && !win.isDestroyed()) {
        win.setBounds(target.bounds)
      }
    }
    return { success: true }
  })

  ipcMain.handle('output:updateConfig', async (_e, cfg: unknown) => {
    setOutputConfig(cfg as any)
    return { success: true }
  })

  // Stage Display IPC handlers
  ipcMain.handle('stage:open', async () => {
    createStageWindow()
    return { success: true }
  })

  ipcMain.handle('stage:close', async () => {
    destroyStageWindow()
    return { success: true }
  })

  ipcMain.handle('stage:setContent', async (_e, payload: unknown) => {
    pushStageContent(payload as any)
    return { success: true }
  })

  // AI Pipeline - Real Implementation
  const { startAIWorker, stopAIWorker, processTranscript, setAIConfig, isAIWorkerRunning } = await import('./ai/engine')
  const { requireTier } = await import('./license/guard')
  
  ipcMain.handle('ai:startListening', async () => {
    requireTier('community')
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const db = getDb()
    const [translationRow, thresholdRow] = await Promise.all([
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'defaultTranslation'", args: [] }),
      db.execute({ sql: "SELECT value FROM settings WHERE key = 'aiConfidenceThreshold'", args: [] }),
    ])
    const translation = String((translationRow.rows[0] as { value?: string } | undefined)?.value ?? 'KJV')
    const threshold = Number((thresholdRow.rows[0] as { value?: string } | undefined)?.value ?? 0.85)

    setAIConfig({ translation, confidenceThreshold: threshold > 1 ? threshold / 100 : threshold })

    startAIWorker({
      onTranscript: (text, isPartial) => {
        mainWindow?.webContents.send('ai:status', {
          isListening: true,
          partial: text,
          isPartial,
        })
      },
      onVerseDetected: (match) => {
        mainWindow?.webContents.send('ai:verseDetected', match)
      },
      onStatus: (status) => {
        mainWindow?.webContents.send('ai:status', status)
      },
    })
    return { success: true }
  })

  ipcMain.handle('ai:submitTranscript', async (_e, payload: unknown) => {
    const data = payload as { text?: string; isFinal?: boolean }
    if (!data?.text) return { success: false }
    await processTranscript(data.text, data.isFinal !== false)
    return { success: true }
  })
  
  ipcMain.handle('ai:stopListening', async () => {
    stopAIWorker()
    return { success: true }
  })
  
  ipcMain.handle('ai:setMode', async (_e, mode: string) => {
    // Store mode in settings
    const db = getDb()
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('aiMode', ?)",
      args: [mode]
    })
    return { success: true, mode }
  })
  
  ipcMain.handle('ai:setModel', async (_e, model: string) => {
    // Check tier for Whisper models
    if (model.startsWith('whisper-small')) requireTier('pro')
    if (model.startsWith('whisper')) requireTier('standard')
    
    const db = getDb()
    await db.execute({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('aiModel', ?)",
      args: [model]
    })
    return { success: true, model }
  })
  
  ipcMain.handle('ai:calibrate', async () => {
    // Simulate calibration - real implementation would measure noise floor
    const noiseFloor = -45 + Math.random() * 10 // -45 to -35 dB
    return { success: true, noiseFloor: Math.round(noiseFloor) }
  })
}

function registerKeyboardShortcuts(): void {
  const send = (channel: string, ...args: unknown[]) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, ...args)
    }
  }

  globalShortcut.register('Space',      () => send('shortcut:nextSection'))
  globalShortcut.register('Right',      () => send('shortcut:nextSection'))
  globalShortcut.register('Left',       () => send('shortcut:prevSection'))
  globalShortcut.register('Down',       () => send('shortcut:nextItem'))
  globalShortcut.register('Up',         () => send('shortcut:prevItem'))
  globalShortcut.register('Escape',     () => send('shortcut:clearProjection'))
  globalShortcut.register('B',          () => send('shortcut:toggleBlackout'))
  globalShortcut.register('F',          () => send('shortcut:toggleFreeze'))
  globalShortcut.register('L',          () => send('shortcut:toggleLogo'))
  globalShortcut.register('G',          () => send('shortcut:goLive'))
  globalShortcut.register('F1',         () => send('shortcut:goLive'))
}

app.whenReady().then(async () => {
  await runMigrations()

  if (process.env.LUMINARY_SEED_ONLY === '1') {
    await seedBibleIfEmpty()
    console.log('[Bible] Seed complete — exiting')
    app.quit()
    return
  }

  const { loadTier } = await import('./license/guard')
  await loadTier()

  setupCSP()
  await registerCoreHandlers()
  registerSongHandlers()
  registerSettingsHandlers()
  registerBibleHandlers()

  createWindow()
  registerSetlistHandlers()
  registerReportHandlers()
  registerBackupHandlers()
  registerMediaHandlers()
  registerKeyboardShortcuts()

  // Bible import can take minutes over Turso — do not block the window
  void seedBibleIfEmpty().catch((err) => console.error('[Bible] background seed failed:', err))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  globalShortcut.unregisterAll()
  closeDb()
})
