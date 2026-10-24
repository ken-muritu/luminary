# Luminary — Feature Implementation Status

**Version:** 2.0.0  
**Last Updated:** June 2026  
**See also:** [`README.md`](../README.md) §3–4 for the full forensic audit (supersedes stale rows below as they are updated).

**Legend:**
- ✅ **Complete** — Fully implemented, wired to real data, production-ready
- 🔶 **UI Only** — UI scaffold built with mock/static data; no real backend wiring
- 🔧 **Partial** — Some real implementation but key pieces missing
- ❌ **Missing** — Not yet started; defined in PRD

---

## Turso / Database (June 2026)

| Item | Status | Notes |
|---|---|---|
| Turso CLI auth | ✅ | Authenticated |
| `luminary-db` on Turso | ❌ | **Not created yet** — other DBs exist (`addplus-db`, `caspahub`, etc.) |
| Local SQLite (default) | ✅ | `~/.config/Luminary/luminary.db` via libsql `file:` URL |
| Optional remote libsql | 🔧 | `LUMINARY_TURSO_URL` + `LUMINARY_TURSO_AUTH_TOKEN` in `client.ts`; run `./scripts/setup-turso.sh` to provision |

---

## 1. Foundation & Infrastructure (updated June 2026)

| Feature | Status | Notes |
|---|---|---|
| Electron main + IPC | ✅ | Handlers registered; dev CSP skipped for Vite HMR |
| Preload (`preload.ts`) | ✅ | Full `window.luminary` bridge |
| libsql + migrations | ✅ | `execAll()` splitter; FTS triggers for songs |
| Settings persistence | ✅ | `settings:set` / `setBulk`; store setters persist; hydration uses `setState` (no write-back) |
| Renderer hydration | ✅ | `App.tsx` loads settings from SQLite on boot |
| `window.luminary` types | ✅ | `types/luminary.d.ts` |
| Turso cloud sync | 🔧 | Code ready; DB not provisioned |

---

## 3. Onboarding (updated June 2026)

| Feature | Status | Notes |
|---|---|---|
| 3-step wizard UI | ✅ | |
| Language + translation → SQLite | ✅ | `settings.setBulk` on complete |
| Persist `isOnboarded` | ✅ | Via `setBulk` + `serviceStore.setIsOnboarded` |
| Real mic / calibration | 🔶 | Still simulated UI; `ai.calibrate()` called if user completes step |

---

## 6. Service Mode (updated June 2026)

| Feature | Status | Notes |
|---|---|---|
| Setlist from SQLite | ✅ | Today's setlist or first; no more `MOCK_SETLIST` |
| Song sections from DB | ✅ | Loaded via `songs.getById`; verse items use `bible.parseReference` |
| Projection IPC | ✅ | `output.setSlide` + `output:previewUpdated` listener in `ProjectionPreview` |
| AI verse detection | 🔶 | Simulated cue after 8s when listening; engine still stub |

---

## 9. Settings (updated June 2026)

| Feature | Status | Notes |
|---|---|---|
| All settings → SQLite | ✅ | Zustand setters call `settings.set` |
| Real displays | ✅ | `output.getDisplays()` on mount |
| Backup export/restore | ✅ | Wired to `backup.create` / `backup.import` |
| Typography → output window | ✅ | `output.updateConfig` on font changes |

---

## 10. Licensing (updated June 2026)

| Feature | Status | Notes |
|---|---|---|
| Key validation (main) | ✅ | `LUM-COM-` / `LUM-STD-` / `LUM-PRO-` prefixes |
| Activation UI | ✅ | Calls `license.validate`; persists tier + key |

---

## Remaining P0/P1 gaps

- **Whisper/Vosk native models** — speech uses Chromium Web Speech API; binary STT pipeline reserved for future
- **Automated tests** — none
- **Dashboard / Reports** — still largely mock data

## Bible & AI (June 2026 update)

| Item | Status |
|---|---|
| Full KJV (31,102 verses) | ✅ `npm run bible:download -- KJV` |
| NKJV / NLT / AMP | 🔧 `npm run bible:download` (bolls.life fetch) |
| Per-translation DB seed | ✅ `seedBible.ts` imports `assets/bible/{kjv,nkjv,nlt,amp}.json` |
| AI verse detection | ✅ `reference-parser` + `verse-detector` + speech → IPC |
| AI UI (Service Mode / AI Engine) | ✅ Real mic via `useAISpeech` hook |

