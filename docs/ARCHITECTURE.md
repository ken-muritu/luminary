# Luminary — System Architecture

**Version:** 2.0.0  
**Last Updated:** April 2026

---

## 1. High-Level Overview

Luminary is a monorepo Electron application. It has two npm workspace packages — the Electron main process and the React renderer — that communicate exclusively through a typed IPC bridge.

```
luminary/                          ← Monorepo root (npm workspaces)
├── apps/
│   ├── main/                      ← Electron main process (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts           ← Entry: creates windows, registers IPC handlers
│   │   │   ├── preload.ts         ← contextBridge: exposes window.luminary API
│   │   │   ├── database/          ← SQLite layer (better-sqlite3)
│   │   │   ├── ipc/               ← IPC handler modules (songs, bible, setlists…)
│   │   │   ├── ai/                ← AI voice engine (Vosk/Whisper runners)
│   │   │   ├── display/           ← Output window manager, NDI
│   │   │   └── backup/            ← Backup/restore/cloud sync
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── renderer/                  ← React + Vite UI (runs in Chromium)
│       ├── src/
│       │   ├── main.tsx           ← React entry point
│       │   ├── App.tsx            ← Router + layout shell
│       │   ├── pages/             ← One file per page
│       │   ├── components/        ← Shared components
│       │   ├── store/             ← Zustand state stores
│       │   ├── lib/               ← Utilities (cn, ipc bridge helpers)
│       │   └── styles/            ← Tailwind globals
│       ├── index.html
│       ├── tailwind.config.js
│       ├── vite.config.ts
│       └── package.json
├── docs/                          ← Project documentation
├── build/                         ← electron-builder assets (icons, entitlements)
├── electron-builder.config.js
└── package.json                   ← Workspace root + scripts
```

---

## 2. Electron Process Model

Electron runs three distinct JavaScript contexts simultaneously:

### 2.1 Main Process (`apps/main/src/index.ts`)

- **Runtime:** Node.js (full OS access, no browser sandbox)
- **Singleton:** One per application instance
- **Responsibilities:**
  - Create and lifecycle-manage all `BrowserWindow` instances
  - Register all `ipcMain.handle()` handlers
  - Own all SQLite database connections (via `better-sqlite3`)
  - Manage the AI voice engine (child process or Worker Thread)
  - Handle system tray icon and context menu
  - Register global keyboard shortcuts
  - Manage auto-updater
  - Enumerate and monitor connected displays
  - Write to the file system (backups, media imports, exports)

- **What it never does:** Render any UI. It has no DOM access.

### 2.2 Renderer Process (`apps/renderer/src/`)

- **Runtime:** Chromium (sandboxed, no direct Node.js access)
- **Instances:** One per open `BrowserWindow` (operator window, output window, stage display window)
- **Responsibilities:**
  - Render the React application
  - Manage local UI state via Zustand stores
  - Call `window.luminary.*` methods to invoke main-process operations
  - Listen to push events from the main process via `window.luminary.on*()`
  - Render slides in the output and stage display windows

- **What it never does:** Access the file system, spawn processes, or call Node.js APIs directly.

### 2.3 Preload Script (`apps/main/src/preload.ts`)

- **Runtime:** Runs in the renderer's context, but with Node.js bridge access
- **Executes before:** The renderer's own JavaScript
- **Purpose:** Uses `contextBridge.exposeInMainWorld('luminary', { ... })` to construct the `window.luminary` API surface
- **Security role:** The only place renderer→main communication is permitted. Every IPC channel that the renderer can access must be explicitly listed here. This prevents any renderer-side code from invoking arbitrary IPC channels.

---

## 3. Window Architecture

Luminary manages up to three `BrowserWindow` instances concurrently:

```
┌─────────────────────────────────────────────────────────────────┐
│  OPERATOR WINDOW                                                │
│  BrowserWindow #1 (always present)                             │
│  - Loads: localhost:5173 (dev) / renderer/dist/index.html (prod)│
│  - Size: 1280×800 minimum, user-resizable                      │
│  - frame: false (custom title bar via drag/no-drag CSS)        │
│  - webSecurity: true, nodeIntegration: false                   │
│  - Shows all pages: Dashboard, Songs, Bible, Live, etc.        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT WINDOW (Main Congregation Display)                      │
│  BrowserWindow #2 (created on "Go Live"; hidden by default)    │
│  - Loads: renderer/dist/output.html (dedicated output renderer)│
│  - Fullscreen on the display mapped to role: "main"            │
│  - show: false → show: true on "Go Live" command               │
│  - skipTaskbar: true, alwaysOnTop: true                        │
│  - Renders: slide text, backgrounds, video, blank/logo overlays│
│  - Updated via IPC: output:setSlide, output:setBlank, etc.     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STAGE DISPLAY WINDOW (Pro tier only)                           │
│  BrowserWindow #3                                              │
│  - Loads: renderer/dist/stage.html                             │
│  - Fullscreen on display mapped to role: "stage"              │
│  - Shows: current slide preview, next slide, timer, notes      │
│  - Updated via IPC: stage:setContent                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. IPC Communication Architecture

All renderer → main communication flows through a single typed pipeline:

```
React Component
    │
    ▼
