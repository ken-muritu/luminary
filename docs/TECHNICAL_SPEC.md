# Luminary — Technical Specification

**Version:** 2.0.0  
**Last Updated:** April 2026

This document is the exhaustive technical reference for every source file, module, type, store, component, and page in the Luminary codebase. It is written so that any developer can pick up any file and understand exactly what it does, what it expects, and what it produces.

---

## 1. Monorepo Root

### `package.json` (root)

```json
{
  "name": "luminary",
  "version": "2.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":              "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main":         "npm run dev --workspace=apps/main",
    "dev:renderer":     "npm run dev --workspace=apps/renderer",
    "build":            "npm run build:main && npm run build:renderer",
    "build:main":       "npm run build --workspace=apps/main",
    "build:renderer":   "npm run build --workspace=apps/renderer",
    "dist":             "npm run build && electron-builder",
    "lint":             "eslint apps/*/src --ext .ts,.tsx"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "electron": "^30.0.0",
    "electron-builder": "^24.13.3"
  }
}
```

### `electron-builder.config.js`

Configures electron-builder for multi-platform packaging.

| Key | Value | Purpose |
|---|---|---|
| `appId` | `ai.muritu.luminary` | macOS bundle ID + Windows registry key |
| `productName` | `Luminary` | Display name in installers |
| `directories.output` | `dist-electron` | Where packaged builds go |
| `files` | `apps/main/dist/**`, `apps/renderer/dist/**` | What to bundle |
| `extraMetadata.main` | `apps/main/dist/index.js` | Electron entry point |
| `win.target` | `nsis x64` | Windows NSIS installer |
| `mac.target` | `dmg x64+arm64` | macOS signed DMG |
| `linux.target` | `AppImage x64` | Linux portable |
| `nsis.oneClick` | `false` | Shows installation directory choice |

**Missing (to be added):** `build/icon.ico`, `build/icon.icns`, `build/icon.png`, `build/entitlements.mac.plist`.

---

## 2. Main Process (`apps/main/`)

### `apps/main/package.json`

| Key | Value |
|---|---|
| `name` | `@luminary/main` |
| `main` | `dist/index.js` |
| `scripts.dev` | `tsc -w` (watch-mode TypeScript compilation) |
| `scripts.build` | `tsc` |

**Dependencies:**
| Package | Version | Purpose |
|---|---|---|
| `better-sqlite3` | ^9.6.0 | Synchronous SQLite driver |
| `zod` | ^3.23.8 | IPC payload validation |

**DevDependencies:**
| Package | Purpose |
|---|---|
| `@types/better-sqlite3` | Types for better-sqlite3 |
| `@types/node` | Node.js type definitions |
| `typescript` | TypeScript compiler |

**Missing (to be added when implementing AI):**
- `naudiodon` or `node-portaudio` — audio capture
- `vosk-browser` or `@sashido/vosk` — Vosk binding
- Node.js `whisper.cpp` binding or child_process wrapper

### `apps/main/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",      ← CommonJS required by Electron main
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

---

### `apps/main/src/index.ts`

**Role:** Entry point for the entire Electron application.

**Current implementation (existing):**
- Creates the operator `BrowserWindow` (1200×800, `nodeIntegration: false`, `contextIsolation: true`)
- Loads `localhost:5173` in dev, `renderer/dist/index.html` in production
- Applies a Content Security Policy via `session.defaultSession.webRequest.onHeadersReceived`
- Sets an `app-region` drag CSS rule for the title bar
- Registers `globalShortcut` for `CmdOrCtrl+Shift+L` (toggle live — stub)
- Creates a system tray icon (stub, no icon file yet)
- Registers `ipcMain.handle('get-app-version')` — returns `app.getVersion()`
- Handles `app.on('window-all-closed')` and `app.on('activate')` for platform conventions