---

*Below: original April 2026 audit (many rows outdated; prefer README + sections above.)*

| Lyrics textarea | ✅ Complete | — | Editable, shows section content |
| Drag-and-drop section reorder | ❌ Missing | P1 | Tabs are static; no drag handle |
| Metadata form (key, BPM, CCLI, etc.) | 🔶 UI Only | P0 | Form renders; no save action wired |
| Theme override panel | 🔶 UI Only | P2 | Renders dropdowns and sliders; no effect on output |
| Save song to SQLite | ❌ Missing | **P0** | No `window.luminary.songs.update()` call anywhere |
| Create new song | ❌ Missing | P0 | "+ New Song" button is a stub |
| Delete song | ❌ Missing | P0 | "Delete" button is a stub |
| Send section to Live | ❌ Missing | P0 | `setProjectionText()` updates store only; no `window.luminary.output.setSlide()` |
| Import songs (OpenLP, ProPresenter, text) | ❌ Missing | P2 | Not started |
| Export songs | ❌ Missing | P2 | Not started |

---

## 6. Bible Engine

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Bible page UI (3-pane layout) | ✅ Complete | — | Layout renders correctly |
| Reference lookup | 🔶 UI Only | **P0** | Input exists; no real parse/query; returns `MOCK_VERSES` |
| Keyword search | 🔶 UI Only | P0 | Toggle exists; no FTS5 query |
| Translation switcher | 🔶 UI Only | P0 | Shows hard-coded array; no `window.luminary.bible.getTranslations()` |
| Verse selection (single + multi) | 🔶 UI Only | P0 | Selection state local; no effect on output |
| Send to Live | ❌ Missing | P0 | Calls `setProjectionText()` locally; no `window.luminary.output.setSlide()` |
| Add to Setlist | ❌ Missing | P1 | Button stub |
| Side-by-side comparison (Standard+) | ❌ Missing | P2 | Not started |
| KJV + ASV bundled databases | ❌ Missing | **P0** | Bible `.db` files do not exist in the repo |
| NIV/ESV/NASB/NKJV download | ❌ Missing | P2 | Not started |
| Show/hide verse numbers on output | ❌ Missing | P1 | Setting exists; not applied to output |
| Right panel projection preview | 🔶 UI Only | P1 | Renders `ProjectionPreview`; not verse-specific |

---

## 7. Live Control Panel

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Setlist item list (left pane) | 🔶 UI Only | P0 | `MOCK_SETLIST_ITEMS`; no real setlist loaded |
| Slide grid (center pane) | 🔶 UI Only | P0 | `MOCK_SLIDES`; no real slides generated from song sections |
| BLANK / LOGO / BLACK / FREEZE buttons | 🔶 UI Only | P0 | Toggle local state only; no `window.luminary.output.*` calls |
| Output preview (right pane) | ✅ Complete | — | `ProjectionPreview` component renders correctly |
| Go Live button | 🔧 Partial | P0 | Toggles store; no output window shown |
| Slide click → project | ❌ Missing | **P0** | No `window.luminary.output.setSlide()` call |
| Keyboard shortcuts | ❌ Missing | P0 | None registered (Arrow, Space, Escape, F1–F4, G) |
| Per-item theme/transition selectors | 🔶 UI Only | P2 | Dropdowns render; no effect |
| Disambiguation card overlay | ❌ Missing | P1 | Not started |

---

## 8. Media Library

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Category sidebar + grid | ✅ Complete | — | Layout and filtering by category works |
| Media thumbnails grid | 🔶 UI Only | P1 | `MOCK_MEDIA`; no real file thumbnails |
| Right detail panel | ✅ Complete | — | File info, tags, action buttons render |
| Send to Live | ❌ Missing | P0 | Calls `setProjectionText()` locally; no real output |
| Import files | ❌ Missing | P1 | "Upload" button is stub |
| Delete asset | ❌ Missing | P1 | "Delete" button is stub |
| Load from SQLite | ❌ Missing | P1 | No IPC call; all assets are mock |
| Open library folder | ❌ Missing | P2 | Stub button |
| Tag editing | ❌ Missing | P2 | Not wired |

