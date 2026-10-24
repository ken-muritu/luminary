# Luminary — Developer Guide

**Version:** 2.0.0  
**Last Updated:** April 2026

This guide covers everything needed to set up, run, develop, build, and ship Luminary. It is written for a developer picking up the project for the first time.

---

## 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | Required. Use `nvm` or `fnm` to manage versions |
| npm | 10.x | Bundled with Node.js 20 |
| Git | 2.x | |
| Windows | 10/11 | Primary development platform |
| macOS | 12+ | Secondary platform |
| Python | 3.11+ | Required by `node-gyp` (for native modules like `better-sqlite3`) |
| Visual Studio Build Tools | 2019 or 2022 | **Windows only** — required for native module compilation |
| Xcode Command Line Tools | latest | **macOS only** — `xcode-select --install` |

### Windows: Installing Build Tools

```powershell
# Run as Administrator
npm install --global windows-build-tools
# Or install Visual Studio Build Tools manually from:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Select: "Desktop development with C++"
```

### macOS: Xcode CLT

```bash
xcode-select --install
```

---

## 2. Getting Started

### 2.1 Clone the Repository

```bash
git clone https://github.com/ken-muritu/luminary.git
cd luminary
```

### 2.2 Important: Path Length on Windows

The project is currently located inside OneDrive (`C:\Users\kenho\OneDrive\...`). OneDrive's background sync can interfere with `npm install` for packages with many files (notably `lucide-react`). Two options:

**Option A (Recommended) — Move project out of OneDrive:**
```powershell
# Move to a short path
xcopy /E /I "C:\Users\kenho\OneDrive\Desktop\kizito\projects\luminary\luminary" "C:\dev\luminary"
cd C:\dev\luminary
```

**Option B — Pause OneDrive during install:**
Right-click the OneDrive system tray icon → Pause syncing for 2 hours → run `npm install` → resume syncing.

### 2.3 Install Dependencies

```bash
# All commands use cmd /c prefix on Windows (PowerShell execution policy restriction)
cmd /c npm install
```

If `lucide-react` fails (TAR_ENTRY_ERROR on Windows/OneDrive), run separately:
```bash
cmd /c npm install lucide-react --workspace=apps/renderer
```

### 2.4 Verify Installation

```bash
cmd /c npm ls --depth=0
# Should show luminary@2.0.0 with workspaces listed
```

---

## 3. Running in Development

### 3.1 Renderer Only (UI Development)

The fastest way to iterate on UI. Opens the React app in a browser — no Electron required.

```bash
cmd /c npm run dev:renderer
# Vite dev server starts at http://localhost:5173
# Hot Module Replacement (HMR) is active — changes reflect instantly
```

Use this for:
- Page layout and component work
- TailwindCSS styling
- Zustand store logic
- Any work that doesn't need IPC or native modules

### 3.2 Full Electron Development

Runs both the main process (with watch-mode TypeScript compilation) and the renderer simultaneously.

```bash
cmd /c npm run dev
```

What this does:
1. `npm run dev:renderer` → Vite starts on `localhost:5173`
2. `npm run dev:main` → TypeScript compiles `apps/main/src/` to `apps/main/dist/` in watch mode, then launches Electron pointing the operator window at `localhost:5173`

**Note:** The main process restarts when TypeScript recompiles. The renderer HMR is independent.

### 3.3 Environment Detection

In `apps/main/src/index.ts`, the app detects dev vs production:
```typescript
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Dev: load from Vite dev server
if (isDev) {
  win.loadURL('http://localhost:5173')
} else {
  win.loadFile(path.join(__dirname, '../renderer/dist/index.html'))
}
```

### 3.4 DevTools

In dev mode, DevTools opens automatically. To toggle:
- **Operator window:** `CmdOrCtrl+Shift+I`
- Or add `win.webContents.openDevTools()` to `index.ts`

---

## 4. Project Structure Walkthrough

