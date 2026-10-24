# Luminary — Architect of Sacred Light

> AI-powered church presentation software. Passive verse detection, offline-first worship operation, zero operator delay.
> Built for reverence — not just utility.

[![CI](https://github.com/ken-muritu/luminary/actions/workflows/ci.yml/badge.svg)](https://github.com/ken-muritu/luminary/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-3.0.0-6C5CE7)](https://github.com/ken-muritu/luminary)
[![Platform](https://img.shields.io/badge/platform-PWA%20%7C%20Tauri%20%7C%20Legacy%20Electron-blue)](https://github.com/ken-muritu/luminary)

**Document type:** Principal-architect forensic README — Single Source of Truth  
**Last forensic audit:** 2026-06-18 **[UPDATED]**  
**Audience:** Senior engineers, architects, CTO onboarding cold  
**Repository:** `ken-muritu/luminary` · developed April–June 2026; this public copy is a single snapshot commit  
**Production PWA:** https://luminary-app-swart.vercel.app  
**Production marketing:** Vercel project `luminarysite` (`apps/web`)

---

## Table of Contents

1. [Genesis & Evolution](#1-genesis--evolution) **[UPDATED]**
2. [Core Architecture & System Topology](#2-core-architecture--system-topology) **[UPDATED]**
3. [Functional Deep-Dive & Feature Inventory](#3-functional-deep-dive--feature-inventory) **[UPDATED]**
4. [Feature Audit & Production Readiness Assessment](#4-feature-audit--production-readiness-assessment) **[UPDATED]**
5. [Known Issues & Technical Debt](#5-known-issues--technical-debt) **[UPDATED]**
6. [Missing Features — Global Standards Gap Analysis](#6-missing-features--global-standards-gap-analysis) **[UPDATED]**
7. [Conception to Current State](#7-conception-to-current-state) **[UPDATED]**
8. [Remediation Roadmap](#8-remediation-roadmap) **[UPDATED]**
9. [Setup & Installation](#9-setup--installation) **[UPDATED]**
10. [Available Scripts](#10-available-scripts) **[UPDATED]**
11. [Documentation Index](#11-documentation-index)

**Legend:** ✅ Complete · ⚠️ Partial/Needs Work · ❌ Missing · 🔴 Critical · 🟡 Technical Debt · 🟢 Good/Compliant

---

## 1. Genesis & Evolution

### 1.1 Original problem statement

Luminary began from a single operational frustration: **church presentation operators carry enormous cognitive load every Sunday**. They type verse references mid-sermon, click through cluttered legacy software (ProPresenter, EasyWorship, MediaShout), and live in fear of projecting the wrong slide while a congregation watches.

The PRD north-star quote (`docs/PRD.md`):

> *"An operator should be able to sit at the console, press Go Live, and then do almost nothing for the rest of the sermon."*

Four non-negotiable pillars:

| Pillar | Meaning |
|:---|:---|
| Offline-first | Zero runtime network dependency for core worship operation |
| AI-augmented | Passive verse detection from ambient sermon audio |
| Premium dark UI | Distraction-free operator console for dim environments |
| Operator respect | AI suggests; human confirms (Assisted mode) or overrides |

### 1.2 Complete git timeline (every commit) **[UPDATED]**

| # | Commit | Event |
|:---|:---|:---|
| 1 | `3494570` | **Initial commit** — Electron + React renderer scaffold; 10 operator pages with mock data |
| 2 | `4bf54cb` | Full documentation suite (`docs/*`) + early code fixes |
| 3 | `4a2644b` | General updates |
| 4 | `449f0b2` | **Marketing website** (`apps/web`) + electron-builder Windows pipeline |
| 5 | `30f21fc` | Comprehensive README (first lifecycle narrative) |
| 6 | `d95148b` | **Phase 1 (v2):** SQLite (better-sqlite3), Zod IPC, `window.luminary` preload API |
| 7 | `42b492b` | **Phase 2 (v2):** Output BrowserWindow, projection IPC, keyboard shortcuts |
| 8 | `be8a7cd` | **Phase 3 (v2):** Setlists + reports IPC, page wiring |
| 9 | `cb4e0ec` | Vercel/Netlify deploy configs for monorepo |
| 10 | `40adaaf` | Luminary 2.0 core feature batch |
| 11 | `19e86fc` | Remove large binaries from git; expand `.gitignore` |
| 12–14 | `2ab1e8f`, `ed9d6c2`, `e761086` | electron-builder native module fixes + launcher |
| 15–16 | `4de7d26`, `280d87c` | `run-luminary.sh` + better-sqlite3 rebuild logic |
| 17 | `f18b8bc` | README status update |
| 18 | `07dd863` | Architectural documentation (`README-ARCHITECTURAL.md`) |
| 19–21 | `b760b4c`, `3651735`, `d8af04c` | Turso/libsql migration, AI pipeline stubs, license stubs, Bible seeding (near-duplicate commits) |
| 22 | `ae12b3b` | Global sync commit |
| 23 | `f989721` | Core runtime fixes — Bible assets, speech verse detection, settings persistence |
| 24 | `eb2d651` | Expand README forensic audit |
| 25 | `38e5434` | **🔴 Major pivot: Luminary v3** — Tauri PWA rebuild; Turso WASM; simplified views |
| 26 | `5462ecc` | Turso WASM init fix; Phase 3–4 Bible + Whisper STT core |
| 27 | `28d60f5` | Whisper STT, Bible toast, marketing signup, PWA deploy config |
| 28 | `951ca69` | Vercel `luminary-app` PWA project + marketing `APP_URL` |
| 29 | `307b4b3` | Bible import speed + songs wired to projection |
| 30 | `7bd0451` | Biome lint formatting for CI |
| 31 | `40b0a06` | PWA install icons |
| 32–34 | `379f174`, `3e89292`, `d6fbfba` | Vercel `ignoreCommand` fixes for independent app/site deploys |
| 35 | `b54bf48` | Songs blocked by Bible import — fix |
| 36 | `c16dbc6` | PWA Bible import + song creation fixes; Turso cloud seed |
| 37 | `58f259d` | `pnpm-lock.yaml` sync for Vercel frozen-lockfile |
| 38 | `ffce0ea` | Bible import / song creation mutex fixes |
| 39 | `b3580b4` | DB lock at ~300 verses; song creation; Whisper STT race |
| 40 | `313d9ea` | **🔴 Architectural pivot:** Bible from JSON in-memory; SQLite songs-only |
| 41 | `9442e65` | AI verse detection for spoken Whisper transcripts |
| 42 | `4088620` | Verse ranges, confidence tuning, last-transcript debug UI |
| 43 | `84b74ea` | Browser Speech API fallback while Whisper model downloads |

### 1.3 Major pivots and technology decisions **[UPDATED]**

| Era | Decision | Chosen | Rejected / deferred | Why at that moment |
|:---|:---|:---|:---|:---|
| v1 (Apr 2026) | Desktop shell | **Electron 30** | Tauri, NW.js | Mature multi-window/display APIs; electron-builder proven |
| v1 | UI | **React 18 + Vite 5** | Next.js | Offline desktop renderer; Vite HMR |
| v1 | DB | **better-sqlite3** | — | Fast local SQLite in main process |
| v2 (Jun 2026) | DB driver | **@libsql/client** (file) | better-sqlite3 | Turso-compatible; reduce native rebuild pain |
| v2 | AI ASR (interim) | **Chromium Web Speech API** | Vosk/Whisper native | Ship without 50–466 MB model binaries |
| **v3 (Jun 2026)** | **Platform** | **Tauri 2 + PWA** | Electron monorepo | Smaller binary; browser-first deploy; Vercel PWA |
| **v3** | **Package manager** | **pnpm workspaces** | npm workspaces | Vercel frozen-lockfile; monorepo hygiene |
| **v3** | **Songs DB** | **@tursodatabase/database-wasm** (OPFS) | libsql in main | Browser-native persistence without Electron |
| **v3** | **Bible data** | **In-memory JSON** (`bible-store.ts`) | SQLite bulk import | 🔴 SQLite WASM wedged at ~300 verses; blocked songs |
| **v3** | **AI ASR** | **Whisper WASM worker** + **browser speech fallback** | Native whisper.cpp | Runs in browser; fallback while HF model downloads |
| **v3** | **Routing** | **BrowserRouter** | HashRouter | PWA on HTTPS; no `file://` constraint |
| **v3** | **State** | **Zustand 5** | Redux | Minimal boilerplate |
| **v3** | **Lint** | **Biome** | ESLint | Single tool; CI green |
| Marketing | Deploy | **Separate Vercel projects** | Single app | Independent release cadence |

### 1.4 Ghost decisions (started, abandoned, or never completed) **[UPDATED]**

| Ghost | Evidence | Why abandoned / stalled |
|:---|:---|:---|
| **Electron v2 monorepo** | `legacy/v2/` | Replaced by v3 Tauri PWA (`38e5434`); kept as reference + Bible JSON source |
| **SQLite Bible import (v3)** | `schema.ts` bible_* tables; `public/bible-data/*.import.sql` | WASM DB lock; replaced by JSON cache (`313d9ea`) |
| **better-sqlite3** | `legacy/v2`, `run-luminary.sh` | libsql → Turso WASM |
| **Vosk / whisper.cpp native** | `legacy/v2/main/src/ai/`, PRD | Complexity; v3 uses `@xenova/transformers` in worker |
| **HMAC license + device binding** | PRD, ghost deps in legacy | Never implemented in v3 |
| **Turso cloud sync (runtime)** | `scripts/seed-turso.cjs`, `.env.example` | Cloud DB seeded for ops; PWA uses local OPFS only |
| **Setlist DB persistence** | `setlists`/`setlist_items` in schema | Setlist lives in `serviceStore` (session memory) |
| **Media library** | `legacy/v2` IPC `media:*` | Not ported to v3 |
| **Reports / CCLI export** | `legacy/v2` IPC `reports:*` | Not ported to v3 |
| **Licensing page** | `legacy/v2/renderer` | Not ported to v3 |
| **NDI® output** | PRD Pro tier | Not started |
| **build-release.yml (Electron)** | `.github/workflows/build-release.yml` | **Stale** — references `apps/main`, electron-builder |
| **FTS5 Bible search** | PRD v3 Phase 1 | v3 uses substring `searchBible()` — not FTS5 |
| **@tanstack/react-query usage** | `main.tsx` provider | Mounted but **no queries in views** |

---

## 2. Core Architecture & System Topology

### 2.1 Repository map (v3 — current production) **[UPDATED]**

```
luminary/                              # luminary@3.0.0 — root PWA + Tauri source
├── src/                               # ★ v3 application (React 19 + Vite 6)
│   ├── App.tsx                        # Router, onboarding gate, DB init gate
│   ├── main.tsx                       # React mount + QueryClientProvider
│   ├── components/                    # AppShell, LiveControls, VerseCard, AudioMeter, etc.
│   ├── views/                         # Dashboard, Bible, Songs, Settings, Onboarding
│   ├── stores/                        # serviceStore (session), settingsStore (persisted)
│   ├── hooks/                         # Audio, STT, verse detection, projection
│   ├── db/                            # Turso WASM client, schema, bible-store, songs queries
│   ├── lib/                           # projection, reference-parser, verse-detector, constants
│   └── workers/stt.worker.ts          # @xenova/transformers Whisper pipeline
├── public/
│   ├── output.html                    # Congregation projection window (BroadcastChannel)
│   ├── manifest.json                  # PWA manifest
│   └── bible-data/                    # Generated .import.sql (build copies JSON to dist)
├── apps/
│   ├── web/                           # @luminary/web — marketing SPA → Vercel luminarysite
│   └── pwa/                           # Vercel deploy shim → root pnpm build → dist/
├── legacy/v2/                         # Archived Electron v2 (Bible JSON source of truth)
│   ├── main/assets/bible/             # kjv.json (~6.5 MB). Other translations are not included, see §9
│   ├── main/src/                      # IPC, SQLite, AI engine, license guard
│   └── renderer/src/                  # 10-page operator UI
├── src-tauri/                         # Tauri 2 thin webview shell (no custom commands)
├── scripts/                           # Bible SQL gen, Turso seed, icons, Vercel ignore
├── e2e/                               # Playwright specs
├── docs/                              # PRD, architecture, IPC (mostly v2-era)
├── vite.config.ts                     # PWA, COOP/COEP, bible-data static copy
├── vercel.json                        # Marketing site deploy
├── vercel.app.json                    # PWA app deploy
└── pnpm-workspace.yaml                # ., apps/web, apps/pwa
```

### 2.2 v3 process model and data flow **[UPDATED]**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BROWSER / TAURI WEBVIEW (single process, no Electron main)              │
│                                                                         │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────────┐  │
│  │ App.tsx     │───▶│ initDatabase()   │───▶│ Turso WASM OPFS       │  │
│  │ useDatabase │    │ luminary-songs.db│    │ songs, song_sections  │  │
│  └─────────────┘    └──────────────────┘    └─────────────────────┘  │
│                                                                         │
│  ┌─────────────┐    fetch /bible-data/{code}.json                       │
│  │ bible-store │◀─── (from legacy/v2 JSON, copied at build)            │
│  │ in-memory   │    seedMinimalInMemory() → John 3:16 instant          │
│  └─────────────┘                                                        │
│                                                                         │
│  Go Live path:                                                          │
│  Mic → useAudioStream → useLiveSTT                                      │
│       ├─ useBrowserSpeechSTT (immediate, Chrome/Edge/Safari)             │
│       └─ useWhisperSTT → stt.worker.ts → HuggingFace ONNX model       │
│       → useVerseDetection → reference-parser + verse-detector          │
│       → serviceStore.detectedVerses + optional auto-project            │
│                                                                         │
│  Projection path:                                                       │
│  setProjection() → projectWithSettings() → BroadcastChannel           │
│       + window.open('/output.html') on external display                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Dependency graph (v3) **[UPDATED]**

```
src/main.tsx
 ├── react / react-dom@19
 ├── react-router-dom@7
 ├── @tanstack/react-query          [⚠️ provider only — unused in views]
 └── zustand@5

src/db/client.ts
 └── @tursodatabase/database-wasm   [SPOF: song persistence]
      └── requires crossOriginIsolated for OPFS (COOP/COEP)

src/workers/stt.worker.ts
 └── @xenova/transformers@2.17.2
      └── onnxruntime-web (bundled)
      └── HuggingFace CDN model download [⚠️ network required first run]

src/lib/projection.ts
 └── BroadcastChannel + window.open   [no server dependency]
```

| Risk | Type | Impact |
|:---|:---|:---|
| Turso WASM OPFS | SPOF | Songs lost if OPFS unavailable → falls back to `:memory:` |
| HuggingFace model CDN | External | Whisper stuck on "Downloading…" on slow/blocked networks |
| Browser Speech API | External (Google/Apple) | **Violates offline-first** when used as primary STT |
| COEP `require-corp` | Infra | Required for OPFS/SAB; may complicate cross-origin WASM |
| Single-browser tab session | State | Setlist + detected verses not persisted |
| No circular dependencies in `src/` | — | 🟢 Clean module boundaries |

### 2.4 Database schema (v3) **[UPDATED]**

**File:** `src/db/schema.ts` — `SCHEMA_VERSION = 4`

| Table | Purpose | v3 runtime usage |
|:---|:---|:---|
| `schema_meta` | Version + storage mode key | ✅ Used |
| `songs`, `song_sections` | Song library | ✅ Used via `db/queries/songs.ts` |
| `bible_translations`, `bible_books`, `bible_verses` | Bible engine DDL | ❌ **Dead schema** — Bible in `bible-store.ts` |
| `setlists`, `setlist_items` | Service planning | ❌ **Dead schema** — setlist in Zustand |
| `settings` | Key-value config | ❌ **Dead schema** — settings in localStorage |

**Bible store (`src/db/bible-store.ts`):**

- Translations: KJV=1, NKJV=2, NLT=3, AMP=4
- `FULL_BIBLE_MIN_VERSES = 28_000`
- Loads `/bible-data/{code}.json` into `Map<BibleTranslation, BibleVerseRow[]>`
- `searchBible()` — substring scan, **not FTS5**

**Storage selection (`src/db/client.ts`):**

```typescript
function dbCandidates(): string[] {
  if (import.meta.env.VITE_E2E === "1") return [":memory:"];
  if (isCrossOriginIsolated()) return ["luminary-songs.db", ":memory:"];
  return [":memory:"];
}
```

### 2.5 Infrastructure & deployment **[UPDATED]**

| Target | Vercel project | Config | URL |
|:---|:---|:---|:---|
| PWA app | `luminary-app` | `apps/pwa/vercel.json` or `vercel.app.json` | https://luminary-app-swart.vercel.app |
| Marketing | `luminarysite` | `vercel.json` (root) | Data Unavailable (exact URL not in repo) |
| Desktop | Tauri CI matrix | `src-tauri/tauri.conf.json` | GitHub Actions artifacts |
| Legacy Electron | `legacy/v2` | `electron-builder.config.js` | **Not actively deployed** |

**Security headers (PWA — `apps/pwa/vercel.json`):**

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

### 2.6 CI/CD pipelines **[UPDATED]**

**Active: `.github/workflows/ci.yml`**

| Job | Steps | Status |
|:---|:---|:---|
| `lint-and-test` | pnpm install → biome lint → tsc → vitest | 🟢 |
| `build-web` | pnpm build → verify `dist/index.html`, `output.html`, `kjv.json` | 🟢 |
| `build-marketing` | `pnpm --filter @luminary/web build` | 🟢 |
| `e2e` | Playwright chromium → 4 tests | 🟢 |
| `build-desktop` | Tauri build matrix (ubuntu, windows, macos) | ⚠️ May fail on HF/model; not gated on STT |

**Stale: `.github/workflows/build-release.yml`** — references Electron `apps/main`, `npm ci`, electron-builder. **Does not match v3.**

---

## 3. Functional Deep-Dive & Feature Inventory

### 3.1 Onboarding

| Attribute | Detail |
|:---|:---|
| **Files** | `src/views/Onboarding.tsx`, `settingsStore.completeOnboarding()` |
| **Logic** | Blocks all routes until `onboarded: true`; mic permission prompt; default translation |
| **Status** | ✅ Working |
| **Tests** | Playwright: `onboarding completes and shows dashboard`, `welcome query` |
| **Input** | Optional `?welcome=1&name=` query params |
| **Output** | `settingsStore.onboarded = true` persisted to `luminary-settings-v3` |

### 3.2 Dashboard / Live mode

| Attribute | Detail |
|:---|:---|
| **Files** | `src/views/Dashboard.tsx`, `serviceStore.ts`, `LiveControls.tsx` |
| **Logic** | Setlist (memory), preview pane, Go Live, keyboard shortcuts (B/L/F/arrows/space) |
| **Status** | ✅ Working (setlist not persisted) |
| **Tests** | Playwright: dashboard visible after onboarding |
| **Go Live** | `goLive()` → opens projection window → `isLive: true` |

**Critical path — Go Live:**

```typescript
// src/stores/serviceStore.ts
goLive: async () => {
  await openProjectionWindow();
  set({ isLive: true, isBlackout: false });
  const { projectionText, projectionSubtext } = get();
  if (projectionText.trim()) projectWithSettings(projectionText, projectionSubtext);
},
```

### 3.3 Speech-to-text (STT)

| Attribute | Detail |
|:---|:---|
| **Files** | `useLiveSTT.ts`, `useWhisperSTT.ts`, `useBrowserSpeechSTT.ts`, `stt.worker.ts` |
| **Logic** | Browser speech starts immediately; Whisper loads in parallel; switch to Whisper when ready |
| **Status** | ⚠️ **Partial** — browser fallback works; Whisper often stuck downloading model |
| **Tests** | ❌ No unit tests for STT hooks |
| **Input** | MediaStream from `useAudioStream`, 16 kHz AudioContext |
| **Output** | `onTranscript(text)` → `useVerseDetection` |

**Whisper worker config:**

```typescript
// src/workers/stt.worker.ts
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;
```

**Known failure mode:** UI shows `Speech: Downloading encoder_model.onnx (N%)` indefinitely — HuggingFace CDN slow or blocked; browser speech should still show `listening (browser)`.

### 3.4 Verse detection

| Attribute | Detail |
|:---|:---|
| **Files** | `reference-parser.ts`, `verse-detector.ts`, `useVerseDetection.ts`, `VerseCard.tsx` |
| **Logic** | Parse reference from transcript → confidence gate → enrich from bible-store → add to panel |
| **Status** | ⚠️ **Partial** — works when STT produces parseable text; depends on STT + parser |
| **Tests** | ✅ 5 vitest cases in `reference-parser.test.ts` |
| **Confidence default** | `0.85` in settings; spoken refs score `0.86–0.97` |

**Detection pipeline:**

```typescript
// src/hooks/useVerseDetection.ts
let match = detectVerse(text, code);
if (!match || match.confidence < aiConfidence) return;
await ensureBibleTranslation(code);
const verse = getVerseFromStore(code, match.bookId, match.chapter, match.verse);
addDetectedVerse(match);
```

**Dedup cooldown (8 seconds):**

```typescript
// src/lib/verse-detector.ts
if (key === lastDetectedKey && now - lastDetectedAt < 8000) return null;
```

### 3.5 Bible browser

| Attribute | Detail |
|:---|:---|
| **Files** | `src/views/Bible.tsx`, `bible-store.ts`, `db/queries/bible.ts` |
| **Logic** | 3-pane: books → chapter → verses; reference jump; phrase search |
| **Status** | ✅ Working |
| **Tests** | ❌ No dedicated Bible view tests |
| **Data** | JSON from `legacy/v2/main/assets/bible/*.json` copied to `dist/bible-data/` at build |

### 3.6 Songs

| Attribute | Detail |
|:---|:---|
| **Files** | `src/views/Songs.tsx`, `db/queries/songs.ts` |
| **Logic** | CRUD songs + sections; project to preview; add to setlist |
| **Status** | ✅ Working (after `313d9ea` JSON Bible pivot) |
| **Tests** | `songs.test.ts` — **skipped** (deferred to Playwright) |
| **Insert pattern** | `sqlRun` + `lastInsertRowid` (not `RETURNING`) |

### 3.7 Projection

| Attribute | Detail |
|:---|:---|
| **Files** | `src/lib/projection.ts`, `public/output.html` |
| **Logic** | `BroadcastChannel('luminary-projection')` + optional popup on external display |
| **Status** | ✅ Working |
| **Tests** | ❌ No E2E for projection content |
| **Multi-display** | `window.getScreenDetails()` when available |

### 3.8 Settings

| Attribute | Detail |
|:---|:---|
| **Files** | `src/views/Settings.tsx`, `settingsStore.ts` |
| **Logic** | Translation, theme, audio device/gain, projection font, Whisper model/confidence/auto-mode |
| **Status** | ✅ Working |
| **Tests** | Playwright: Whisper STT options visible |
| **Persistence** | `localStorage` key `luminary-settings-v3` |

### 3.9 PWA

| Attribute | Detail |
|:---|:---|
| **Files** | `vite.config.ts` (VitePWA), `public/manifest.json` |
| **Logic** | Service worker precache; runtime cache for `/bible-data/*` and `/models/*` |
| **Status** | ✅ Working |
| **Install** | Icons in `public/pwa-icon-*.png` |
| **COOP/COEP** | Required for Turso OPFS + WASM threading |

### 3.10 Marketing site (`apps/web`)

| Attribute | Detail |
|:---|:---|
| **Files** | `apps/web/src/components/*` |
| **Logic** | Hero, Features, Pricing, Download, Try Luminary CTA → `VITE_APP_URL` |
| **Status** | ✅ Working |
| **Tests** | CI build verification only |

### 3.11 Legacy Electron v2 features (not in v3)

| Feature | v2 status | v3 status |
|:---|:---|:---|
| Media library | ✅ IPC wired | ❌ Not ported |
| Reports / CCLI | ✅ IPC wired | ❌ Not ported |
| Setlist DB persistence | ✅ IPC wired | ❌ Zustand session only |
| Licensing / tiers | ⚠️ Prefix keys | ❌ Not ported |
| Stage foldback window | ⚠️ Basic | ❌ Not ported |
| Keyboard global shortcuts | ✅ Electron `globalShortcut` | ⚠️ In-app only |
| FTS5 Bible search | ✅ SQLite FTS5 | ❌ Substring search |

---

## 4. Feature Audit & Production Readiness Assessment

### 4.1 Security & Compliance **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Authentication & Authorization | ❌ | No users, roles, RBAC, MFA, or sessions |
| Data encryption at rest | ❌ | OPFS SQLite unencrypted; localStorage settings plaintext |
| Data encryption in transit | 🟢 | HTTPS on Vercel |
| Input validation | ⚠️ | Song CRUD uses parameterized SQL; no Zod on v3 forms |
| Rate limiting | ❌ | No API server; N/A for static PWA |
| Audit logging | ❌ | `console.warn` only for DB failures |
| GDPR/CCPA/SOC2/HIPAA | ❌ | No privacy policy in app; mic/audio sent to browser STT cloud |
| Secrets management | 🟢 | No secrets in repo; `.env.example` for Turso seed script only |
| CORS/CSRF/XSS | ⚠️ | Static SPA; COOP/COEP set; no CSP meta in `index.html` |
| Dependency scanning | ❌ | No `npm audit` / Dependabot in CI |

### 4.2 Reliability & Resilience **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Error handling | ⚠️ | DB init errors shown; STT errors partial; worker drops audio if model not ready |
| Retry logic | ❌ | No retries on Bible JSON fetch or Whisper load |
| Circuit breakers | ❌ | Not implemented |
| Timeout configuration | ❌ | Whisper load can hang indefinitely |
| Graceful shutdown | ❌ | Browser tab close only |
| Health checks | ❌ | No `/health` endpoint (static deploy) |
| Idempotency | ⚠️ | `ensureBibleTranslation` dedupes in-flight loads |
| Fallback mechanisms | 🟢 | Browser speech fallback; DB `:memory:` fallback; John 3:16 minimal seed |

### 4.3 Observability & Monitoring **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Structured logging | ❌ | `console.log/warn` only |
| Metrics (Prometheus/OTel) | ❌ | Not implemented |
| Distributed tracing | ❌ | Not implemented |
| Alerting / SLO | ❌ | Not defined |
| Dashboards | ❌ | Not implemented |
| Audit trails | ❌ | Not implemented |
| Client error reporting | ❌ | No Sentry/Bugsnag |

### 4.4 Performance & Scalability **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Database indexing | ⚠️ | Indexes defined; Bible not in SQLite |
| Caching | 🟢 | Bible in-memory; Workbox PWA cache; transformers browser cache |
| Connection pooling | N/A | Single WASM DB connection |
| Background jobs | ❌ | No queue; STT in worker only |
| Horizontal scaling | N/A | Static PWA — scales via CDN |
| Load testing | ❌ | Data Unavailable — no results in repo |
| Resource limits | ⚠️ | Whisper tiny ~75 MB download; main bundle ~13 MB ONNX chunk |

**What breaks first at scale:** Not server throughput — **client memory** (full Bible JSON × 4 translations in memory) and **Whisper model download** per browser profile.

### 4.5 Data Management **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Schema migrations | ⚠️ | `SCHEMA_VERSION` written; idempotent DDL only; no versioned migration runner |
| Backup & restore | ❌ | No export/import for songs in v3 |
| Disaster recovery | ❌ | No documented RTO/RPO |
| Data retention | ❌ | Not defined |
| Integrity checks | ❌ | No checksum validation on Bible JSON |
| PII handling | ⚠️ | Song titles/lyrics local; STT may send audio to cloud |

### 4.6 API & Integration **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| REST/GraphQL API | ❌ | Client-only PWA |
| OpenAPI docs | ❌ | N/A |
| Webhooks | ❌ | N/A |
| IPC API (legacy) | 🟢 | Documented in `docs/IPC_API.md` — v2 only |

### 4.7 CI/CD & Deployment **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Lint/test gates | 🟢 | Biome + tsc + vitest in CI |
| E2E gates | 🟢 | Playwright 4 tests |
| Security scan in CI | ❌ | Not implemented |
| Staging environment | ❌ | Production Vercel only |
| DB migration in CI | N/A | Client-side WASM |
| Rollback | ⚠️ | Vercel instant rollback manual |
| Blue/green / canary | ❌ | Not configured |
| Artifact provenance | ❌ | Not implemented |
| Stale workflow | 🔴 | `build-release.yml` references Electron |

### 4.8 Code Quality & Maintainability **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Unit test coverage | 🔴 | **~5 active tests**; no coverage tooling |
| E2E coverage | ⚠️ | 4 tests — onboarding/settings only |
| Linting | 🟢 | Biome enforced in CI |
| Dead schema code | 🟡 | bible_* and setlist tables unused |
| Documentation | ⚠️ | `docs/FEATURE_STATUS.md` stale (v2) |
| Dependency freshness | ⚠️ | React 19, Vite 6 — modern; `@xenova/transformers` pinned |

### 4.9 Localization & Accessibility **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| i18n/L10n | ❌ | English hardcoded |
| RTL | ❌ | Not supported |
| WCAG 2.1 AA | ❌ | No audit; dark theme only |
| Mobile responsive | ⚠️ | Layout adapts; operator UI desktop-first |
| Cross-browser | ⚠️ | STT: Chrome/Edge/Safari (browser speech); Firefox limited |

### 4.10 User & Tenant Management **[UPDATED]**

| Item | Status | Detail |
|:---|:---|:---|
| Multi-tenancy | ❌ | Single-user local app |
| User accounts | ❌ | Not implemented |
| SSO/SAML/OIDC | ❌ | Not implemented |
| Roles/permissions | ❌ | Not implemented |

---

## 5. Known Issues & Technical Debt

| ID | Severity | Issue | Impact | Fix required |
|:---|:---|:---|:---|:---|
| K1 | 🔴 Critical | Whisper model download hangs/slow on production | STT shows perpetual "Downloading…"; users think app broken | Self-host ONNX models on same origin; preload on install |
| K2 | 🔴 Critical | Browser Speech violates offline-first pillar | Privacy/network dependency during live service | Ship offline Whisper with local model cache |
| K3 | High | Verse detection depends on STT quality | Silent failures when parser doesn't match transcript | Expand parser; show raw transcript; lower confidence floor |
| K4 | High | Setlist not persisted | Lost on refresh | Wire `serviceStore` to `setlists` tables |
| K5 | High | Dead SQLite schema (bible, setlists, settings tables) | Confusion; migration risk | Remove or implement |
| K6 | Medium | `songs.test.ts` skipped | No automated song CRUD verification | OPFS test harness or Playwright DB tests |
| K7 | Medium | No projection E2E test | Regressions undetected | Playwright: Go Live → output.html content |
| K8 | Medium | `build-release.yml` stale | Misleading CI badge / failed releases | Delete or rewrite for Tauri |
| K9 | Medium | Full Bible × 4 in memory | ~25+ MB RAM; mobile pressure | Lazy-load per translation |
| K10 | Medium | `searchBible()` O(n) substring | Slow on large result sets | FTS5 or Web Worker index |
| K11 | Low | `@tanstack/react-query` unused | Bundle noise | Remove or use for Bible/song fetching |
| K12 | Low | `useLiveAudio.ts` deprecated wrapper | Confusion | Delete |
| K13 | Low | `tsconfig.tsbuildinfo` was tracked | Repo noise | Keep in `.gitignore` only |
| K14 | Low | Marketing + PWA separate deploys | Config drift risk | Document in DEPLOYMENT.md |

---

## 6. Missing Features — Global Standards Gap Analysis

| Missing capability | Why needed | Recommended approach | Complexity |
|:---|:---|:---|:---|
| Offline Whisper (no CDN) | Core product promise; rural churches | Bundle `Xenova/whisper-tiny` in `/public/models/` | High |
| Structured logging + crash reports | Field debugging | Sentry opt-in with PII scrubbing | Medium |
| Song/setlist backup export | Data loss prevention | JSON export/import IPC or download | Medium |
| Versioned DB migrations | Schema evolution | `user_version` PRAGMA + migration files | Medium |
| Auth + license enforcement | Revenue | JWT + HMAC device binding (PRD) | High |
| i18n | Global markets | `react-i18next` + translation files | Medium |
| WCAG audit | Legal/accessibility | axe-core in CI + manual audit | Medium |
| Self-hosted STT regression tests | CI confidence | Mock worker + golden transcripts | Medium |
| Rate-limited Bible search API | N/A until backend exists | — | — |
| Multi-campus sync | Enterprise tier | Turso sync + conflict resolution | High |
| Media library (v3 port) | Worship workflows | Port legacy IPC patterns to PWA | High |
| CCLI reporting | Compliance | Port `reports:*` from legacy | Medium |
| Feature flags | Safe rollout | LaunchDarkly or env-based flags | Low |
| CSP headers | XSS hardening | `Content-Security-Policy` in vercel.json | Low |

---

## 7. Conception to Current State

### Phase 0 — Vision (pre-repo)

Church operators need **hands-free verse projection**. Legacy tools require manual reference entry. Luminary's bet: **listen → detect → suggest → project**.

### Phase 1 — Electron scaffold (Apr 2026, `3494570`)

Ten polished pages with mock data proved the UX before backend investment. **Ghost debt:** every page needed IPC wiring later.

### Phase 2 — Real desktop app (May 2026, `d95148b`–`be8a7cd`)

SQLite + Zod IPC + output window made it a real presenter. better-sqlite3 native pain began immediately on Linux CI.

### Phase 3 — Production ambition (Jun 2026, `b760b4c`)

Turso, license stubs, AI pipeline planned. Three duplicate commits suggest rushed landing. **Ghost:** HMAC license never wired.

### Phase 4 — v3 pivot (Jun 2026, `38e5434`)

**Why pivot?** Electron packaging weight, Vercel deploy desire, WASM maturity for SQLite. Tauri + PWA = one codebase, two distributions.

### Phase 5 — Bible import crisis (Jun 2026, `c16dbc6`–`313d9ea`)

Turso WASM `db.exec()` on 100k+ verse INSERTs **wedged the DB** at ~300 verses, blocking song creation on the same connection. **Decision:** abandon SQLite for Bible; serve JSON in memory. Songs stay in OPFS SQLite.

### Phase 6 — Live STT crisis (Jun 2026, `9442e65`–`84b74ea`)

Whisper never reached "ready" in production — HuggingFace download + COEP + no fallback. **Decision:** browser speech immediate fallback; better progress UI; AudioContext.resume().

### Current state (2026-06-18)

**v3 PWA is the production target.** Legacy Electron remains as reference. Core worship loop works: **Songs ✅, Bible ✅, Projection ✅, Go Live ✅**. AI verse detection is **⚠️ partial** — blocked on STT reliability. Global production readiness: **not achieved** — see §4.

---

## 8. Remediation Roadmap

### Phase A — Worship reliability (Sprint 1–2)

| Step | Action | Effort | If ignored |
|:---|:---|:---|:---|
| A1 | Self-host Whisper tiny model on `/public/models/` | M | STT broken on slow networks |
| A2 | E2E: Go Live → speak → verse detected | M | Core feature regressions |
| A3 | E2E: projection output.html content | S | Congregation sees blank |
| A4 | Persist setlist to SQLite | M | Operators lose service plan on refresh |
| A5 | Remove or implement dead schema tables | S | Developer confusion |

### Phase B — Core differentiator (Sprint 3–6)

| Step | Action | Effort | If ignored |
|:---|:---|:---|:---|
| B1 | Offline-only STT mode (no browser speech) | L | Privacy promise broken |
| B2 | Expand reference-parser tests (golden Whisper outputs) | M | Detection misses real sermons |
| B3 | Song backup export/import | M | Data loss |
| B4 | Port media library from legacy | L | Incomplete vs competitors |

### Phase C — Production hardening (Sprint 7–10)

| Step | Action | Effort | If ignored |
|:---|:---|:---|:---|
| C1 | Sentry opt-in + structured logs | M | Unknown field failure rate |
| C2 | `pnpm audit` + Dependabot | S | Supply chain risk |
| C3 | Versioned migrations | M | Schema upgrades break users |
| C4 | Delete/fix `build-release.yml` | S | CI confusion |
| C5 | CSP + security headers audit | S | XSS class findings |

### Phase D — Global scale (Sprint 11+)

| Step | Action | Effort | If ignored |
|:---|:---|:---|:---|
| D1 | i18n | M | English-only |
| D2 | License + tier gating | L | No revenue |
| D3 | Turso sync | L | No multi-device |
| D4 | WCAG 2.1 AA | M | Accessibility lawsuits |
| D5 | Load test Bible memory on low-end tablets | M | Mobile failure |

---

## 9. Setup & Installation **[UPDATED]**

### Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@10 --activate`)

### Bible data and licensing

Only the **King James Version** (public domain) ships with this repository: `legacy/v2/main/assets/bible/kjv.json`, plus the generated `public/bible-data/kjv.import.sql`.

The app also supports **NKJV, NLT and AMP**, but those translations are copyrighted (Thomas Nelson, Tyndale House Foundation and The Lockman Foundation), so their text isn't included. To use them, get the text under a licence from the publisher and put it in the same JSON format at `legacy/v2/main/assets/bible/<code>.json`. `scripts/generate-bible-sql.cjs` picks up whichever translations are present and skips the rest.

### Development (v3 PWA)

```bash
git clone https://github.com/ken-muritu/luminary.git
cd luminary
pnpm install
pnpm dev          # http://localhost:5173 — generates bible SQL first
```

### Desktop (Tauri)

```bash
pnpm tauri:dev    # Rust + Vite dev
pnpm tauri:build  # Production desktop bundle
```

### Full Bible data

Bible JSON lives in `legacy/v2/main/assets/bible/`. Build copies to `dist/bible-data/`:

```bash
pnpm build        # includes viteStaticCopy from legacy JSON
pnpm bible:sql    # generate .import.sql only (optional)
pnpm turso:seed   # seed cloud Turso DB (ops script, not runtime)
```

### Production URLs

| Target | URL |
|:---|:---|
| PWA | https://luminary-app-swart.vercel.app |
| Marketing | Vercel `luminarysite` — exact URL: Data Unavailable in repo |

### Data locations (v3 browser)

| Data | Location |
|:---|:---|
| Songs DB | OPFS `luminary-songs.db` (when cross-origin isolated) |
| Settings | `localStorage` key `luminary-settings-v3` |
| Bible | In-memory per session; JSON from `/bible-data/*.json` |
| Whisper model | Browser Cache / IndexedDB via HuggingFace CDN |

### Legacy Electron (v2 — archived)

```bash
# Reference only — not the active development path
ls legacy/v2/
./run-luminary.sh   # May not work without apps/main rebuild
```

---

## 10. Available Scripts **[UPDATED]**

| Script | What it does |
|:---|:---|
| `pnpm dev` | Generate bible SQL + Vite dev server (:5173) |
| `pnpm build` | Icons + bible SQL + tsc + Vite production build → `dist/` |
| `pnpm preview` | Serve production build locally |
| `pnpm tauri` / `tauri:dev` / `tauri:build` | Tauri desktop shell |
| `pnpm lint` / `lint:fix` | Biome check on `src/`, `e2e/`, configs |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm test` | Vitest (5 active + 1 skipped) |
| `pnpm test:e2e` | Playwright (4 tests) |
| `pnpm dev:web` | Marketing site dev |
| `pnpm bible:sql` | `scripts/generate-bible-sql.cjs` |
| `pnpm turso:seed` | Generate SQL + `scripts/seed-turso.cjs` |
| `pnpm icons` | `scripts/generate-icons.cjs` |

---

## 11. Documentation Index

| File | Contents | Freshness |
|:---|:---|:---|
| `README.md` | **This document** | 2026-06-18 |
| `README-ARCHITECTURAL.md` | v2 Electron architecture | ⚠️ Stale |
| `docs/PRD.md` | Original product requirements | Reference |
| `docs/PRD-v3.0.md` | v3 phase status | ⚠️ Partial |
| `docs/ARCHITECTURE.md` | System design (v2-centric) | ⚠️ Stale |
| `docs/FEATURE_STATUS.md` | Feature matrix | 🔴 Stale (v2) |
| `docs/IPC_API.md` | Electron IPC contract | Legacy only |
| `docs/DATABASE_SCHEMA.md` | Full schema docs | ⚠️ Overstates v3 Bible tables |
| `docs/DEPLOYMENT.md` | Deploy guide | ⚠️ Needs v3 Vercel update |
| `docs/DEV_GUIDE.md` | Developer onboarding | ⚠️ Mixed v2/v3 |
| `docs/TECHNICAL_SPEC.md` | Technical spec | Reference |

---

## Appendix A: Technology version matrix (v3, 2026-06-18) **[NEW]**

| Layer | Package | Version | Role |
|:---|:---|:---|:---|
| UI | react / react-dom | ^19.1.0 | Operator UI |
| Build | vite | ^6.3.5 | Bundler + PWA |
| CSS | tailwindcss | ^4.1.8 | Styling |
| Router | react-router-dom | ^7.6.2 | Client routing |
| State | zustand | ^5.0.5 | Stores |
| DB | @tursodatabase/database-wasm | ^0.6.1 | Songs SQLite in browser |
| AI | @xenova/transformers | ^2.17.2 | Whisper in worker |
| Desktop | @tauri-apps/cli | ^2.5.0 | Native shell |
| Test | vitest / playwright | ^3.2.1 / ^1.52.0 | CI |
| Lint | @biomejs/biome | ^1.9.4 | Format + lint |

---

## Appendix B: Test inventory (2026-06-18) **[NEW]**

| Suite | File | Count | Status |
|:---|:---|:---|:---|
| Unit | `src/lib/reference-parser.test.ts` | 5 | ✅ Pass |
| Unit | `src/db/queries/songs.test.ts` | 1 | ⏭ Skipped |
| E2E | `e2e/app.spec.ts` | 4 | ✅ CI (Playwright) |
| Coverage | — | — | ❌ Not configured |

**Last local run:** `pnpm test` — 5 passed, 1 skipped (2026-06-18).

---

*This document is the authoritative forensic record for Luminary v3 as of 2026-06-18. When code changes, update the commit table, feature statuses, and known issues before merging to `main`.*

---

## Licence

Copyright © 2026 Kennedy Muritu. All rights reserved. The code is public to read, not to reuse. See [LICENSE](LICENSE). The bundled KJV text is public domain.
