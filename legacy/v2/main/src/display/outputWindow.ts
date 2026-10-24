import { app, BrowserWindow, screen } from 'electron'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let outputWin: BrowserWindow | null = null
let stageWin: BrowserWindow | null = null

export interface SlidePayload {
  type:        'song' | 'verse' | 'media' | 'blank' | 'logo'
  text?:       string
  subtext?:    string
  reference?:  string
  mediaPath?:  string
  songId?:     number
  songTitle?:  string
  ccliNumber?: string
}

export interface OutputConfig {
  fontFamily:  string
  fontSize:    number
  fontWeight:  string
  shadowDepth: number
  glowDepth:   number
}

let _config: OutputConfig = {
  fontFamily: 'Inter', fontSize: 72, fontWeight: 'bold',
  shadowDepth: 50, glowDepth: 30,
}

let _pendingSlide: SlidePayload | null = null

export function setOutputConfig(cfg: Partial<OutputConfig>): void {
  _config = { ..._config, ...cfg }
  invokeOutputApi('config', _config)
}

export function createOutputWindow(): BrowserWindow {
  if (outputWin && !outputWin.isDestroyed()) return outputWin

  const displays = screen.getAllDisplays()
  const target = displays.find((d) => d.id !== screen.getPrimaryDisplay().id) ?? displays[0]
  const { x, y, width, height } = target.bounds

  outputWin = new BrowserWindow({
    x, y, width, height,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const htmlPath = isDev
    ? path.join(__dirname, '../../../renderer/public/output.html')
    : path.join(app.getAppPath(), 'apps/renderer/dist/output.html')

  outputWin.loadFile(htmlPath)

  outputWin.webContents.on('did-finish-load', () => {
    invokeOutputApi('config', _config)
    flushPendingSlide()
  })

  outputWin.on('closed', () => { outputWin = null })

  return outputWin
}

export function destroyOutputWindow(): void {
  if (outputWin && !outputWin.isDestroyed()) {
    outputWin.close()
    outputWin = null
  }
}

export function getOutputWindow(): BrowserWindow | null {
  return outputWin && !outputWin.isDestroyed() ? outputWin : null
}

function invokeOutputApi(method: string, arg?: unknown): void {
  const win = getOutputWindow()
  if (!win || win.webContents.isDestroyed()) return
  const argExpr = arg === undefined ? '' : JSON.stringify(arg)
  win.webContents
    .executeJavaScript(`window.__LUMINARY_OUTPUT__?.${method}(${argExpr})`)
    .catch((err) => console.error('[output]', method, err))
}

function invokeStageApi(method: string, arg?: unknown): void {
  const win = getStageWindow()
  if (!win || win.webContents.isDestroyed()) return
  const argExpr = arg === undefined ? '' : JSON.stringify(arg)
  win.webContents
    .executeJavaScript(`window.__LUMINARY_STAGE__?.${method}(${argExpr})`)
    .catch((err) => console.error('[stage]', method, err))
}

export function sendToOutput(channel: string, payload: unknown): void {
  const win = getOutputWindow()
  if (win) win.webContents.send(channel, payload)
}

function deliverSlide(payload: SlidePayload): void {
  invokeOutputApi('slide', payload)
  invokeStageApi('setContent', {
    current: payload.text,
    reference: payload.reference,
    next: payload.subtext,
  })
}

export function pushSlide(payload: SlidePayload): void {
  if (payload.type !== 'blank') {
    _pendingSlide = payload
  }
  const win = getOutputWindow()
  if (!win || win.webContents.isDestroyed()) return
  deliverSlide(payload)
}

export function flushPendingSlide(): void {
  if (_pendingSlide) deliverSlide(_pendingSlide)
}

export function getPendingSlide(): SlidePayload | null {
  return _pendingSlide
}

export function pushBlank(isBlank: boolean): void {
  invokeOutputApi('blank', isBlank)
}

export function pushLogo(isLogo: boolean): void {
  invokeOutputApi('logo', isLogo)
}

export function pushFreeze(isFrozen: boolean): void {
  invokeOutputApi('freeze', isFrozen)
}

// Stage Display Window Functions
export function createStageWindow(): BrowserWindow {
  if (stageWin && !stageWin.isDestroyed()) return stageWin

  const displays = screen.getAllDisplays()
  // Use third display if available, otherwise second, otherwise primary
  const target = displays[2] ?? displays[1] ?? displays[0]
  const { x, y, width, height } = target.bounds

  stageWin = new BrowserWindow({
    x, y, width, height,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const htmlPath = isDev
    ? path.join(__dirname, '../../../renderer/public/stage.html')
    : path.join(app.getAppPath(), 'apps/renderer/dist/stage.html')

  stageWin.loadFile(htmlPath)

  stageWin.on('closed', () => { stageWin = null })

  return stageWin
}

export function destroyStageWindow(): void {
  if (stageWin && !stageWin.isDestroyed()) {
    stageWin.close()
    stageWin = null
  }
}

export function getStageWindow(): BrowserWindow | null {
  return stageWin && !stageWin.isDestroyed() ? stageWin : null
}

export function sendToStage(channel: string, payload: unknown): void {
  const win = getStageWindow()
  if (win) win.webContents.send(channel, payload)
}

export function pushStageContent(payload: { current?: string; next?: string; reference?: string }): void {
  invokeStageApi('setContent', payload)
}