```
luminary/
├── apps/
│   ├── main/                      ← Electron main process
│   │   ├── src/
│   │   │   ├── index.ts           ← App entry: window creation, IPC registration, tray
│   │   │   ├── preload.ts         ← [MUST CREATE] contextBridge surface
│   │   │   ├── database/          ← [MUST CREATE] SQLite modules
│   │   │   │   ├── init.ts        ← DB connection, pragma setup, migration runner
│   │   │   │   ├── migrations.ts  ← All DDL migrations (versioned)
│   │   │   │   ├── songs.ts       ← Songs CRUD
│   │   │   │   ├── sections.ts    ← Song sections CRUD
│   │   │   │   ├── setlists.ts    ← Setlists CRUD
│   │   │   │   ├── setlist-items.ts ← Items CRUD + reorder
│   │   │   │   ├── media.ts       ← Media assets CRUD
│   │   │   │   ├── usage-log.ts   ← Append-only projection log + report queries
│   │   │   │   ├── settings.ts    ← Key-value settings
│   │   │   │   ├── displays.ts    ← Display mapping
│   │   │   │   └── bible.ts       ← Bible search (per-translation DB file)
│   │   │   ├── ipc/               ← [MUST CREATE] IPC handler modules
│   │   │   │   ├── songs.ts       ← Registers songs:* handlers
│   │   │   │   ├── bible.ts       ← Registers bible:* handlers
│   │   │   │   ├── setlists.ts    ← Registers setlists:* handlers
│   │   │   │   ├── output.ts      ← Registers output:* handlers
│   │   │   │   ├── media.ts       ← Registers media:* handlers
│   │   │   │   ├── settings.ts    ← Registers settings:* handlers
│   │   │   │   ├── ai.ts          ← Registers ai:* handlers
│   │   │   │   ├── reports.ts     ← Registers reports:* handlers
│   │   │   │   ├── licensing.ts   ← Registers licensing:* handlers
│   │   │   │   └── backup.ts      ← Registers backup:* handlers
│   │   │   ├── display/           ← [MUST CREATE] Window management
│   │   │   │   └── outputWindow.ts← Creates, positions, and manages output BrowserWindow
│   │   │   └── ai/                ← [FUTURE] AI engine
│   │   │       ├── engine.ts      ← Orchestrator (starts/stops audio pipeline)
│   │   │       ├── vosk-runner.ts ← Vosk integration
│   │   │       ├── whisper-runner.ts ← Whisper integration
│   │   │       └── verse-detector.ts ← Transcript → verse reference parser
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── renderer/
│       ├── src/
│       │   ├── main.tsx           ← React entry point
│       │   ├── App.tsx            ← Router + Onboarding gate
│       │   ├── pages/             ← One file per route
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Songs.tsx
│       │   │   ├── Bible.tsx
│       │   │   ├── Live.tsx
│       │   │   ├── Media.tsx
│       │   │   ├── Setlist.tsx
│       │   │   ├── AIEngine.tsx
│       │   │   ├── Settings.tsx
│       │   │   ├── Reports.tsx
│       │   │   ├── Licensing.tsx
│       │   │   └── Onboarding.tsx
│       │   ├── components/
│       │   │   ├── AppShell.tsx   ← Outer layout wrapper
│       │   │   ├── Sidebar.tsx    ← Left navigation + live preview
│       │   │   ├── TopBar.tsx     ← Title bar
│       │   │   └── ProjectionPreview.tsx ← 16:9 output thumbnail
│       │   ├── store/             ← Zustand state stores
│       │   │   ├── serviceStore.ts
│       │   │   ├── bibleStore.ts
│       │   │   ├── songStore.ts
│       │   │   ├── settingsStore.ts
│       │   │   └── aiStore.ts
│       │   ├── types/
│       │   │   └── luminary.d.ts  ← [MUST CREATE] window.luminary TypeScript type
│       │   ├── lib/
│       │   │   └── utils.ts       ← cn() Tailwind class merger
│       │   └── styles/
│       │       └── globals.css    ← Tailwind base + custom component classes
│       ├── public/
│       │   └── luminary-icon.svg  ← Favicon
│       ├── index.html
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       └── package.json
├── docs/                          ← This documentation folder
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── TECHNICAL_SPEC.md
│   ├── IPC_API.md
│   ├── DATABASE_SCHEMA.md
│   ├── FEATURE_STATUS.md
│   └── DEV_GUIDE.md
├── build/                         ← [MUST CREATE] electron-builder assets
│   ├── icon.ico                   ← Windows icon (256×256)
│   ├── icon.icns                  ← macOS icon (1024×1024)
│   ├── icon.png                   ← Linux icon (512×512)
│   └── entitlements.mac.plist     ← macOS hardened runtime
├── electron-builder.config.js
└── package.json
```