window.luminary.songs.getAll()          ← contextBridge method call
    │
    ▼
preload.ts: ipcRenderer.invoke('songs:getAll')
    │
    ▼  [crosses process boundary via Electron IPC]
    │
    ▼
main/ipc/songs.ts: ipcMain.handle('songs:getAll', async () => {
    return db.songs.getAll()            ← synchronous SQLite query
})
    │
    ▼
Result serialised as JSON, returned to renderer
    │
    ▼
React Component receives resolved Promise<Song[]>
```

### 4.1 Push Events (Main → Renderer)

For events that the main process needs to push to the renderer (AI detections, display changes, etc.):

```
Main process:
    operatorWindow.webContents.send('ai:verseDetected', { reference, confidence, text })

Preload:
    ipcRenderer.on('ai:verseDetected', (_, data) => callback(data))
    contextBridge.exposeInMainWorld('luminary', {
        onVerseDetected: (cb) => ipcRenderer.on('ai:verseDetected', (_, data) => cb(data))
    })

React:
    useEffect(() => {
        window.luminary.onVerseDetected((detection) => {
            aiStore.addCueItem(detection)
        })
    }, [])
```

### 4.2 IPC Channel Naming Convention

All channels use `domain:action` format:
- `songs:getAll` — get all songs
- `songs:create` — create a song
- `songs:update` — update a song
- `songs:delete` — delete a song
- `bible:search` — search the Bible
- `setlists:getAll` — get all setlists
- `output:setSlide` — push a slide to the output window
- `ai:startListening` — start AI listening
- `display:getAll` — get all connected displays

Full channel listing: see `docs/IPC_API.md`.

---

## 5. Database Architecture

### 5.1 Primary Database

File: `<userData>/luminary.db`  
Engine: SQLite via `better-sqlite3` (synchronous API, main process only)  
Journal mode: WAL (Write-Ahead Logging) — crash-safe, allows concurrent reads  

```
luminary.db
├── songs              — song metadata and display overrides
├── song_sections      — lyric sections per song (ordered)
├── setlists           — service plans (named, dated, optionally template)
├── setlist_items      — ordered items within each setlist
├── media_assets       — media file registry (path-based)
├── song_usage_log     — CCLI-compliant projection event log
└── settings           — key-value application settings
```

### 5.2 Bible Databases

Each translation is a separate SQLite file:

| File | Contents | Bundled |
|---|---|---|
| `<userData>/bibles/bible-kjv.db` | 31,102 KJV verses | Yes |
| `<userData>/bibles/bible-asv.db` | 31,102 ASV verses | Yes |
| `<userData>/bibles/bible-niv.db` | NIV verses | On license activation |
| `<userData>/bibles/bible-esv.db` | ESV verses | On license activation |
| `<userData>/bibles/bible-nasb.db` | NASB verses | On license activation |
| `<userData>/bibles/bible-nkjv.db` | NKJV verses | On license activation |

Each bible database has the same schema:
```sql
CREATE TABLE books (
    id       INTEGER PRIMARY KEY,
    name     TEXT NOT NULL,
    abbrev   TEXT NOT NULL,
    testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
    chapters INTEGER NOT NULL
);

CREATE TABLE verses (
    id       INTEGER PRIMARY KEY,
    book_id  INTEGER NOT NULL REFERENCES books(id),
    chapter  INTEGER NOT NULL,
    verse    INTEGER NOT NULL,
    text     TEXT NOT NULL,
    UNIQUE (book_id, chapter, verse)
);