**Missing (to be implemented):**
```typescript
// Output window creation
function createOutputWindow(display: Electron.Display): BrowserWindow
function createStageWindow(display: Electron.Display): BrowserWindow

// Display management
screen.on('display-added', handler)
screen.on('display-removed', handler)

// IPC handler registration (import and register all domain modules)
import { registerSongsHandlers }    from './ipc/songs'
import { registerBibleHandlers }    from './ipc/bible'
import { registerSetlistHandlers }  from './ipc/setlists'
import { registerOutputHandlers }   from './ipc/output'
import { registerSettingsHandlers } from './ipc/settings'
import { registerAIHandlers }       from './ipc/ai'
import { registerReportsHandlers }  from './ipc/reports'
import { registerBackupHandlers }   from './ipc/backup'
import { registerMediaHandlers }    from './ipc/media'
import { registerLicensingHandlers }from './ipc/licensing'

// Database initialisation
import { initDatabase } from './database/init'
await initDatabase()  // runs migrations, sets WAL mode

// Tray menu with real actions
tray.setContextMenu(Menu.buildFromTemplate([
  { label: 'Show Luminary', click: () => operatorWindow.show() },
  { label: 'Go Live',       click: () => outputWindow?.show() },
  { label: 'Toggle AI',     click: () => aiEngine.toggle() },
  { type: 'separator' },
  { label: 'Quit Luminary', click: () => app.quit() },
]))
```

---

### `apps/main/src/preload.ts`

**Role:** Constructs `window.luminary` via `contextBridge`.

**Status: MISSING — must be created.**

This is the single most critical missing file. Without it, the renderer has no way to talk to the main process or access any real data.