---

## 9. Setlist Manager

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Setlist library (left pane) | 🔶 UI Only | P0 | `MOCK_SETLISTS`; no SQLite |
| Active setlist item list | 🔶 UI Only | P0 | `SETLIST_ITEMS` hard-coded; no SQLite |
| Item type icons and metadata | ✅ Complete | — | All type icons and metadata display correctly |
| Drag-and-drop item reorder | ❌ Missing | P0 | Drag handles render; no actual drag-and-drop (missing library: `@dnd-kit/core` or similar) |
| Add item | ❌ Missing | P0 | "Add item…" button is stub |
| Remove item | ❌ Missing | P0 | "Remove" button is stub |
| Send item to output | ❌ Missing | P0 | `MonitorPlay` hover button is stub |
| Duplicate setlist | ❌ Missing | P1 | "Duplicate" button is stub |
| Save as template | ❌ Missing | P1 | Button is stub |
| Export `.luminary` file | ❌ Missing | P2 | Not started |
| Right panel theme/transition | 🔶 UI Only | P2 | Dropdowns render; no effect |

---

## 10. AI Voice Engine

| Feature | Status | Priority | Notes |
|---|---|---|---|
| AI Engine settings page | ✅ Complete | — | Full UI renders |
| Master toggle | 🔧 Partial | P0 | Toggles local `isListening` state; no real audio |
| VU meter animation | 🔶 UI Only | P1 | Simulated with `setInterval(Math.random())`; not real audio |
| Live transcript display | 🔶 UI Only | P1 | Simulated word-by-word reveal; not real ASR |
| Model selector | 🔶 UI Only | P0 | Updates store; no IPC call to change model |
| Sensitivity selector | 🔶 UI Only | P0 | Updates store; no IPC call |
| Confidence threshold slider | 🔶 UI Only | P0 | Updates store; no IPC call |
| Room calibration | 🔶 UI Only | P1 | Fake 3-second timeout; no real audio |
| Detection mode selector | 🔶 UI Only | P0 | Updates store; no IPC call |
| Real audio capture | ❌ Missing | P0 | No audio capture implementation (`naudiodon`/PortAudio not yet integrated) |
| Vosk ASR runner | ❌ Missing | P0 | Not started; requires vosk Node.js binding |
| Whisper ASR runner | ❌ Missing | P0 | Not started; requires whisper.cpp binding or child_process |
| Verse detector | ❌ Missing | P0 | Not started |
| Cue emitter → IPC push | ❌ Missing | P0 | Not started |
| Model download + caching | ❌ Missing | P2 | Not started |
| `onVerseDetected` listener in renderer | ❌ Missing | P0 | Not registered anywhere |

---

## 11. Display Output

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Output `BrowserWindow` creation | ❌ Missing | **P0** | `createOutputWindow()` not implemented in `index.ts` |
| Output window rendering (slides) | ❌ Missing | P0 | `apps/renderer/public/output.html` and its renderer do not exist |
| Display enumeration (`screen.getAllDisplays()`) | ❌ Missing | P0 | Not called in `index.ts` |
| Display role mapping | ❌ Missing | P0 | `display_mappings` table does not exist yet |
| Output on assigned display | ❌ Missing | P0 | No logic to fullscreen on the `main` role display |
| BLANK overlay on output | ❌ Missing | P0 | No output window to send to |
| FREEZE on output | ❌ Missing | P0 | No output window |
| LOGO overlay | ❌ Missing | P1 | No logo configured |
| Stage Display window | ❌ Missing | P2 | Pro tier feature; not started |
| Lobby/Overflow window | ❌ Missing | P2 | Not started |
| NDI® output | ❌ Missing | P2 | Pro tier; not started |
| Display connect/disconnect events | ❌ Missing | P1 | Not monitored |
| "Identify display" flash | ❌ Missing | P1 | Not implemented |

---