CREATE VIRTUAL TABLE verses_fts USING fts5(
    text,
    content=verses,
    content_rowid=id
);
```

Full schema: see `docs/DATABASE_SCHEMA.md`.

---

## 6. State Management (Renderer)

The renderer uses **Zustand** for all client-side state. Stores are the single source of truth for UI state. Persistent application data (songs, setlists, settings) is authoritative in SQLite — stores are hydrated from SQLite on app start via IPC.

### Store Overview

| Store File | Domain | Persisted to SQLite? |
|---|---|---|
| `store/serviceStore.ts` | Live state: isLive, isOnboarded, currentItem, projectionText | Partially (isOnboarded) |
| `store/bibleStore.ts` | Bible search: query, results, selectedVerse, translation | No (session only) |
| `store/songStore.ts` | Song CRUD: list, selection, search filter | Via IPC to SQLite |
| `store/settingsStore.ts` | All settings: displays, typography, tier, licenseKey | Via IPC to SQLite |
| `store/aiStore.ts` | AI engine: mode, model, sensitivity, confidence, isListening | Via IPC to SQLite |

### Hydration Pattern

On app start (`App.tsx` `useEffect`):
1. Call `window.luminary.settings.getAll()` → populate `settingsStore`
2. Call `window.luminary.songs.getAll()` → populate `songStore`
3. Call `window.luminary.setlists.getAll()` → populate setlist state
4. Call `window.luminary.ai.getConfig()` → populate `aiStore`

On any store mutation (e.g. `settingsStore.setFontFamily('Georgia')`):
1. Update Zustand store immediately (optimistic UI)
2. Call `window.luminary.settings.set('fontFamily', 'Georgia')` (background, no await)

---

## 7. AI Voice Engine Architecture

```
Main Process
└── AIEngine class (apps/main/src/ai/engine.ts)
      │
      ├── AudioCapture (naudiodon or node-portaudio binding)
      │     └── 16kHz mono PCM stream → circular buffer
      │
      ├── ModelRunner (abstract)
      │     ├── VoskRunner  (Community)   — vosk-browser or vosk-node binding
      │     └── WhisperRunner (Standard/Pro) — whisper.cpp via child_process or ffi-napi
      │
      ├── TranscriptBuffer
      │     └── Rolling 30-second window of recognised text
      │         (in-memory only, never written to disk)
      │
      ├── VerseDetector
      │     ├── Pass 1: canonical regex   — "John 3:16", "Genesis 1:1"
      │     ├── Pass 2: spoken regex      — "john chapter three verse sixteen"
      │     ├── Pass 3: partial reference — "verse 16" (uses last known book/chapter)
      │     └── Returns: { reference, book, chapter, verse, confidence }
      │
      └── CueEmitter
            ├── confidence >= threshold + mode === 'auto'
            │     → ipcMain: trigger output:setSlide immediately
            ├── confidence >= threshold + mode === 'assisted'
            │     → operatorWindow.webContents.send('ai:verseDetected', payload)
            └── confidence < threshold (any mode)
                  → operatorWindow.webContents.send('ai:disambiguate', payload)
```

The AI engine runs in a **Worker Thread** (Node.js `worker_threads` module) to avoid blocking the main thread during inference. Communication between the Worker and the main thread uses `worker.postMessage()` / `parentPort.on('message')`.

---

## 8. Output Rendering Architecture

### 8.1 Slide Data Model

A "slide" sent to the output window via IPC has this shape:

```typescript
interface OutputSlide {
  type: 'song' | 'verse' | 'media' | 'blank' | 'logo'
  text?: string          // Primary lyric or verse text
  reference?: string     // Bible reference (verse type only)
  mediaPath?: string     // Absolute path to background image/video
  theme: SlideTheme      // Typography and display overrides
}

interface SlideTheme {
  fontFamily: string
  fontSize: number       // px
  fontWeight: number     // 600 | 700 | 900
  textAlign: 'left' | 'center' | 'right'
  shadowDepth: number    // 0–100
  glowDepth: number      // 0–100
  backgroundColor: string
  transition: 'crossfade' | 'cut' | 'dissolve'
}
```

### 8.2 Output Window Rendering Pipeline

```
Operator clicks slide
    │
    ▼
serviceStore.setCurrentSlide(slide)
    │
    ▼
window.luminary.output.setSlide(slide)    ← IPC invoke
    │
    ▼
main: outputWindow.webContents.send('output:slide', slide)
    │
    ▼
output BrowserWindow:
    ipcRenderer.on('output:slide', (_, slide) => setState(slide))
    │
    ▼
React re-renders with new slide
    │
    ▼