**Required implementation shape:**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('luminary', {
  // ─── Songs ───────────────────────────────────────────────────
  songs: {
    getAll:   ()           => ipcRenderer.invoke('songs:getAll'),
    getById:  (id: string) => ipcRenderer.invoke('songs:getById', id),
    create:   (song)       => ipcRenderer.invoke('songs:create', song),
    update:   (id, data)   => ipcRenderer.invoke('songs:update', id, data),
    delete:   (id)         => ipcRenderer.invoke('songs:delete', id),
    search:   (query)      => ipcRenderer.invoke('songs:search', query),
    import:   (filePath)   => ipcRenderer.invoke('songs:import', filePath),
    export:   (id, format) => ipcRenderer.invoke('songs:export', id, format),
  },
  // ─── Bible ───────────────────────────────────────────────────
  bible: {
    search:          (query, translation) => ipcRenderer.invoke('bible:search', query, translation),
    getVerse:        (book, ch, v, t)     => ipcRenderer.invoke('bible:getVerse', book, ch, v, t),
    getChapter:      (book, ch, t)        => ipcRenderer.invoke('bible:getChapter', book, ch, t),
    getTranslations: ()                   => ipcRenderer.invoke('bible:getTranslations'),
  },
  // ─── Setlists ────────────────────────────────────────────────
  setlists: {
    getAll:       ()            => ipcRenderer.invoke('setlists:getAll'),
    getById:      (id)          => ipcRenderer.invoke('setlists:getById', id),
    create:       (data)        => ipcRenderer.invoke('setlists:create', data),
    update:       (id, data)    => ipcRenderer.invoke('setlists:update', id, data),
    delete:       (id)          => ipcRenderer.invoke('setlists:delete', id),
    addItem:      (setlistId, item)           => ipcRenderer.invoke('setlists:addItem', setlistId, item),
    removeItem:   (setlistId, itemId)         => ipcRenderer.invoke('setlists:removeItem', setlistId, itemId),
    reorderItems: (setlistId, orderedIds)     => ipcRenderer.invoke('setlists:reorderItems', setlistId, orderedIds),
    updateItem:   (setlistId, itemId, data)   => ipcRenderer.invoke('setlists:updateItem', setlistId, itemId, data),
  },
  // ─── Media ───────────────────────────────────────────────────
  media: {
    getAll:        (category?) => ipcRenderer.invoke('media:getAll', category),
    import:        (filePaths) => ipcRenderer.invoke('media:import', filePaths),
    delete:        (id, deleteFile?) => ipcRenderer.invoke('media:delete', id, deleteFile),
    updateTags:    (id, tags)  => ipcRenderer.invoke('media:updateTags', id, tags),
    openFolder:    ()          => ipcRenderer.invoke('media:openFolder'),
  },
  // ─── Output ──────────────────────────────────────────────────
  output: {
    setSlide:  (slide)   => ipcRenderer.invoke('output:setSlide', slide),
    setBlank:  (on)      => ipcRenderer.invoke('output:setBlank', on),
    setLogo:   (on)      => ipcRenderer.invoke('output:setLogo', on),
    setFreeze: (on)      => ipcRenderer.invoke('output:setFreeze', on),
    goLive:    ()        => ipcRenderer.invoke('output:goLive'),
    endLive:   ()        => ipcRenderer.invoke('output:endLive'),
  },
  // ─── Settings ────────────────────────────────────────────────
  settings: {
    getAll:      ()          => ipcRenderer.invoke('settings:getAll'),
    set:         (key, value)=> ipcRenderer.invoke('settings:set', key, value),
    getDisplays: ()          => ipcRenderer.invoke('settings:getDisplays'),
    mapDisplay:  (id, role)  => ipcRenderer.invoke('settings:mapDisplay', id, role),
    identifyDisplay: (id)    => ipcRenderer.invoke('settings:identifyDisplay', id),
  },
  // ─── AI Engine ───────────────────────────────────────────────
  ai: {
    startListening: ()       => ipcRenderer.invoke('ai:startListening'),
    stopListening:  ()       => ipcRenderer.invoke('ai:stopListening'),
    setMode:        (mode)   => ipcRenderer.invoke('ai:setMode', mode),
    setModel:       (model)  => ipcRenderer.invoke('ai:setModel', model),
    setConfig:      (cfg)    => ipcRenderer.invoke('ai:setConfig', cfg),
    calibrate:      ()       => ipcRenderer.invoke('ai:calibrate'),
    getConfig:      ()       => ipcRenderer.invoke('ai:getConfig'),
  },
  // ─── Reports ─────────────────────────────────────────────────
  reports: {
    getSongUsage:       (dateRange) => ipcRenderer.invoke('reports:getSongUsage', dateRange),
    generateCCLIReport: (dateRange) => ipcRenderer.invoke('reports:generateCCLIReport', dateRange),
    exportCSV:          (dateRange) => ipcRenderer.invoke('reports:exportCSV', dateRange),
  },
  // ─── Licensing ───────────────────────────────────────────────
  licensing: {
    getTier:      ()    => ipcRenderer.invoke('licensing:getTier'),
    activateKey:  (key) => ipcRenderer.invoke('licensing:activateKey', key),
    validateKey:  (key) => ipcRenderer.invoke('licensing:validateKey', key),
  },
  // ─── Backup ──────────────────────────────────────────────────
  backup: {
    export:        ()          => ipcRenderer.invoke('backup:export'),
    import:        (filePath)  => ipcRenderer.invoke('backup:import', filePath),
    runAutoBackup: ()          => ipcRenderer.invoke('backup:runAutoBackup'),
  },
  // ─── Push Event Subscriptions ────────────────────────────────
  onVerseDetected:    (cb) => ipcRenderer.on('ai:verseDetected',    (_, d) => cb(d)),
  onDisambiguate:     (cb) => ipcRenderer.on('ai:disambiguate',     (_, d) => cb(d)),
  onDisplayChanged:   (cb) => ipcRenderer.on('display:changed',     (_, d) => cb(d)),
  onLiveStatusChange: (cb) => ipcRenderer.on('output:liveStatus',   (_, d) => cb(d)),
})
```

**Type declaration** (to be placed in `apps/renderer/src/types/luminary.d.ts`):
```typescript
declare global {
  interface Window {
    luminary: LuminaryBridge
  }
}
```

---

## 3. Renderer (`apps/renderer/`)

### `apps/renderer/src/main.tsx`

**Role:** React application entry point.

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

---

### `apps/renderer/src/App.tsx`

**Role:** Root component; conditionally renders Onboarding or the main shell with routing.

**Current logic:**
- Reads `isOnboarded` from `serviceStore`
- If `false` → renders `<Onboarding />`
- If `true` → renders `<AppShell>` with `<Routes>` for all pages

**Routes registered:**

| Path | Component | Description |
|---|---|---|
| `/` | `Dashboard` | Service overview and quick controls |
| `/songs` | `Songs` | Song library and lyrics editor |
| `/bible` | `Bible` | Scripture search and projection |
| `/live` | `Live` | Primary operator/projection control |
| `/media` | `Media` | Media asset library |
| `/setlist` | `Setlist` | Service order management |
| `/ai` | `AIEngine` | AI voice engine configuration |
| `/settings` | `Settings` | Application settings |
| `/reports` | `Reports` | CCLI song usage reporting |
| `/licensing` | `Licensing` | Tier selection and key activation |

**Missing (to be added):** On mount `useEffect`, hydrate all Zustand stores from SQLite via `window.luminary.*` calls. Register `onVerseDetected` and `onDisplayChanged` listeners.

---

### `apps/renderer/src/components/AppShell.tsx`

**Role:** The persistent outer layout that wraps all pages.

**Structure:**
```
<div className="flex h-screen">
  <Sidebar />                    ← Left navigation + live preview
  <main className="flex-1">
    <TopBar />                   ← Title bar (drag region, time, live indicator)
    <div className="flex-1 overflow-hidden">
      {children}                 ← Active page content
    </div>
  </main>