---

## 5. Common Development Tasks

### 5.1 Adding a New Page

1. Create `apps/renderer/src/pages/MyPage.tsx`
2. Add a route in `App.tsx`:
   ```tsx
   <Route path="/my-page" element={<MyPage />} />
   ```
3. Add a nav item in `Sidebar.tsx`:
   ```tsx
   <NavItem to="/my-page" icon={MyIcon} label="My Page" />
   ```

### 5.2 Adding a New IPC Channel

**Main process** — Create or update the handler file:
```typescript
// apps/main/src/ipc/myDomain.ts
import { ipcMain } from 'electron'

export function registerMyDomainHandlers(db: Database) {
  ipcMain.handle('myDomain:action', async (_, payload) => {
    // validate payload with Zod
    // call db module
    // return result
  })
}
```

Register it in `index.ts`:
```typescript
import { registerMyDomainHandlers } from './ipc/myDomain'
// In app.whenReady():
registerMyDomainHandlers(db)
```

**Preload** — Add to `contextBridge.exposeInMainWorld`:
```typescript
myDomain: {
  action: (payload) => ipcRenderer.invoke('myDomain:action', payload),
}
```

**Renderer** — Use in a component:
```typescript
const result = await window.luminary.myDomain.action(payload)
```

**TypeScript** — Update `types/luminary.d.ts`:
```typescript
myDomain: {
  action: (payload: MyPayload) => Promise<MyResult>
}
```

### 5.3 Adding a New Zustand Store

```typescript
// apps/renderer/src/store/myStore.ts
import { create } from 'zustand'

interface MyState {
  value: string
  setValue: (v: string) => void
  loadFromDB: () => Promise<void>
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (v) => set({ value: v }),
  loadFromDB: async () => {
    const data = await window.luminary.myDomain.getAll()
    set({ value: data })
  },
}))
```

### 5.4 Adding a Database Migration

Append to the `migrations` array in `apps/main/src/database/migrations.ts`:
```typescript
{
  version: '003_add_my_table',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS my_table (
        id   TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL
      )
    `)
  }
}
```

**Important rules:**
- Version string must be unique and lexicographically ordered
- Use `IF NOT EXISTS` in all `CREATE TABLE` statements
- Never modify an existing migration — add a new one

### 5.5 Modifying TailwindCSS Design Tokens

All tokens are in `apps/renderer/tailwind.config.js`. Use semantic names that match the design system:

```javascript
// Adding a new colour token
colors: {
  // ... existing
  'my-token': '#FF0000',
}
// Usage in components: className="text-my-token bg-my-token/20"
```

### 5.6 Working with the Projection Output Window

**Development:** The output window is a separate `BrowserWindow`. In dev mode, it loads `http://localhost:5173/output` (a separate React route for the output renderer). To test it, you need the full Electron dev environment running (`npm run dev`), not just the Vite server.

**The output route** will need to be added to the React router and a separate minimal React component (`OutputRenderer.tsx`) that only renders slide content with no operator UI.

---

## 6. TypeScript Path Aliases

The renderer uses `@/*` as an alias for `src/*`:

```typescript
// Instead of:
import { cn } from '../../../lib/utils'
// Use:
import { cn } from '@/lib/utils'
```

Configured in:
- `apps/renderer/tsconfig.json` — `"paths": { "@/*": ["src/*"] }`
- `apps/renderer/vite.config.ts` — `resolve.alias: { '@': path.resolve(__dirname, './src') }`

---

## 7. Building for Production

### 7.1 Build Both Processes

```bash
cmd /c npm run build
# Equivalent to:
# npm run build:main     → tsc → apps/main/dist/
# npm run build:renderer → vite build → apps/renderer/dist/
```

### 7.2 Package with electron-builder

```bash
cmd /c npm run dist
```

**Outputs:**
- Windows: `dist-electron/Luminary Setup 2.0.0.exe`
- macOS: `dist-electron/Luminary-2.0.0.dmg`
- Linux: `dist-electron/Luminary-2.0.0.AppImage`