CSS transition animates the change (crossfade / dissolve / cut)
```

---

## 9. Build & Packaging Pipeline

### 9.1 Development Mode

```
npm run dev
  │
  ├── npm run dev:renderer  →  vite (apps/renderer/) → localhost:5173
  └── npm run dev:main      →  tsc -w (apps/main/src/) → apps/main/dist/
                                  + electron apps/main/dist/index.js
                                  (Electron loads operator window at localhost:5173)
```

### 9.2 Production Build

```
npm run build
  │
  ├── npm run build:renderer  →  vite build → apps/renderer/dist/
  └── npm run build:main      →  tsc → apps/main/dist/

npm run dist
  │
  └── electron-builder
        ├── Bundles: apps/main/dist/ + apps/renderer/dist/ + package.json
        ├── Windows  → dist-electron/Luminary Setup 2.0.0.exe  (NSIS installer)
        ├── macOS    → dist-electron/Luminary-2.0.0.dmg        (signed DMG)
        └── Linux    → dist-electron/Luminary-2.0.0.AppImage   (portable)
```

### 9.3 Required Build Assets

The `build/` directory (not yet committed) must contain:

| File | Purpose |
|---|---|
| `build/icon.ico` | Windows taskbar and installer icon (256×256) |
| `build/icon.icns` | macOS Dock icon (1024×1024 with multiple sizes) |
| `build/icon.png` | Linux AppImage icon (512×512) |
| `build/entitlements.mac.plist` | macOS hardened runtime entitlements |

---

## 10. Security Architecture

### 10.1 Renderer Sandbox

All `BrowserWindow` instances are configured with:
```typescript
webPreferences: {
  nodeIntegration: false,       // Renderer cannot call Node APIs
  contextIsolation: true,        // preload and renderer have separate contexts
  sandbox: true,                 // Full Chromium sandbox
  preload: path.join(__dirname, 'preload.js'),
  webSecurity: true,
}
```

### 10.2 Content Security Policy

Applied via `session.defaultSession.webRequest.onHeadersReceived`:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: file:;
  media-src 'self' file:;
  connect-src 'self' http://localhost:5173 ws://localhost:5173;
```

### 10.3 contextBridge Surface

The preload exposes only explicitly whitelisted operations:
```typescript
contextBridge.exposeInMainWorld('luminary', {
  songs:    { getAll, getById, create, update, delete: del, import: imp, export: exp },
  bible:    { search, getVerse, getChapter, getTranslations },
  setlists: { getAll, getById, create, update, delete: del, addItem, removeItem, reorderItems },
  media:    { getAll, import: imp, delete: del, getCategories },
  output:   { setSlide, setBlank, setLogo, setFreeze, goLive, endLive },
  settings: { getAll, set, getDisplays },
  ai:       { startListening, stopListening, setMode, setModel, setConfig, calibrate },
  reports:  { getSongUsage, generateCCLIReport, exportCSV },
  licensing:{ getTier, activateKey, validateKey },
  backup:   { export: exp, import: imp, runAutoBackup },
  // Push event subscriptions
  onVerseDetected:    (cb) => void,
  onDisambiguate:     (cb) => void,
  onDisplayChanged:   (cb) => void,
  onLiveStatusChange: (cb) => void,
})
```

### 10.4 License Validation (Offline)

License keys are validated using HMAC-SHA256:
1. The key encodes: tier, expiry date, device fingerprint hash, HMAC signature
2. The main process recomputes the HMAC using an embedded signing key and compares
3. No network request is made
4. Hardware fingerprint = SHA256(CPU ID + MAC address + motherboard serial)

---

## 11. Technology Stack Summary

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Desktop shell | Electron | 30.x | Cross-platform, broad hardware support |
| Main process language | TypeScript (CommonJS) | 5.4 | Type safety, IDE support |
| Renderer framework | React | 18.3 | Mature, large ecosystem |
| Renderer build | Vite | 5.x | Sub-second HMR, fast cold builds |
| Renderer language | TypeScript (ESM) | 5.4 | Type safety |
| Styling | TailwindCSS | 3.4 | Utility-first, design token consistency |
| Animation | Framer Motion | 11.x | High-quality transitions |
| State management | Zustand | 4.5 | Minimal boilerplate, DevTools support |
| Routing | React Router DOM | 6.x | Declarative, code-split ready |
| Icons | Lucide React | 0.378 | Consistent, tree-shakeable |
| Database | SQLite (better-sqlite3) | latest | Synchronous, embedded, zero-config |
| Schema validation | Zod | latest | Runtime type safety for IPC payloads |
| Packaging | electron-builder | latest | NSIS, DMG, AppImage targets |
| Process management | concurrently | latest | Parallel dev:main + dev:renderer |