## 12. Settings

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Settings page UI (4 sections) | ✅ Complete | — | All sections render |
| Display mapping section | 🔶 UI Only | P0 | Shows mock display list; no real `screen.getAllDisplays()` |
| Typography settings (sliders, weight) | 🔶 UI Only | P0 | Updates Zustand store; not persisted to SQLite |
| Font family select | 🔧 Partial | P0 | `setFontFamily` wired; not persisted |
| Live typography preview | ✅ Complete | — | Preview renders in real-time from store state |
| Bible translation + verse numbers | 🔶 UI Only | P0 | Store updates work; not persisted |
| Auto-backup toggle | 🔶 UI Only | P1 | Store toggles; no backup scheduled |
| Cloud sync toggle | 🔶 UI Only | P2 | Store toggles; no sync logic |
| Export archive | ❌ Missing | P1 | Button is stub |
| Restore from file | ❌ Missing | P1 | Button is stub |
| All settings → SQLite persistence | ❌ Missing | **P0** | None of the settings mutations call `window.luminary.settings.set()` |

---

## 13. CCLI Reports

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Reports page UI | ✅ Complete | — | Full layout renders |
| Stat cards | 🔶 UI Only | P1 | Hard-coded values |
| Missing CCLI alert | ✅ Complete | — | Logic works against mock data |
| Bar chart (projection velocity) | ✅ Complete | — | Renders against `WEEKLY_DATA` mock |
| Song history table | 🔶 UI Only | P1 | `RECENT_SONGS` mock; frequency bar renders |
| Date range filter | 🔶 UI Only | P1 | Toggles local state; no re-fetch |
| Song usage logging (on projection) | ❌ Missing | **P0** | `song_usage_log` table insert never called |
| Load from SQLite | ❌ Missing | P1 | No IPC call to `reports:getSongUsage` |
| Generate CCLI CSV | ❌ Missing | P1 | Button is stub |
| Export CSV | ❌ Missing | P1 | Button is stub |

---

## 14. Licensing

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Licensing page UI | ✅ Complete | — | Full layout renders |
| Tier cards | ✅ Complete | — | Feature lists, pricing, current plan highlight all work |
| License key input + activate | 🔶 UI Only | P0 | Fake 1.5s timeout; no HMAC validation; no SQLite write |
| Tier enforcement in main process | ❌ Missing | **P0** | No feature gates in IPC handlers (all tier-gated features accessible regardless) |
| Load tier from SQLite on start | ❌ Missing | P0 | Tier always defaults to `'community'` in the Zustand store |
| Offline HMAC license validation | ❌ Missing | P0 | Not implemented |
| Device fingerprinting | ❌ Missing | P2 | Not started |

---

## 15. Backup & Sync

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Backup section in Settings | ✅ Complete | — | UI renders |
| Export archive | ❌ Missing | P1 | No implementation |
| Restore from file | ❌ Missing | P1 | No implementation |
| Auto-backup scheduler | ❌ Missing | P2 | Not started |
| Cloud sync (file-system level) | ❌ Missing | P2 | Not started |

---

## 16. Missing Files Summary

The following files **must be created** before the application is functional:

### Critical (P0)

| File | Purpose |
|---|---|
| `apps/main/src/preload.ts` | contextBridge — the entire renderer→main bridge |
| `apps/main/src/database/init.ts` | SQLite connection setup + pragma config |
| `apps/main/src/database/migrations.ts` | All DDL migrations |
| `apps/main/src/database/songs.ts` | Songs CRUD queries |
| `apps/main/src/database/sections.ts` | Song sections CRUD |
| `apps/main/src/database/setlists.ts` | Setlists CRUD |
| `apps/main/src/database/setlist-items.ts` | Setlist items CRUD + reorder |
| `apps/main/src/database/settings.ts` | Settings get/set |
| `apps/main/src/database/usage-log.ts` | Usage log append + report queries |
| `apps/main/src/ipc/songs.ts` | IPC handler: `songs:*` channels |
| `apps/main/src/ipc/bible.ts` | IPC handler: `bible:*` channels |
| `apps/main/src/ipc/setlists.ts` | IPC handler: `setlists:*` channels |
| `apps/main/src/ipc/output.ts` | IPC handler: `output:*` channels |
| `apps/main/src/ipc/settings.ts` | IPC handler: `settings:*` channels |
| `apps/renderer/src/types/luminary.d.ts` | `window.luminary` TypeScript declaration |
| `apps/renderer/public/output.html` | Output window HTML entry point |
| Bible database files (`bible-kjv.db`, `bible-asv.db`) | Bundled Bible content |
| `build/icon.ico`, `build/icon.icns`, `build/icon.png` | Electron-builder icons |
| `build/entitlements.mac.plist` | macOS hardened runtime entitlements |