### 7.3 Build Assets (Required Before First `dist` Run)

Create the `build/` directory with the following:

**`build/entitlements.mac.plist`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
</dict>
</plist>
```

Icons must be exported from design files at the correct sizes. Recommended tool: [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder) — takes a 1024×1024 PNG and generates all formats.

```bash
cmd /c npx electron-icon-builder --input=./assets/icon-source.png --output=./build
```

### 7.4 macOS Code Signing

For distribution (not local dev), set environment variables:
```bash
APPLE_ID=your@email.com
APPLE_ID_PASSWORD=app-specific-password
APPLE_TEAM_ID=XXXXXXXXXX
CSC_LINK=path/to/certificate.p12
CSC_KEY_PASSWORD=certificate-password
```

### 7.5 Windows Code Signing

```bash
WIN_CSC_LINK=path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=certificate-password
```

---

## 8. npm Scripts Reference

All scripts are run from the **monorepo root**. On Windows use `cmd /c` prefix due to PowerShell execution policy.

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `concurrently "dev:main" "dev:renderer"` | Full Electron dev environment |
| `npm run dev:renderer` | `npm run dev --workspace=apps/renderer` | Vite only (browser) |
| `npm run dev:main` | `npm run dev --workspace=apps/main` | TypeScript watch + Electron |
| `npm run build` | `build:main && build:renderer` | Production build, no packaging |
| `npm run build:main` | `npm run build --workspace=apps/main` | Compile main process TypeScript |
| `npm run build:renderer` | `npm run build --workspace=apps/renderer` | Vite production build |
| `npm run dist` | `npm run build && electron-builder` | Full build + package installers |
| `npm run lint` | `eslint apps/*/src --ext .ts,.tsx` | Lint all TypeScript source files |

---

## 9. Key Dependencies Reference

### Root

| Package | Purpose |
|---|---|
| `electron` | Electron framework |
| `electron-builder` | Packaging (NSIS/DMG/AppImage) |
| `concurrently` | Run dev:main and dev:renderer in parallel |

### `apps/main`

| Package | Purpose |
|---|---|
| `better-sqlite3` | Synchronous SQLite driver — fast, simple, no callbacks |
| `zod` | Runtime validation of IPC payloads |

### `apps/renderer`

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `zustand` | State management (minimal boilerplate) |
| `lucide-react` | Icon library (tree-shakeable SVG icons) |
| `framer-motion` | Animations and transitions |
| `tailwind-merge` | Merge Tailwind class strings without conflicts |
| `clsx` | Conditional class names |
| `tailwindcss` | Utility-first CSS framework |
| `@vitejs/plugin-react` | Vite React plugin (Fast Refresh) |
| `vite` | Development server and build tool |
| `typescript` | Type system |
| `@types/node` | Node.js type definitions (needed for `vite.config.ts`) |

---

## 10. Environment Notes

### PowerShell Execution Policy (Windows)

npm `.ps1` scripts are blocked by Windows PowerShell's default execution policy. All npm commands must be prefixed with `cmd /c`:

```powershell
# ❌ This fails:
npm install

# ✅ This works:
cmd /c npm install
```

To permanently fix (requires admin rights):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### `userData` Path

Electron's `app.getPath('userData')` resolves to:
- Windows: `C:\Users\<username>\AppData\Roaming\Luminary`
- macOS: `~/Library/Application Support/Luminary`
- Linux: `~/.config/Luminary`

This is where `luminary.db`, bible databases, backups, media library, and AI model cache are stored.

### Native Module Compilation

`better-sqlite3` is a native module (C++ addon). It must be compiled for the target Electron version. `electron-builder` handles this automatically via `electron-rebuild` during the `dist` step. In development, `npm install` triggers native compilation for the current Node.js version.

If you see errors like `was compiled against a different Node.js version`:
```bash
cmd /c npx electron-rebuild -f -w better-sqlite3
```

---

## 11. Git Workflow

```bash
# Clone (first time)
git clone https://github.com/ken-muritu/luminary.git

# Feature branch
git checkout -b feature/ipc-songs-implementation

# Commit (conventional commits format)
git add .
git commit -m "feat(ipc): implement songs:* IPC handlers with SQLite"

# Push
cmd /c git push origin feature/ipc-songs-implementation
```

### Commit Convention

| Prefix | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no feature change |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Build process, dependencies |

### `.gitignore` (important entries)

```
node_modules/
apps/main/dist/
apps/renderer/dist/
dist-electron/
*.db                  ← Database files (contain user data; not committed)
build/icon.*          ← Binary assets (not committed to source control)
.env
```

---

## 12. Testing Strategy

### Unit Testing (to be set up)

Recommended: **Vitest** for renderer logic and store tests.

```bash
cmd /c npm install --save-dev vitest @testing-library/react @testing-library/user-event
```

Test targets:
- Zustand store logic (pure reducers)
- Utility functions (`cn()`, date formatters, etc.)
- Verse detection regex (`ai/verse-detector.ts`)
- CCLI report CSV generation
- License key validation (HMAC logic)

### Integration Testing (to be set up)

Recommended: **Playwright** with `playwright-electron` for end-to-end Electron tests.

Test scenarios:
- Onboarding flow completion
- Song creation and retrieval
- Bible verse lookup
- Live projection flow (Go Live → set slide → BLANK → End Live)
- Settings persistence across restart

### Manual Testing Checklist (per feature)

Before marking any feature as complete, verify:
- [ ] Data persists across app restart (not just in-memory)
- [ ] Error cases handled gracefully (invalid input, missing file, etc.)
- [ ] Works with no secondary display connected
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors (`tsc --noEmit`)

---

## 13. Debugging

### Main Process

Add `--inspect` to the Electron command in `apps/main/package.json`:
```json
"dev": "tsc -w & electron --inspect=9229 dist/index.js"
```
Then attach Chrome DevTools to `chrome://inspect`.

### Renderer Process

Standard Chrome DevTools. Open via `CmdOrCtrl+Shift+I` in the operator window.

### IPC Debugging

Add logging in the main process handlers:
```typescript
ipcMain.handle('songs:getAll', async () => {
  console.log('[IPC] songs:getAll called')
  const result = db.songs.getAll()
  console.log('[IPC] songs:getAll returning', result.length, 'songs')
  return result
})
```

### SQLite Inspection

Use [DB Browser for SQLite](https://sqlitebrowser.org/) to open `<userData>/luminary.db` directly and inspect tables, run queries, and verify data.

---

## 14. Frequently Asked Questions

**Q: Why does the renderer not have access to Node.js?**  
A: Security. `nodeIntegration: false` + `contextIsolation: true` means the renderer is a sandboxed Chromium process. All Node.js access goes through the typed `window.luminary` bridge defined in `preload.ts`. This prevents a compromised renderer (e.g. via XSS in user-imported content) from accessing the file system.

**Q: Why use `better-sqlite3` (synchronous) instead of an async SQLite driver?**  
A: The main process handles IPC requests synchronously anyway (one at a time). `better-sqlite3`'s synchronous API is simpler, faster, and has no risk of callback hell or race conditions. It runs on the main thread but its operations complete in microseconds for typical query sizes.

**Q: Why are all the stores using mock data?**  
A: The `preload.ts` file (the bridge between renderer and main) does not exist yet. Until it's created, `window.luminary` is undefined and calling any IPC would throw. The mock data allows UI development to continue independently.

**Q: Why are there two `tsconfig.json` files in the renderer?**  
A: `tsconfig.json` configures the app source (referenced by Vite). `tsconfig.node.json` configures `vite.config.ts` itself (which runs in Node.js, not the browser). The `references` field in `tsconfig.json` links them.

**Q: How do I add a new Bible translation?**  
A: Currently not implemented. Future implementation: the user purchases a licensed translation, which triggers a one-time download from the Luminary CDN of a pre-built `bible-<id>.db` file. The file is placed in `<userData>/bibles/`. The `bible:getTranslations` IPC handler scans for `.db` files in that directory and returns them.

**Q: What is the `@luminary/renderer` / `@luminary/main` package naming about?**  
A: npm workspace package names. They allow cross-workspace imports if needed (e.g., shared types in a `packages/shared` workspace in the future). Currently the `@luminary` scope is just for organisation.