</div>
```

**Props:** None (wraps `<Outlet />` via react-router-dom).

---

### `apps/renderer/src/components/Sidebar.tsx`

**Role:** Left navigation column with route links, live preview thumbnail, and Go Live button.

**Sections:**
1. Top: Luminary logo/wordmark
2. Navigation items (NavItem components) — icon + label, active state via `useLocation()`
3. Bottom section: compact `ProjectionPreview`, current projection label, Go Live/End Live button

**NavItem props:** `{ to: string, icon: LucideIcon, label: string }`

**Active detection:** `const isActive = location.pathname === to` (or `startsWith` for nested routes)

---

### `apps/renderer/src/components/ProjectionPreview.tsx`

**Role:** A 16:9 thumbnail showing the current projection state.

**Props:**
```typescript
interface ProjectionPreviewProps {
  compact?: boolean      // If true, smaller with minimal padding
  className?: string
}
```

**Reads from:** `serviceStore.projectionText`, `serviceStore.projectionMedia`, `serviceStore.isLive`

**Renders:**
- A `div` with `aspect-video` and `bg-[#0D0D14]` (black base)
- If `projectionText`: centered white text with typography from `settingsStore`
- If `projectionMedia`: background image/video
- If not live: a subtle "STANDBY" label
- If live: a green "LIVE" dot indicator

---

### `apps/renderer/src/components/TopBar.tsx`

**Role:** Application top bar with drag region and status info.

**Renders:** Luminary logo left | current time + live indicator center | window controls right (macOS traffic lights handled natively; on Windows/Linux, custom close/min/max buttons call `window.luminary.window.*` IPC).

---

## 4. Zustand Stores

### `apps/renderer/src/store/serviceStore.ts`

**Purpose:** Global live service state — what is currently projected and whether we are live.

```typescript
interface ServiceState {
  isLive: boolean                   // Whether output window is showing
  isOnboarded: boolean              // First-run complete flag
  projectionText: string            // Current text on output
  projectionMedia: string           // Current media asset name on output
  currentItem: {                    // Currently selected setlist item
    id: string
    type: 'song' | 'verse' | 'media' | 'timer' | 'blank'
    title: string
  } | null
  // Actions
  setIsLive: (v: boolean) => void
  setIsOnboarded: (v: boolean) => void
  setProjectionText: (text: string, media?: string) => void
  setCurrentItem: (item: ServiceState['currentItem']) => void
  goLive: () => void                // Sets isLive = true, calls window.luminary.output.goLive()
  endLive: () => void               // Sets isLive = false, calls window.luminary.output.endLive()
}
```

**Missing:** `goLive()` and `endLive()` should call `window.luminary.output.goLive/endLive()` when the bridge is available. Currently they only toggle local state.

**Persistence:** `isOnboarded` should be loaded from SQLite on app start. The store itself does not use `persist` middleware; persistence is via IPC to SQLite.

---

### `apps/renderer/src/store/bibleStore.ts`

**Purpose:** Bible search UI state — query, results, active translation.

```typescript
interface BibleState {
  query: string
  searchMode: 'reference' | 'keyword'
  results: BibleVerse[]
  selectedVerses: string[]          // Array of verse IDs
  translation: string               // e.g. 'KJV'
  availableTranslations: string[]
  isLoading: boolean
  // Actions
  setQuery: (q: string) => void
  setSearchMode: (m: 'reference' | 'keyword') => void
  setResults: (r: BibleVerse[]) => void
  toggleVerseSelection: (id: string) => void
  setTranslation: (t: string) => void
  setAvailableTranslations: (ts: string[]) => void
  setIsLoading: (v: boolean) => void
  search: () => Promise<void>       // calls window.luminary.bible.search(query, translation)
}

interface BibleVerse {
  id: string                        // '<book_id>-<chapter>-<verse>'
  book: string                      // e.g. 'John'
  bookAbbrev: string                // e.g. 'Jn'
  chapter: number
  verse: number
  text: string
  translation: string
}
```

**Missing:** `search()` action. Currently the store has state setters only; no IPC call to `window.luminary.bible.search()`.

---

### `apps/renderer/src/store/songStore.ts`

**Purpose:** Song library state — list, selection, search, edit mode.

```typescript
interface SongState {
  songs: Song[]
  selectedSongId: string | null
  searchQuery: string
  isLoading: boolean
  // Actions
  setSongs: (songs: Song[]) => void
  setSelectedSongId: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setIsLoading: (v: boolean) => void
  loadSongs: () => Promise<void>      // calls window.luminary.songs.getAll()
  createSong: (data) => Promise<void>
  updateSong: (id, data) => Promise<void>
  deleteSong: (id) => Promise<void>
}

interface Song {
  id: string
  title: string
  artist: string
  album?: string
  key: string                         // e.g. 'G', 'Am'
  bpm: number
  ccliNumber?: string
  copyright?: string
  year?: number
  licenseType: 'public-domain' | 'ccli' | 'custom'
  sections: SongSection[]
  lastProjected?: string              // ISO date
  themeOverride?: SongThemeOverride
  createdAt: string
  updatedAt: string
}

interface SongSection {
  id: string
  songId: string
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'tag' | 'outro' | 'instrumental'
  label: string                       // e.g. 'Verse 1', 'Chorus'
  lyrics: string
  order: number
}

interface SongThemeOverride {
  fontFamily?: string
  fontSize?: number
  textAlign?: 'left' | 'center' | 'right'
  backgroundColor?: string
  backgroundImagePath?: string
}
```

**Missing:** All async actions (`loadSongs`, `createSong`, `updateSong`, `deleteSong`) — currently the store only has primitive setters. Songs are populated from `MOCK_SONGS` in the page component.

---

### `apps/renderer/src/store/settingsStore.ts`

**Purpose:** All application settings.

```typescript
interface SettingsState {
  // Display
  displays: Display[]
  // Typography
  baseFontSize: number              // Default: 64
  fontWeight: 'semibold' | 'bold' | 'black'
  fontFamily: string                // Default: 'Inter'
  shadowDepth: number               // 0–100, default 50
  glowDepth: number                 // 0–100, default 30
  // Bible
  showVerseNumbers: boolean         // Default: true
  defaultTranslation: string        // Default: 'KJV'
  // Backup
  autoBackup: boolean               // Default: false
  cloudSync: boolean                // Default: false
  // Licensing
  tier: LicenseTier                 // 'community' | 'standard' | 'pro'
  licenseKey: string
  // Actions (setters)
  setDisplays, setBaseFontSize, setFontWeight, setFontFamily,
  setShadowDepth, setGlowDepth, setShowVerseNumbers, setDefaultTranslation,
  setAutoBackup, setCloudSync, setTier, setLicenseKey
}

type LicenseTier = 'community' | 'standard' | 'pro'

interface Display {
  id: string
  name: string
  resolution: string                // e.g. '1920×1080'
  type: 'main' | 'stage' | 'overflow'
  mapped: boolean
}
```

**Missing:** On app start, settings must be loaded from SQLite via `window.luminary.settings.getAll()`. Mutations must call `window.luminary.settings.set(key, value)`.

---

### `apps/renderer/src/store/aiStore.ts`

**Purpose:** AI engine configuration and live status.

```typescript
type AIMode = 'auto' | 'assisted' | 'off'
type ModelType = 'vosk-small' | 'whisper-tiny' | 'whisper-base' | 'whisper-small'
type SensitivityLevel = 'high' | 'medium' | 'low'

interface AIState {
  mode: AIMode
  model: ModelType
  sensitivity: SensitivityLevel
  confidenceThreshold: number       // 0.0–1.0, default 0.85
  isListening: boolean
  audioInputDevice: string          // Device label from MediaDevices
  audioLevel: number                // 0.0–1.0, current VU meter reading
  // Actions
  setMode: (m: AIMode) => void
  setModel: (m: ModelType) => void
  setSensitivity: (s: SensitivityLevel) => void
  setConfidenceThreshold: (t: number) => void
  setIsListening: (v: boolean) => void
  setAudioLevel: (l: number) => void
  setAudioInputDevice: (d: string) => void
}
```

**Missing:** `setIsListening` should call `window.luminary.ai.startListening()` / `stopListening()`. Model and mode changes should call `window.luminary.ai.setConfig()`.

---

## 5. Pages

### `Dashboard.tsx`

**Location:** `apps/renderer/src/pages/Dashboard.tsx`

**Reads from:** `serviceStore`, `songStore`, `settingsStore`, `aiStore`

**Sections rendered:**

| Section | What it shows | Missing implementation |
|---|---|---|
| Stat tiles | Songs count, Setlists count, AI status, CCLI status | Counts must come from SQLite via IPC |
| Live preview | `ProjectionPreview` component | Working (uses store state) |
| AI cue queue | List of pending AI detections | No AI events wired; `onVerseDetected` not registered |
| Recent setlists | Last 5 setlists | Must load from SQLite; currently mock |
| Quick Project bar | Verse/song search input | Not implemented — no IPC search call |

---

### `Songs.tsx`

**Location:** `apps/renderer/src/pages/Songs.tsx`

**Mock data:** `MOCK_SONGS` array (5 songs hard-coded inline)

**Sections:**
- Left pane: searchable song list (filtered by `MOCK_SONGS` with local JS filter)
- Center pane: section tab strip + lyrics textarea + add/remove section controls
- Right pane: metadata form (title, artist, key/BPM, CCLI, copyright, year), display overrides, action buttons

**State:** Local `useState` for `selectedSongId`, `activeSection`, `editMode`

**Missing:**
- Load songs from SQLite (`window.luminary.songs.getAll()`)
- Save changes to SQLite (`window.luminary.songs.update()`)
- Create/delete songs via IPC
- Search via SQLite FTS5 (`window.luminary.songs.search()`)
- "Send to Live" must call `window.luminary.output.setSlide()`

---

### `Bible.tsx`

**Location:** `apps/renderer/src/pages/Bible.tsx`

**Mock data:** `MOCK_VERSES` (3 hard-coded verses), `TRANSLATIONS` array

**Sections:**
- Left pane: translation switcher, reference/keyword toggle, search input
- Center pane: book/chapter browser + verse list with selection
- Right pane: projection preview, "Send to Live", "Add to Setlist" buttons

**Missing:**
- All Bible data must come from SQLite via `window.luminary.bible.search()`
- `window.luminary.bible.getTranslations()` to populate translation list
- "Send to Live" must call `window.luminary.output.setSlide()`
- "Add to Setlist" must call `window.luminary.setlists.addItem()`

---

### `Live.tsx`

**Location:** `apps/renderer/src/pages/Live.tsx`

**Mock data:** `MOCK_SETLIST_ITEMS` (3 songs), `MOCK_SLIDES` (verse text fragments)

**Sections:**
- Left pane: setlist item list with LIVE/STANDBY toggle
- Center pane: slide grid (6 slide cards shown)
- Right pane: projection preview + BLANK/LOGO/BLACK/FREEZE buttons + transition selector

**Missing:**
- Load active setlist from `setlistStore`
- Clicking a slide must call `window.luminary.output.setSlide()`
- BLANK/LOGO/BLACK/FREEZE must call respective `window.luminary.output.*` methods
- Keyboard shortcuts (ArrowLeft/Right, Space, Escape, F1–F4, G)
- Disambiguation card overlay when AI fires

---

### `Media.tsx`

**Location:** `apps/renderer/src/pages/Media.tsx`

**Mock data:** `MOCK_MEDIA` (8 assets hard-coded inline)

**Sections:**
- Left sidebar: category tabs (Backgrounds, Announcements, Countdowns, Video Loops)
- Center grid: 3-column thumbnail grid filtered by category
- Right detail panel: file info, tags, Send to Live / Edit Media / Delete

**Missing:**
- Load media from SQLite via `window.luminary.media.getAll(category)`
- Import files via `window.luminary.media.import(filePaths)`
- Delete via `window.luminary.media.delete(id)`
- "Open Library Folder" via `window.luminary.media.openFolder()`
- "Send to Live" via `window.luminary.output.setSlide({ type: 'media', mediaPath: ... })`
- Real thumbnail generation (currently just gradient placeholders)

---

### `Setlist.tsx`

**Location:** `apps/renderer/src/pages/Setlist.tsx`

**Mock data:** `MOCK_SETLISTS` (4 setlists), `SETLIST_ITEMS` (8 items)

**Sections:**
- Left pane: setlist library (recent + templates)
- Center pane: active setlist item list with drag handles, type icons, scheduled times
- Right pane: ProjectionPreview, selected item details, theme/transition overrides, action buttons

**Missing:**
- Load setlists from SQLite via `window.luminary.setlists.getAll()`
- Drag-and-drop reorder must call `window.luminary.setlists.reorderItems()`
- "Add item…" must open a picker and call `window.luminary.setlists.addItem()`
- Export `.luminary` via file save dialog
- "Save as Template" via `window.luminary.setlists.update(id, { isTemplate: true })`

---

### `AIEngine.tsx`

**Location:** `apps/renderer/src/pages/AIEngine.tsx`

**Sections:** Master toggle, Audio Input (device selector + VU meter + sensitivity + calibrate), Inference Engine (model selector), Detection Mode, Confidence Threshold, Live Transcript Buffer

**Simulated behaviour:** VU meter uses `setInterval` with `Math.random()`. Transcript uses a fake word-by-word reveal.

**Missing:**
- `window.luminary.ai.startListening()` / `stopListening()` on toggle
- Real audio level from main process via `onAudioLevel` push event
- Real transcript via `onTranscriptChunk` push event
- Device enumeration via `window.luminary.ai.getAudioDevices()`
- Calibration must call `window.luminary.ai.calibrate()` and await result
- Config changes must call `window.luminary.ai.setConfig()`

---

### `Settings.tsx`

**Location:** `apps/renderer/src/pages/Settings.tsx`

**Sections:** Display Mapping, Global Typography, Bible & Scripture, Backup & Sync

**Missing:**
- `window.luminary.settings.getDisplays()` to populate real display list
- `window.luminary.settings.mapDisplay(id, role)` on role change
- `window.luminary.settings.identifyDisplay(id)` on Identify button click
- All settings mutations must call `window.luminary.settings.set(key, value)`
- "Export Archive" and "Restore from File" via `window.luminary.backup.*`
- Cloud sync provider connection

---

### `Reports.tsx`

**Location:** `apps/renderer/src/pages/Reports.tsx`

**Mock data:** `WEEKLY_DATA` (12 monthly values), `RECENT_SONGS` (7 songs)

**Missing:**
- Load data from SQLite via `window.luminary.reports.getSongUsage(dateRange)`
- "Generate CCLI Report" via `window.luminary.reports.generateCCLIReport(dateRange)`
- "Export CSV" via `window.luminary.reports.exportCSV(dateRange)`
- Date range filter must re-fetch from SQLite when changed

---

### `Licensing.tsx`

**Location:** `apps/renderer/src/pages/Licensing.tsx`

**Missing:**
- `window.luminary.licensing.activateKey(key)` on Activate button click (currently just sets `activated` state locally with a fake timeout)
- On activation success, update `settingsStore.tier` to reflect unlocked tier
- Load current tier from SQLite on mount via `window.luminary.licensing.getTier()`

---

### `Onboarding.tsx`

**Location:** `apps/renderer/src/pages/Onboarding.tsx`

**Missing:**
- Completion must persist state to SQLite via `window.luminary.settings.set('isOnboarded', true)`
- Audio device list must come from `window.luminary.ai.getAudioDevices()`
- Calibration must call `window.luminary.ai.calibrate()`

---

## 6. Shared Components

### `ProjectionPreview.tsx`

**Props:** `{ compact?: boolean, className?: string }`

**Reads from stores:** `serviceStore.projectionText`, `serviceStore.projectionMedia`, `serviceStore.isLive`, `settingsStore.baseFontSize`, `settingsStore.fontWeight`

**Renders:** 16:9 div with dark background; text centred using inline styles from settings.

---

## 7. Utilities

### `apps/renderer/src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage:** `cn('base-class', condition && 'conditional-class')` — used throughout all components for conditional Tailwind class composition.

---

## 8. Styles

### `apps/renderer/src/styles/globals.css`

TailwindCSS base + components + utilities. Defines custom component classes:

| Class | Definition |
|---|---|
| `.btn-primary` | Purple gradient button with glow shadow |
| `.btn-secondary` | Transparent bordered button |
| `.btn-destructive` | Red tinted button |
| `.btn-amber` | Amber/tertiary button |
| `.card` | `bg-surface-container rounded-xl p-4` |
| `.card-hover` | `card` + cursor-pointer hover |
| `.live-indicator` | Green dot + "LIVE" text |
| `.live-dot` | Animated green pulse dot |
| `.section-label` | Small uppercase tracking label |
| `.kbd` | Keyboard shortcut badge |
| `.input` | Form input base |
| `.panel` | Full-height flex column |
| `.floating-panel` | Backdrop-blur overlay panel |
| `.projection-screen` | 16:9 aspect ratio div |
| `.text-gradient` | Purple gradient text |
| `.drag` | `-webkit-app-region: drag` |
| `.no-drag` | `-webkit-app-region: no-drag` |

---

## 9. Design Tokens (TailwindCSS)

Defined in `apps/renderer/tailwind.config.js`:

### Colours
| Token | Hex | Usage |
|---|---|---|
| `surface` | `#13131A` | Page background |
| `surface-low` | `#1B1B22` | Sidebar, panels |
| `surface-container` | `#1F1F26` | Card backgrounds |
| `surface-high` | `#2A2931` | Elevated elements |
| `surface-bright` | `#34343C` | Hover states, separators |
| `primary` | `#6C5CE7` | Accent, active states, primary buttons |
| `primary-dark` | `#4029BA` | Button gradient end |
| `secondary` | `#00B894` | Live/active indicators, success |
| `tertiary` | `#FDCB6E` | Warnings, amber accents |
| `on-surface` | `#FFFFFF` | Primary text |
| `on-surface-variant` | `#C8C4D7` | Secondary text |
| `text-secondary` | `#A0A0B8` | Muted labels |
| `outline-variant` | `#3A3847` | Borders, separators |
| `destructive` | `#FF6B6B` | Errors, delete actions |

### Box Shadows
| Token | Value |
|---|---|
| `shadow-float` | `0 20px 40px rgba(0,0,0,0.5)` |
| `shadow-glow` | `0 0 20px rgba(108,92,231,0.3)` |
| `shadow-glow-green` | `0 0 16px rgba(0,184,148,0.4)` |
| `shadow-glow-amber` | `0 0 16px rgba(253,203,110,0.3)` |

### Animations
| Token | Definition |
|---|---|
| `animate-pulse-slow` | `pulse 3s cubic-bezier(0.4,0,0.6,1) infinite` |
| `animate-fade-in` | `fadeIn 0.2s ease-out` |
| `animate-slide-up` | `slideUp 0.2s ease-out` |

---

## 10. TypeScript Configuration

### Renderer (`apps/renderer/tsconfig.json`)

| Option | Value | Reason |
|---|---|---|
| `target` | `ES2020` | Modern browser + Electron |
| `module` | `ESNext` | Vite handles ESM |
| `moduleResolution` | `bundler` | Vite resolver |
| `jsx` | `react-jsx` | JSX transform |
| `strict` | `true` | Type safety |
| `noUnusedLocals` | `false` | Allows development flexibility |
| `baseUrl` | `.` | Enables `@/*` path aliases |
| `paths["@/*"]` | `["src/*"]` | `@/components/X` resolves to `src/components/X` |

### Main (`apps/main/tsconfig.json`)

| Option | Value | Reason |
|---|---|---|
| `target` | `ES2020` | Node.js compat |
| `module` | `CommonJS` | Required by Electron main |
| `outDir` | `dist` | Compiled output |
| `strict` | `true` | Type safety |