### Important (P1)

| File | Purpose |
|---|---|
| `apps/main/src/database/media.ts` | Media assets CRUD |
| `apps/main/src/database/displays.ts` | Display mapping CRUD |
| `apps/main/src/database/bible.ts` | Bible search queries |
| `apps/main/src/ipc/media.ts` | IPC handler: `media:*` channels |
| `apps/main/src/ipc/reports.ts` | IPC handler: `reports:*` channels |
| `apps/main/src/ipc/licensing.ts` | IPC handler: `licensing:*` channels |
| `apps/main/src/ipc/backup.ts` | IPC handler: `backup:*` channels |
| `apps/main/src/display/outputWindow.ts` | Output BrowserWindow creation + management |

### Future (P2)

| File | Purpose |
|---|---|
| `apps/main/src/ai/engine.ts` | AI engine orchestrator |
| `apps/main/src/ai/vosk-runner.ts` | Vosk ASR integration |
| `apps/main/src/ai/whisper-runner.ts` | Whisper ASR integration |
| `apps/main/src/ai/verse-detector.ts` | Transcript → verse reference parser |
| `apps/main/src/backup/archiver.ts` | ZIP backup creation/extraction |
| `apps/main/src/licensing/validator.ts` | HMAC license key validation |
| `apps/renderer/src/pages/output/` | Output window React renderer |
| `apps/renderer/src/pages/stage/` | Stage display React renderer |

---

## 17. Recommended Implementation Order

### Phase 1 — Make it run with real data (P0)
1. Create `preload.ts` with full `window.luminary` surface
2. Create `types/luminary.d.ts` in renderer
3. Create `database/init.ts`, `database/migrations.ts` (all tables from `DATABASE_SCHEMA.md`)
4. Create `database/songs.ts`, `database/sections.ts`, `database/settings.ts`
5. Create `ipc/songs.ts`, `ipc/settings.ts`
6. Wire `App.tsx` to hydrate all stores from SQLite on mount
7. Wire `Songs.tsx` save/create/delete to IPC
8. Wire settings mutations to `window.luminary.settings.set()`
9. Bundle KJV + ASV bible databases

### Phase 2 — Live projection works (P0)
1. Create `display/outputWindow.ts` — output `BrowserWindow` creation
2. Create `apps/renderer/public/output.html` + React output renderer
3. Wire `output:goLive`, `output:endLive`, `output:setSlide`, `output:setBlank`, `output:setLogo`, `output:setFreeze`
4. Wire Live page slide clicks to `window.luminary.output.setSlide()`
5. Wire BLANK/LOGO/BLACK/FREEZE buttons
6. Wire keyboard shortcuts in Live page

### Phase 3 — Bible + Setlists + Reports (P1)
1. Create `database/bible.ts` + `ipc/bible.ts`
2. Wire Bible page to real IPC
3. Create `database/setlists.ts`, `database/setlist-items.ts` + `ipc/setlists.ts`
4. Wire Setlist page to real IPC
5. Add drag-and-drop library (`@dnd-kit/sortable`) to setlist items
6. Create `database/usage-log.ts` + `ipc/reports.ts`
7. Wire Reports page to real IPC
8. Log projection events on every `output:setSlide` for a song

### Phase 4 — AI Engine (P0 but complex)
1. Add `naudiodon` or PortAudio binding for audio capture
2. Implement `ai/vosk-runner.ts` (Community tier)
3. Implement `ai/verse-detector.ts`
4. Implement `ai/engine.ts` orchestrator
5. Wire `ai:startListening`, `ai:stopListening`, push events to renderer
6. Implement disambiguation card in Dashboard and Live pages

### Phase 5 — Polish & Pro Features (P2)
1. Licensing HMAC validator
2. Media import with real thumbnail generation
3. Stage Display window
4. NDI output
5. Auto-backup scheduler
6. Cloud sync
