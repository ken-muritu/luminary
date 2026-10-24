# Luminary — Exhaustive Architectural Documentation

> **Document Type:** Forensic Codebase Analysis  
> **Generated:** 2026-06-04  
> **Scope:** Complete project genesis, architecture, implementation status, and technical debt

---

## Table of Contents

1. [Genesis & Evolution](#1-genesis--evolution)
2. [Core Architecture](#2-core-architecture)
3. [Functional Deep-Dive](#3-functional-deep-dive)
4. [Known Issues & Technical Debt](#4-known-issues--technical-debt)
5. [Conception to Current State](#5-conception-to-current-state)

---

## 1. Genesis & Evolution

### 1.1 Project Origin

**Data Unavailable:** Exact first commit timestamp and initial concept note location. Based on git log analysis, the earliest commits indicate the project began around **April 2026**.

**Git History (15 commits analyzed):**
```
4bf54cb  2026-04-01  docs: add comprehensive project documentation suite + fix code issues
4a2644b  2026-04-05  Updates
449f0b2  2026-04-15  feat: add marketing website, fix bugs, wire .exe build pipeline
30f21fc  2026-05-27  docs: comprehensive end-to-end README with full project lifecycle
d95148b  2026-05-27  feat(phase-1): real data layer — SQLite, Zod IPC, window.luminary API
42b492b  2026-05-27  feat(phase-2): output BrowserWindow, real projection IPC, keyboard shortcuts
be8a7cd  2026-05-28  feat(phase-3): setlists + reports IPC + wire all remaining pages
cb4e0ec  2026-05-28  chore: update vercel.json for monorepo deploy + add netlify.toml
40adaaf  2026-06-03  Implement Luminary 2.0 Core Features
19e86fc  2026-06-03  Remove large binaries from git, update .gitignore
2ab1e8f  2026-06-03  Fix electron-builder config for native modules
ed9d6c2  2026-06-03  Fix native module handling and electron-builder config
e761086  2026-06-03  Add run-luminary.sh launcher script with zod dependency
280d87c  2026-06-03  Update dependencies and launcher script
f18b8bc  2026-06-03  Update README with current implementation status
```

### 1.2 The Core Problem Statement

The project originated from a specific observation documented in the PRD:

> *"Church worship operators carry an enormous cognitive load every Sunday. They type verse references mid-sermon, click through cluttered legacy software (ProPresenter, EasyWorship, MediaShout), and live in constant fear of projecting the wrong slide while a congregation watches. These tools are powerful — but designed in a pre-AI era, and it shows."*

The product vision crystallized as:

> *"An operator should be able to sit at the console, press Go Live, and then do almost nothing for the rest of the sermon."*

### 1.3 Major Architectural Pivots

#### Pivot 1: Three-App Monorepo Structure (May 2026)

**Original Approach:** Single Electron application

**Evolved To:** npm workspaces with three distinct applications:

| App | Purpose | Deployment Target | Build Tool |
|-----|---------|-------------------|------------|
| `apps/main` | Electron main process (Node.js + TypeScript) | Desktop executable | `tsc` |
| `apps/renderer` | Electron renderer UI (React + Vite) | Bundled with main | `Vite` |
| `apps/web` | Marketing website | Vercel CDN | `Vite` |

**Why:** The marketing website needed a completely different build and deployment pipeline from the desktop app. Separating them allowed independent iteration.

**Commit:** `cb4e0ec 2026-05-28`

#### Pivot 2: UI-First "Vibe Coding" Approach (May 2026)

**Decision:** Build the full renderer UI with polished mock data before writing real IPC handlers.

**Rationale:** Validate the design system early and produce a compelling demo fast.

**Cost Incurred:** Backend wiring became the critical path. Every page renders beautifully; most data was initially mock.

**Resolution Phase:** May 27-28, 2026 — Real data layer implementation

#### Pivot 3: Native Module Handling Evolution (June 2026)

**Challenge:** `better-sqlite3` (native C++ SQLite bindings) failed to load in packaged builds with missing `zod` dependency.

**Evolution:**
1. Dynamic require with multiple fallback paths in `database/client.ts`
2. `electron-rebuild` integration in `run-luminary.sh`
3. `asar: false` + `extraResources` configuration
4. **Final:** Add dependencies to root `package.json`, use explicit config flag

**Commits:** `ed9d6c2`, `e761086`, `280d87c` (2026-06-03)

### 1.4 Technology Selection Rationale

| Technology | Selected Over | Rationale |
|------------|---------------|-----------|
| **Electron** | Tauri, Flutter | Cross-platform maturity; GPU/audio access; proven in worship software |
| **React 18** | Vue, Svelte | Ecosystem maturity; concurrent rendering |
| **Vite** | CRA, Webpack | Sub-second HMR; fast cold builds |
| **Zustand** | Redux, MobX | Minimal boilerplate; no ceremony |
| **better-sqlite3** | `sqlite3`, `sql.js` | Synchronous API; embedded; zero-config |
| **Zod** | Joi, Yup | TypeScript-first; excellent error messages |
| **TailwindCSS** | Bootstrap, Material-UI | Design-token consistency without CSS sprawl |
| **Lucide React** | FontAwesome | Consistent stroke weight; tree-shakeable |
| **electron-builder** | `electron-forge` | NSIS/DMG/AppImage out-of-box |

### 1.5 License Model Evolution

**Evolved To:** Three-tier freemium

| Tier | Price | AI Model | Displays | Key Differentiator |
|------|-------|----------|----------|-------------------|
| **Community** | Free | Vosk Small (50MB) | 1 | KJV + ASV only, manual CCLI |
| **Standard** | $99/yr | Whisper Tiny/Base | 2 | All translations, auto CSV export |
| **Pro** | $199/yr | Whisper Small (466MB) | Unlimited | NDI®, Remote API, multi-campus |

---

## 2. Core Architecture

### 2.1 Repository Topology

```
/home/live/Desktop/luminary/
├── .github/workflows/build-release.yml    # CI: Windows .exe on version tag
├── apps/
│   ├── main/                              # Electron main process
│   │   ├── src/
│   │   │   ├── index.ts                   # App entry (253 lines)
│   │   │   ├── preload.ts                 # contextBridge API (114 lines)
│   │   │   ├── database/
│   │   │   │   ├── client.ts              # better-sqlite3 connection
│   │   │   │   └── migrations.ts          # Schema + seed (297 lines)
│   │   │   ├── display/
│   │   │   │   └── outputWindow.ts        # Output + Stage windows (169 lines)
│   │   │   └── ipc/
│   │   │       ├── backup.ts              # Backup/restore handlers
│   │   │       ├── bible.ts               # Bible search handlers
│   │   │       ├── reports.ts             # CCLI reporting handlers
│   │   │       ├── setlists.ts            # Setlist management handlers
│   │   │       ├── settings.ts            # Settings persistence handlers
│   │   │       └── songs.ts               # Song CRUD handlers (180 lines)
│   ├── renderer/                          # Electron renderer
│   │   ├── src/
│   │   │   ├── App.tsx                    # Router + onboarding (69 lines)
│   │   │   ├── components/
│   │   │   │   ├── AppShell.tsx           # Layout shell
│   │   │   │   ├── LiveClock.tsx          # Real-time clock
│   │   │   │   └── ProjectionPreview.tsx  # Live preview
│   │   │   ├── pages/                     # 10 page components
│   │   │   ├── store/                     # Zustand stores
│   │   │   └── types/luminary.d.ts        # TypeScript declarations (253 lines)
│   │   └── public/
│   │       ├── output.html                # Projection window
│   │       └── stage.html                 # Stage display
│   └── web/                               # Marketing website
├── docs/                                  # 8 documentation files
├── build/                                 # Generated icons
├── electron-builder.config.js           # Packaging config
├── package.json                           # Root workspace config
└── run-luminary.sh                        # Linux launcher
```

### 2.2 Electron Process Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              MAIN PROCESS                               │
│  apps/main/src/index.ts                                                 │
│  • Node.js 20 + TypeScript (CommonJS)                                   │
│  • Full OS access: filesystem, SQLite, global shortcuts                 │
│  • BrowserWindow lifecycle                                              │
│  • IPC handler registration                                             │
│  • Content Security Policy enforcement                                  │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
              contextBridge (preload.ts)
                            │
┌───────────────────────────▼─────────────────────────────────────────────┐
│                            RENDERER PROCESS                             │
│  apps/renderer/src/                                                      │
│  • React 18 + Vite + TailwindCSS                                         │
│  • Sandboxed Chromium — NO direct Node.js access                         │
│  • All backend calls via window.luminary.* API                          │
│  • Zustand stores for state management                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 IPC API Surface (11 Domains)

**File:** `apps/renderer/src/types/luminary.d.ts:146-246`

```typescript
window.luminary: {
  songs:     { getAll, getById, create, update, delete, search }
  setlists:  { getAll, getById, create, update, delete, addItem, removeItem, reorderItems }
  bible:     { search, getVerse, getRange, getChapter, getBooks, getTranslations, parseReference }
  media:     { list, import, delete }
  settings:  { getAll, get, set, setBulk }
  reports:   { getUsageLog, logSongUsage, getTopSongs, getMonthlyTotals, getSummary, exportCCLI }
  license:   { validate, getStatus }
  output:    { goLive, endLive, setSlide, setBlank, setLogo, setFreeze, getDisplays, mapDisplay }
  stage:     { open, close, setContent }
  backup:    { create, list, restore, export, import, auto }
  ai:        { startListening, stopListening, setMode, setModel, calibrate }
  app:       { getVersion }
  on:        { verseDetected, aiStatus, displayChanged, systemAlert, outputPreview, shortcut* }
}
```

### 2.4 Database Schema

**File:** `apps/main/src/database/migrations.ts`

```sql
-- Core Tables
songs              ← Song library with metadata (CCLI, copyright, etc.)
song_sections      ← Lyrics broken into verses/choruses/bridges
setlists           ← Service plans with dates
setlist_items      ← Individual entries in a setlist
media_assets       ← Backgrounds, videos, countdowns
song_usage_log     ← CCLI compliance tracking
settings           ← Key-value app configuration

-- Bible Tables
bible_translations ← Available translations (KJV, NKJV, NLT, etc.)
bible_books        ← 66 canonical books
bible_verses       ← Individual verse text
bible_verses_fts   ← FTS5 virtual table for full-text search
```

---

## 3. Functional Deep-Dive

### Legend
- **✅ Working:** Fully implemented
- **🔧 Partial:** Core logic exists, edges incomplete
- **🔶 UI Only:** Visual complete, backend not wired
- **❌ Not Started:** Placeholder or missing

### 3.1 Application Shell

**Status:** ✅ Working

**Features:**
- Left sidebar (10 routes): ✅ Working
- Top bar with clock: ✅ Working
- Sidebar live preview thumbnail: ✅ Working
- Native drag region: ✅ Working
- Keyboard shortcuts: ✅ Working (11 shortcuts registered)

**Keyboard Shortcuts (index.ts:212-222):**
```typescript
globalShortcut.register('Space',  () => send('shortcut:nextSection'))
globalShortcut.register('Right',  () => send('shortcut:nextSection'))
globalShortcut.register('Left',   () => send('shortcut:prevSection'))
globalShortcut.register('Down',   () => send('shortcut:nextItem'))
globalShortcut.register('Up',     () => send('shortcut:prevItem'))
globalShortcut.register('Escape', () => send('shortcut:clearProjection'))
globalShortcut.register('B',      () => send('shortcut:toggleBlackout'))
globalShortcut.register('F',      () => send('shortcut:toggleFreeze'))
globalShortcut.register('L',      () => send('shortcut:toggleLogo'))
globalShortcut.register('G',      () => send('shortcut:goLive'))
globalShortcut.register('F1',     () => send('shortcut:goLive'))
```

### 3.2 Onboarding System

**Status:** 🔧 Partial

**Working:**
- 3-step wizard UI: ✅
- Framer Motion transitions: ✅
- Form validation: ✅

**Not Working:**
- Language selection only in local state ❌
- Audio device selector hardcoded ❌
- VU meter simulated (no real audio) ❌
- Calibration fake (3s timer) ❌

**Technical Debt:** `isOnboarded` persisted to `localStorage` only, not SQLite.

### 3.3 Song Manager

**Status:** 🔧 Partial (Backend ✅, Frontend 🔶)

**Backend (ipc/songs.ts:180 lines):**
```typescript
// Zod-validated schemas
const SongCreateSchema = z.object({
  title: z.string().min(1).max(500),
  artist: z.string().max(200).default(''),
  // ... 10 more fields
})

// All CRUD handlers implemented:
ipcMain.handle('songs:getAll', () => { /* SQL with GROUP_CONCAT sections */ })
ipcMain.handle('songs:getById', ...)
ipcMain.handle('songs:create', ...)
ipcMain.handle('songs:update', ...)
ipcMain.handle('songs:delete', ...)
ipcMain.handle('songs:search', ...)
```

**Frontend Issue:** Uses `MOCK_SONGS` instead of `window.luminary.songs.getAll()`

### 3.4 Bible Engine

**Status:** 🔧 Partial

**Working:**
- 3-pane layout: ✅
- Translation switcher (6 translations): ✅
- FTS5 virtual table with triggers: ✅

**Partial:**
- Reference lookup: 🔶 (Only John 3:16-18 seeded)

**Not Working:**
- Full Bible database ❌ (31,102 verses × 6 translations not seeded)
- Send to Live ❌

### 3.5 AI Voice Engine

**Status:** 🔶 UI Only (Backend ❌)

**UI:** Complete with model selector, sensitivity, calibration

**Backend (index.ts:198-202):**
```typescript
ipcMain.handle('ai:startListening', async () => {})  // NOOP
ipcMain.handle('ai:stopListening',  async () => {})  // NOOP
ipcMain.handle('ai:setMode',        async (_e, mode) => ({ success: true, mode }))
ipcMain.handle('ai:setModel',       async (_e, model) => ({ success: true, model }))
ipcMain.handle('ai:calibrate',      async () => ({ success: true, noiseFloor: -42 }))
```

**Missing Pipeline:** AudioCapture → VAD → ModelRunner → VerseDetector → CueEmitter

### 3.6 Output & Stage Windows

**Status:** ✅ Working

**Implementation (outputWindow.ts:169 lines):**
```typescript
export function createOutputWindow(): BrowserWindow {
  const displays = screen.getAllDisplays()
  const target = displays.find(d => d.id !== screen.getPrimaryDisplay().id) ?? displays[0]
  
  outputWin = new BrowserWindow({
    x, y, width, height: target.bounds,
    frame: false,
    fullscreen: true,
    alwaysOnTop: true,
    backgroundColor: '#000000',
    webPreferences: { contextIsolation: false, sandbox: true }
  })
  
  outputWin.loadFile(htmlPath)
  return outputWin
}
```

**Features:**
- Output window creation: ✅
- Stage display window: ✅
- Slide pushing: ✅
- Blank/Logo/Freeze controls: ✅

### 3.7 Settings Persistence

**Status:** ✅ Working

**Implementation (ipc/settings.ts):**
```typescript
ipcMain.handle('settings:getAll', () => { /* SELECT * FROM settings */ })
ipcMain.handle('settings:set', (_e, { key, value }) => { /* UPSERT */ })
ipcMain.handle('settings:setBulk', (_e, data) => { /* Transaction */ })
```

**Persisted Settings:**
- `isOnboarded`, `defaultTranslation`, `showVerseNumbers`
- `fontFamily`, `baseFontSize`, `fontWeight`, `shadowDepth`, `glowDepth`
- `autoBackup`, `cloudSync`, `reducedMotion`, `largeFontMode`
- `licenseTier`, `licenseKey`, `language`

### 3.8 CCLI Reporting

**Status:** 🔧 Partial

**Backend (ipc/reports.ts):**
```typescript
ipcMain.handle('reports:getUsageLog', ...)
ipcMain.handle('reports:logSongUsage', ...)
ipcMain.handle('reports:getTopSongs', ...)
ipcMain.handle('reports:getMonthlyTotals', ...)
ipcMain.handle('reports:exportCCLI', ...)  // Returns CSV string
```

**Frontend:** Reports page renders bar chart on mock data.

**Not Working:** Song usage logging on projection ❌

---

## 4. Known Issues & Technical Debt

### 4.1 Critical Blockers (P0)

| Issue | Impact | Location | Fix Required |
|-------|--------|----------|--------------|
| AI audio capture missing | Core AI feature non-functional | `index.ts:198-202` | Integrate PortAudio/naudiodon |
| Full Bible not seeded | Bible search limited to 18 verses | `migrations.ts:260-296` | Import full Bible data |
| License tier not enforced | Pro features freely accessible | `index.ts:123-126` | Implement HMAC validation |

### 4.2 Mock Data Replacements Needed

| File | Mock Constant | IPC Method to Use |
|------|---------------|-------------------|
| `Songs.tsx` | `MOCK_SONGS` | `window.luminary.songs.getAll()` |
| `ServiceMode.tsx` | `MOCK_SETLISTS` | `window.luminary.setlists.getAll()` |
| `Bible.tsx` | `MOCK_VERSES` | `window.luminary.bible.getVerse()` |
| `Media.tsx` | `MOCK_MEDIA` | `window.luminary.media.list()` |
| `Setlist.tsx` | `MOCK_SETLIST_ITEMS` | `window.luminary.setlists.getById()` |
| `Reports.tsx` | `WEEKLY_DATA` | `window.luminary.reports.getMonthlyTotals()` |

### 4.3 Package Dependencies Missing

| Library | Purpose | Install Command |
|---------|---------|-----------------|
| `@dnd-kit/core` | Drag-and-drop for setlists | `npm i @dnd-kit/core @dnd-kit/sortable` |
| `naudiodon` or `node-portaudio` | Audio capture | `npm i naudiodon` |
| `vosk` | Offline ASR (Community tier) | `npm i vosk` |
| `sharp` | Thumbnail generation | `npm i sharp` |

### 4.4 Security Considerations

1. **CSP Configuration (index.ts:62-71):**
   ```typescript
   const csp = "default-src 'self'; script-src 'self'; ..."
   ```
   - ✅ No `unsafe-eval`
   - ✅ No external connect-src except localhost (dev only)
   - ⚠️ `style-src 'unsafe-inline'` required for Tailwind

2. **IPC Validation:**
   - ✅ All IPC handlers use Zod schema validation
   - ✅ Preload exposes only whitelisted channels

3. **License Validation:**
   - ❌ Currently returns hardcoded `valid: false, tier: 'community'`
   - ❌ No HMAC-SHA256 implementation

---

## 5. Conception to Current State

### 5.1 Narrative Timeline

**April 2026 — Documentation & Architecture Phase**
- PRD written defining four pillars: offline-first, AI-augmented, premium UI, operator respect
- Architecture documents created: IPC model, database schema, AI pipeline
- Initial technology choices finalized

**May 27, 2026 — Phase 1: Core Infrastructure**
- SQLite + better-sqlite3 integration
- Database migrations with full schema
- IPC handlers with Zod validation
- Preload API implementation
- Settings persistence working

**May 27, 2026 — Phase 2: Live Projection**
- Output BrowserWindow implementation
- Stage display window
- Keyboard shortcuts registration
- IPC handlers for output control

**May 28, 2026 — Phase 3: Features**
- Bible search IPC with FTS5
- Setlist management with drag-drop support (UI only)
- CCLI reporting backend
- All remaining pages wired to IPC

**June 3, 2026 — Native Module Fixes**
- Discovered `zod` and `bcryptjs` missing from packaged build
- Fixed electron-builder configuration
- Added `asar: false` and explicit dependency inclusion
- Created `run-luminary.sh` launcher script

### 5.2 Lines of Code Analysis

| Component | Lines | Status |
|-----------|-------|--------|
| `apps/main/src/index.ts` | 253 | Core app logic |
| `apps/main/src/preload.ts` | 114 | IPC bridge |
| `apps/main/src/ipc/songs.ts` | 180 | Song CRUD |
| `apps/main/src/database/migrations.ts` | 297 | Schema |
| `apps/renderer/src/store/serviceStore.ts` | 109 | State |
| `apps/renderer/src/types/luminary.d.ts` | 253 | Types |
| **Total TypeScript** | ~2,500 | Core implementation |
| Documentation (`docs/`) | ~150KB | 8 files |

### 5.3 Test Coverage

**Status:** ❌ No automated tests detected

**Test Infrastructure Needed:**
- Unit tests for IPC handlers (vitest + `electron-mock`)
- E2E tests for critical flows (Playwright)
- Database migration tests

---

## 6. Appendix: File References

### Core Implementation Files

| File | Purpose | Lines |
|------|---------|-------|
| `/home/live/Desktop/luminary/apps/main/src/index.ts` | Main process entry | 253 |
| `/home/live/Desktop/luminary/apps/main/src/preload.ts` | IPC bridge | 114 |
| `/home/live/Desktop/luminary/apps/main/src/database/client.ts` | SQLite connection | 56 |
| `/home/live/Desktop/luminary/apps/main/src/database/migrations.ts` | Schema + seed | 297 |
| `/home/live/Desktop/luminary/apps/main/src/display/outputWindow.ts` | Output windows | 169 |
| `/home/live/Desktop/luminary/apps/main/src/ipc/songs.ts` | Song handlers | 180 |
| `/home/live/Desktop/luminary/apps/renderer/src/App.tsx` | React entry | 69 |
| `/home/live/Desktop/luminary/apps/renderer/src/store/serviceStore.ts` | Service state | 109 |
| `/home/live/Desktop/luminary/apps/renderer/src/types/luminary.d.ts` | TypeScript types | 253 |
| `/home/live/Desktop/luminary/electron-builder.config.js` | Packaging config | 62 |

### Documentation Files

| File | Size | Contents |
|------|------|----------|
| `/home/live/Desktop/luminary/docs/PRD.md` | 36,651 bytes | Product requirements |
| `/home/live/Desktop/luminary/docs/ARCHITECTURE.md` | 19,881 bytes | System architecture |
| `/home/live/Desktop/luminary/docs/TECHNICAL_SPEC.md` | 33,891 bytes | Per-file reference |
| `/home/live/Desktop/luminary/docs/DATABASE_SCHEMA.md` | 22,484 bytes | SQLite schema |
| `/home/live/Desktop/luminary/docs/IPC_API.md` | 28,874 bytes | IPC reference |
| `/home/live/Desktop/luminary/docs/FEATURE_STATUS.md` | 19,701 bytes | Status tracker |
| `/home/live/Desktop/luminary/docs/DEV_GUIDE.md` | 22,806 bytes | Developer guide |
| `/home/live/Desktop/luminary/docs/DEPLOYMENT.md` | 4,874 bytes | Deployment guide |

---

*Generated for Principal Architect review.  
© 2026 Kennedy Muritu · Luminary v2.0.0*
