# Luminary — IPC API Reference

**Version:** 2.0.0  
**Last Updated:** April 2026

This document defines every IPC channel in Luminary — the contracts between the renderer (`window.luminary.*`) and the main process (`ipcMain.handle()`). Every channel name, request payload, and response shape is specified here with exact TypeScript types.

All invoke channels follow `domain:action` naming. All push events follow `domain:event` naming.

---

## 1. Type Definitions

These shared types are used across multiple domains. They should live in `apps/main/src/types/index.ts` (and mirrored/imported in the renderer as needed).

```typescript
// ─── Common ────────────────────────────────────────────────────────────────

type ISODateString = string        // e.g. "2026-04-06T10:00:00.000Z"
type DateString    = string        // e.g. "2026-04-06"

interface IPCError {
  error: string                    // Human-readable error message
  code:  string                    // Machine-readable error code
}

type IPCResult<T> = T | IPCError

function isIPCError(r: IPCResult<unknown>): r is IPCError {
  return typeof (r as IPCError).code === 'string'
}

// ─── Songs ─────────────────────────────────────────────────────────────────

interface Song {
  id:           string
  title:        string
  artist:       string
  album?:       string
  key:          string             // e.g. "G", "Am", "F#"
  bpm:          number             // 40–240
  ccliNumber?:  string
  copyright?:   string
  year?:        number
  licenseType:  'public-domain' | 'ccli' | 'custom'
  sections:     SongSection[]
  themeOverride?: SongThemeOverride
  lastProjected?: DateString
  createdAt:    ISODateString
  updatedAt:    ISODateString
}

interface SongSection {
  id:      string
  songId:  string
  type:    'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'tag' | 'outro' | 'instrumental'
  label:   string                  // e.g. "Verse 1", "Chorus"
  lyrics:  string
  order:   number                  // 0-indexed display order
}

interface SongThemeOverride {
  fontFamily?:          string
  fontSize?:            number
  textAlign?:           'left' | 'center' | 'right'
  backgroundColor?:     string
  backgroundImagePath?: string
}

type CreateSongPayload = Omit<Song, 'id' | 'createdAt' | 'updatedAt' | 'lastProjected' | 'sections'> & {
  sections: Omit<SongSection, 'id' | 'songId'>[]
}

type UpdateSongPayload = Partial<CreateSongPayload>

// ─── Bible ─────────────────────────────────────────────────────────────────

interface BibleVerse {
  id:          number
  bookId:      number
  bookName:    string
  bookAbbrev:  string
  testament:   'OT' | 'NT'
  chapter:     number
  verse:       number
  text:        string
  translation: string
}

interface BibleSearchResult {
  verses:      BibleVerse[]
  total:       number
  query:       string
  translation: string
  mode:        'reference' | 'keyword'
}

interface BibleTranslation {
  id:        string              // e.g. "KJV"
  name:      string              // e.g. "King James Version"
  language:  string              // e.g. "English"
  available: boolean             // false if not yet downloaded
  bundled:   boolean             // true for KJV, ASV
  tier:      'community' | 'standard' | 'pro'
}

// ─── Setlists ──────────────────────────────────────────────────────────────

interface Setlist {
  id:          string
  name:        string
  date?:       DateString         // null for templates
  isTemplate:  boolean
  items:       SetlistItem[]
  createdAt:   ISODateString
  updatedAt:   ISODateString
}

interface SetlistItem {
  id:          string
  setlistId:   string
  type:        'song' | 'verse' | 'media' | 'timer' | 'announcement' | 'blank'
  title:       string
  order:       number
  duration?:   string            // e.g. "5:30", "0:45"
  scheduled?:  string            // e.g. "11:00 AM"
  // Type-specific fields
  songId?:     string            // for type === 'song'
  songKey?:    string
  songBpm?:    number
  verseRef?:   string            // for type === 'verse', e.g. "John 3:16"
  translation?: string
  mediaId?:    string            // for type === 'media'
  timerDuration?: number         // for type === 'timer', seconds
  // Display
  themeStyle?:   string          // theme preset name
  transition?:   'crossfade' | 'cut' | 'dissolve'
}

type CreateSetlistPayload = Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'items'> & {
  items?: Omit<SetlistItem, 'id' | 'setlistId'>[]
}

// ─── Media ─────────────────────────────────────────────────────────────────

type MediaCategory = 'backgrounds' | 'announcements' | 'countdowns' | 'videos'

interface MediaAsset {
  id:         string
  name:       string
  filePath:   string             // Absolute path on disk
  category:   MediaCategory
  mimeType:   string             // e.g. "image/jpeg", "video/mp4"
  width:      number
  height:     number
  fileSize:   number             // bytes
  duration?:  number             // seconds (video only)
  tags:       string[]
  badge:      '4K' | 'HD' | 'LOOP' | 'POSTER' | string
  thumbnailPath?: string
  importedAt: ISODateString
}

// ─── Output ────────────────────────────────────────────────────────────────

interface OutputSlide {
  type:        'song' | 'verse' | 'media' | 'blank' | 'logo'
  text?:       string
  reference?:  string            // Bible reference, verse type only
  mediaPath?:  string            // Absolute path to background image/video
  theme:       SlideTheme
}

interface SlideTheme {
  fontFamily:      string
  fontSize:        number
  fontWeight:      number        // 600 | 700 | 900
  textAlign:       'left' | 'center' | 'right'
  shadowDepth:     number        // 0–100
  glowDepth:       number        // 0–100
  backgroundColor: string
  transition:      'crossfade' | 'cut' | 'dissolve'
}

// ─── Settings ──────────────────────────────────────────────────────────────

type SettingsKey =
  | 'isOnboarded'
  | 'defaultTranslation'
  | 'showVerseNumbers'
  | 'baseFontSize'
  | 'fontFamily'
  | 'fontWeight'
  | 'shadowDepth'
  | 'glowDepth'
  | 'autoBackup'
  | 'cloudSync'
  | 'cloudSyncProvider'
  | 'cloudSyncPath'
  | 'tier'
  | 'licenseKey'
  | 'primaryLanguage'
  | 'aiMode'
  | 'aiModel'
  | 'aiSensitivity'
  | 'aiConfidenceThreshold'
  | 'aiCalibrationData'
  | 'mediaLibraryPath'

interface AllSettings {
  isOnboarded:           boolean
  defaultTranslation:    string
  showVerseNumbers:      boolean
  baseFontSize:          number
  fontFamily:            string
  fontWeight:            'semibold' | 'bold' | 'black'
  shadowDepth:           number
  glowDepth:             number
  autoBackup:            boolean
  cloudSync:             boolean
  cloudSyncProvider?:    'dropbox' | 'gdrive' | 'onedrive'
  cloudSyncPath?:        string
  tier:                  'community' | 'standard' | 'pro'
  licenseKey:            string
  primaryLanguage:       string
  aiMode:                'auto' | 'assisted' | 'off'
  aiModel:               'vosk-small' | 'whisper-tiny' | 'whisper-base' | 'whisper-small'
  aiSensitivity:         'high' | 'medium' | 'low'
  aiConfidenceThreshold: number
  mediaLibraryPath:      string
}

interface ElectronDisplay {
  id:         number
  label:      string
  bounds:     { x: number; y: number; width: number; height: number }
  scaleFactor: number
  isPrimary:  boolean
  role?:      'main' | 'stage' | 'overflow' | 'unassigned'
}

// ─── AI ────────────────────────────────────────────────────────────────────

interface AIConfig {
  mode:                'auto' | 'assisted' | 'off'
  model:               'vosk-small' | 'whisper-tiny' | 'whisper-base' | 'whisper-small'
  sensitivity:         'high' | 'medium' | 'low'
  confidenceThreshold: number
  audioInputDevice:    string
  calibrationData?:    { noiseFloor: number; capturedAt: ISODateString }
}

interface VerseDetection {
  reference:   string            // e.g. "John 3:16"
  book:        string
  chapter:     number
  verse:       number
  endVerse?:   number            // for ranges
  confidence:  number            // 0.0–1.0
  text:        string            // verse text preview
  translation: string
  detectedAt:  ISODateString
}

// ─── Reports ───────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '1y'

interface SongUsageRecord {
  songId:       string
  title:        string
  artist:       string
  ccliNumber?:  string
  count:        number           // Times projected in range
  lastProjected: DateString
  frequency:    number           // 0.0–1.0 relative to most-performed song
}

interface SongUsageReport {
  dateRange:          DateRange
  totalProjections:   number
  uniqueSongs:        number
  weeklyEngagement:   number     // 0.0–1.0
  missingCCLI:        number
  songs:              SongUsageRecord[]
  monthlyData:        { month: string; count: number }[]  // Last 12 months
}

// ─── Licensing ─────────────────────────────────────────────────────────────

interface LicenseStatus {
  tier:          'community' | 'standard' | 'pro'
  licenseKey:    string
  validUntil?:   DateString
  devicesUsed?:  number
  deviceLimit?:  number
  isValid:       boolean
}
```

---

## 2. Invokable Channels (Renderer → Main)

### 2.1 Songs

#### `songs:getAll`
Returns all songs, sorted by title ascending.

```typescript
// Request:  none
// Response: Song[]
ipcMain.handle('songs:getAll', async (): Promise<Song[]> => {
  return db.songs.getAll()
})
```

#### `songs:getById`
```typescript
// Request:  id: string
// Response: Song | null
ipcMain.handle('songs:getById', async (_, id: string): Promise<Song | null>)
```

#### `songs:search`
Full-text search across title, artist, CCLI number, and lyrics via SQLite FTS5.
```typescript
// Request:  query: string
// Response: Song[]
ipcMain.handle('songs:search', async (_, query: string): Promise<Song[]>)
```

#### `songs:create`
```typescript
// Request:  payload: CreateSongPayload
// Response: Song   (the newly created song with generated id)
ipcMain.handle('songs:create', async (_, payload: CreateSongPayload): Promise<Song>)
```

#### `songs:update`
```typescript
// Request:  id: string, payload: UpdateSongPayload
// Response: Song   (updated song)
ipcMain.handle('songs:update', async (_, id: string, payload: UpdateSongPayload): Promise<Song>)
```

#### `songs:delete`
```typescript
// Request:  id: string
// Response: { success: true }
ipcMain.handle('songs:delete', async (_, id: string): Promise<{ success: true }>)
```

#### `songs:import`
Accepts a file path. Auto-detects format (plain text, OpenLP XML, ProPresenter XML).
```typescript
// Request:  filePath: string
// Response: { imported: Song[], duplicates: string[], errors: string[] }
ipcMain.handle('songs:import', async (_, filePath: string))
```

#### `songs:export`
```typescript
// Request:  id: string, format: 'txt' | 'openlp-xml' | 'pdf'
// Response: { filePath: string }   (written to temp dir, caller opens save dialog)
ipcMain.handle('songs:export', async (_, id: string, format: string))
```

---

### 2.2 Bible

#### `bible:getTranslations`
```typescript
// Request:  none
// Response: BibleTranslation[]
ipcMain.handle('bible:getTranslations', async (): Promise<BibleTranslation[]>)
```

#### `bible:search`
Performs reference lookup or keyword FTS5 search depending on query shape.
```typescript
// Request:  query: string, translation: string
// Response: BibleSearchResult
ipcMain.handle('bible:search', async (_, query: string, translation: string): Promise<BibleSearchResult>)
// Detection logic:
//   - If query matches /^\d*\s*[a-zA-Z]+ \d+:\d+/ → reference mode
//   - Otherwise → FTS5 keyword mode
```

#### `bible:getVerse`
Exact verse fetch by book, chapter, verse.
```typescript
// Request:  book: string, chapter: number, verse: number, translation: string
// Response: BibleVerse | null
ipcMain.handle('bible:getVerse', async (_, book: string, chapter: number, verse: number, translation: string))
```

#### `bible:getChapter`
Returns all verses in a chapter.
```typescript
// Request:  book: string, chapter: number, translation: string
// Response: BibleVerse[]
ipcMain.handle('bible:getChapter', async (_, book: string, chapter: number, translation: string))
```

---

### 2.3 Setlists

#### `setlists:getAll`
```typescript
// Response: Setlist[]  (sorted by date descending, templates last)
ipcMain.handle('setlists:getAll', async (): Promise<Setlist[]>)
```

#### `setlists:getById`
```typescript
// Request:  id: string
// Response: Setlist | null  (includes full items array)
ipcMain.handle('setlists:getById', async (_, id: string): Promise<Setlist | null>)
```

#### `setlists:create`
```typescript
// Request:  payload: CreateSetlistPayload
// Response: Setlist
ipcMain.handle('setlists:create', async (_, payload: CreateSetlistPayload): Promise<Setlist>)
```

#### `setlists:update`
```typescript
// Request:  id: string, payload: Partial<CreateSetlistPayload>
// Response: Setlist
ipcMain.handle('setlists:update', async (_, id: string, payload))
```

#### `setlists:delete`
```typescript
// Request:  id: string
// Response: { success: true }
ipcMain.handle('setlists:delete', async (_, id: string))
```

#### `setlists:addItem`
```typescript
// Request:  setlistId: string, item: Omit<SetlistItem, 'id' | 'setlistId' | 'order'>
// Response: SetlistItem  (with generated id and appended order)
ipcMain.handle('setlists:addItem', async (_, setlistId, item))
```

#### `setlists:removeItem`
```typescript
// Request:  setlistId: string, itemId: string
// Response: { success: true }
ipcMain.handle('setlists:removeItem', async (_, setlistId, itemId))
```

#### `setlists:reorderItems`
```typescript
// Request:  setlistId: string, orderedIds: string[]  (all item IDs in new order)
// Response: { success: true }
ipcMain.handle('setlists:reorderItems', async (_, setlistId, orderedIds))
```

#### `setlists:updateItem`
```typescript
// Request:  setlistId: string, itemId: string, data: Partial<SetlistItem>
// Response: SetlistItem
ipcMain.handle('setlists:updateItem', async (_, setlistId, itemId, data))
```

---

### 2.4 Media

#### `media:getAll`
```typescript
// Request:  category?: MediaCategory
// Response: MediaAsset[]
ipcMain.handle('media:getAll', async (_, category?: MediaCategory): Promise<MediaAsset[]>)
```

#### `media:import`
Copies files to the media library folder, generates thumbnails, and writes SQLite records.
```typescript
// Request:  filePaths: string[]
// Response: { imported: MediaAsset[], errors: { path: string, error: string }[] }
ipcMain.handle('media:import', async (_, filePaths: string[]))
```

#### `media:delete`
```typescript
// Request:  id: string, deleteFile?: boolean  (default false)
// Response: { success: true }
ipcMain.handle('media:delete', async (_, id: string, deleteFile = false))
```

#### `media:updateTags`
```typescript
// Request:  id: string, tags: string[]
// Response: MediaAsset
ipcMain.handle('media:updateTags', async (_, id: string, tags: string[]))
```

#### `media:openFolder`
Opens the media library folder in the OS file manager.
```typescript
// Request:  none
// Response: { success: true }
ipcMain.handle('media:openFolder', async () => {
  shell.openPath(mediaLibraryPath)
  return { success: true }
})
```

---

### 2.5 Output

#### `output:setSlide`
Pushes a slide to the output window via `outputWindow.webContents.send('output:slide', slide)`. Also logs to `song_usage_log` if type is `song`.
```typescript
// Request:  slide: OutputSlide
// Response: { success: true }
ipcMain.handle('output:setSlide', async (_, slide: OutputSlide))
```

#### `output:setBlank`
```typescript
// Request:  on: boolean
// Response: { success: true }
ipcMain.handle('output:setBlank', async (_, on: boolean))
// Sends 'output:blank' event to all output/stage/overflow windows
```

#### `output:setLogo`
```typescript
// Request:  on: boolean
// Response: { success: true }
ipcMain.handle('output:setLogo', async (_, on: boolean))
```

#### `output:setFreeze`
```typescript
// Request:  on: boolean
// Response: { success: true }
ipcMain.handle('output:setFreeze', async (_, on: boolean))
// Sends 'output:freeze' to output windows; they stop re-rendering on subsequent slide events
```

#### `output:goLive`
Shows the output window. Creates it first if it doesn't exist. Assigns it to the display with role `main`.
```typescript
// Request:  none
// Response: { success: true }
ipcMain.handle('output:goLive', async () => {
  if (!outputWindow) createOutputWindow()
  outputWindow.show()
  operatorWindow.webContents.send('output:liveStatus', { isLive: true })
  return { success: true }
})
```

#### `output:endLive`
```typescript
// Request:  none
// Response: { success: true }
ipcMain.handle('output:endLive', async () => {
  outputWindow?.hide()
  operatorWindow.webContents.send('output:liveStatus', { isLive: false })
  return { success: true }
})
```

---

### 2.6 Settings

#### `settings:getAll`
Called once on app start to hydrate all Zustand stores.
```typescript
// Request:  none
// Response: AllSettings
ipcMain.handle('settings:getAll', async (): Promise<AllSettings>)
```

#### `settings:set`
```typescript
// Request:  key: SettingsKey, value: unknown
// Response: { success: true }
ipcMain.handle('settings:set', async (_, key: SettingsKey, value: unknown))
// Validates with Zod before writing to SQLite
```

#### `settings:getDisplays`
Returns all system displays, merged with mapped roles from SQLite.
```typescript
// Request:  none
// Response: ElectronDisplay[]
ipcMain.handle('settings:getDisplays', async (): Promise<ElectronDisplay[]>)
```

#### `settings:mapDisplay`
```typescript
// Request:  displayId: number, role: 'main' | 'stage' | 'overflow' | 'unassigned'
// Response: { success: true }
ipcMain.handle('settings:mapDisplay', async (_, displayId: number, role: string))
```

#### `settings:identifyDisplay`
Flashes the display number in white text on that display for 3 seconds.
```typescript
// Request:  displayId: number
// Response: { success: true }
ipcMain.handle('settings:identifyDisplay', async (_, displayId: number))
```

---

### 2.7 AI Engine

#### `ai:getConfig`
```typescript
// Request:  none
// Response: AIConfig
ipcMain.handle('ai:getConfig', async (): Promise<AIConfig>)
```

#### `ai:startListening`
```typescript
// Request:  none
// Response: { success: true } | IPCError
ipcMain.handle('ai:startListening', async () => {
  await aiEngine.start()
  return { success: true }
})
```

#### `ai:stopListening`
```typescript
// Request:  none
// Response: { success: true }
ipcMain.handle('ai:stopListening', async () => {
  await aiEngine.stop()
  return { success: true }
})
```

#### `ai:setMode`
```typescript
// Request:  mode: 'auto' | 'assisted' | 'off'
// Response: { success: true }
ipcMain.handle('ai:setMode', async (_, mode))
```

#### `ai:setModel`
```typescript
// Request:  model: 'vosk-small' | 'whisper-tiny' | 'whisper-base' | 'whisper-small'
// Response: { success: true } | { error: 'TIER_REQUIRED', requiredTier: string }
ipcMain.handle('ai:setModel', async (_, model) => {
  const tierOk = checkModelTier(model, currentTier)
  if (!tierOk) return { error: 'TIER_REQUIRED', requiredTier: getRequiredTier(model) }
  await aiEngine.setModel(model)
  return { success: true }
})
```

#### `ai:setConfig`
Batch-update AI configuration.
```typescript
// Request:  config: Partial<AIConfig>
// Response: { success: true }
ipcMain.handle('ai:setConfig', async (_, config: Partial<AIConfig>))
```

#### `ai:calibrate`
Runs a 10-second room noise calibration.
```typescript
// Request:  none
// Response: { success: true, noiseFloor: number }
ipcMain.handle('ai:calibrate', async () => {
  const result = await aiEngine.calibrate(10_000)
  await db.settings.set('aiCalibrationData', result)
  return { success: true, noiseFloor: result.noiseFloor }
})
```

---

### 2.8 Reports

#### `reports:getSongUsage`
```typescript
// Request:  dateRange: DateRange
// Response: SongUsageReport
ipcMain.handle('reports:getSongUsage', async (_, dateRange: DateRange): Promise<SongUsageReport>)
```

#### `reports:generateCCLIReport`
Generates a CCLI-format CSV file and opens a save dialog.
```typescript
// Request:  dateRange: DateRange
// Response: { filePath: string } | IPCError
ipcMain.handle('reports:generateCCLIReport', async (_, dateRange: DateRange))
```

#### `reports:exportCSV`
Exports the filtered song history table as CSV.
```typescript
// Request:  dateRange: DateRange
// Response: { filePath: string } | IPCError
ipcMain.handle('reports:exportCSV', async (_, dateRange: DateRange))
```

---

### 2.9 Licensing

#### `licensing:getTier`
```typescript
// Request:  none
// Response: LicenseStatus
ipcMain.handle('licensing:getTier', async (): Promise<LicenseStatus>)
```

#### `licensing:activateKey`
Validates the key via local HMAC, updates the tier in SQLite if valid.
```typescript
// Request:  key: string
// Response: { success: true, tier: string } | { success: false, error: string }
ipcMain.handle('licensing:activateKey', async (_, key: string))
```

#### `licensing:validateKey`
Validates without activating (for preview only).
```typescript
// Request:  key: string
// Response: { valid: boolean, tier?: string, expiresAt?: DateString }
ipcMain.handle('licensing:validateKey', async (_, key: string))
```

---

### 2.10 Backup

#### `backup:export`
Creates a ZIP archive of the current state and opens an OS save dialog.
```typescript
// Request:  none
// Response: { filePath: string } | IPCError
ipcMain.handle('backup:export', async ())
```

#### `backup:import`
Opens a file picker for a `.luminary-backup` ZIP, then applies it after confirmation.
```typescript
// Request:  none (opens file picker internally)
// Response: { success: true } | IPCError
ipcMain.handle('backup:import', async ())
```

#### `backup:runAutoBackup`
Manually triggers the auto-backup routine.
```typescript
// Request:  none
// Response: { success: true, filePath: string } | IPCError
ipcMain.handle('backup:runAutoBackup', async ())
```

---

## 3. Push Events (Main → Renderer)

These events are sent by the main process to the operator window via `operatorWindow.webContents.send(channel, payload)`. The preload exposes them as `window.luminary.on*(callback)`.

### `ai:verseDetected`
Fired when the AI engine detects a verse **at or above** the confidence threshold in Assisted mode.
```typescript
interface VerseDetectedPayload extends VerseDetection {}

// Usage in renderer:
window.luminary.onVerseDetected((detection: VerseDetectedPayload) => {
  aiCueStore.addItem(detection)
})
```

### `ai:disambiguate`
Fired when the AI engine detects a verse **below** the confidence threshold (any mode).
```typescript
interface DisambiguatePayload extends VerseDetection {
  alternatives: VerseDetection[]   // Other possible interpretations
}

// Usage:
window.luminary.onDisambiguate((payload: DisambiguatePayload) => {
  serviceStore.setDisambiguationCard(payload)
})
```

### `ai:audioLevel`
Fired ~30 times per second while AI is listening. Used to animate the VU meter.
```typescript
interface AudioLevelPayload {
  level: number                    // 0.0–1.0
  db:    number                    // dBFS value, e.g. -14.2
}

// Usage:
window.luminary.onAudioLevel((payload: AudioLevelPayload) => {
  aiStore.setAudioLevel(payload.level)
})
```

### `ai:transcriptChunk`
Fired when a new transcript segment is available.
```typescript
interface TranscriptChunkPayload {
  text:      string
  isFinal:   boolean
  timestamp: ISODateString
}
```

### `output:liveStatus`
Fired when the output window is shown or hidden.
```typescript
interface LiveStatusPayload {
  isLive: boolean
}

// Usage:
window.luminary.onLiveStatusChange((payload) => {
  serviceStore.setIsLive(payload.isLive)
})
```

### `display:changed`
Fired when a display is connected or disconnected.
```typescript
interface DisplayChangedPayload {
  displays: ElectronDisplay[]     // Full updated list
  event:    'added' | 'removed'
  displayId: number
}

// Usage:
window.luminary.onDisplayChanged((payload) => {
  settingsStore.setDisplays(payload.displays)
})
```

### `app:updateAvailable`
Fired when electron-updater detects a new version.
```typescript
interface UpdateAvailablePayload {
  version:     string
  releaseNotes: string
  downloadUrl: string
}
```

---

## 4. Output Window Events (Main → Output BrowserWindow)

These events are sent to the output window's `webContents`, not the operator window.

| Channel | Payload | Effect |
|---|---|---|
| `output:slide` | `OutputSlide` | Render the slide (text, background, media) |
| `output:blank` | `{ on: boolean }` | Show/hide black overlay |
| `output:logo` | `{ on: boolean }` | Show/hide logo overlay |
| `output:freeze` | `{ on: boolean }` | Pause/resume rendering updates |
| `output:theme` | `SlideTheme` | Update global theme (live preview) |

---

## 5. Error Codes Reference

| Code | Meaning |
|---|---|
| `NOT_FOUND` | Requested resource (song, setlist, etc.) does not exist |
| `VALIDATION_ERROR` | Zod validation failed on the payload |
| `TIER_REQUIRED` | Feature requires a higher license tier |
| `AI_NOT_RUNNING` | AI operation attempted while engine is stopped |
| `DB_ERROR` | SQLite operation failed |
| `FILE_NOT_FOUND` | Referenced file path does not exist on disk |
| `DUPLICATE` | Attempted to create a resource that already exists |
| `IMPORT_FAILED` | Song/backup import parsing failed |
| `EXPORT_FAILED` | File write or generation failed |
| `INVALID_LICENSE_KEY` | Key format or HMAC verification failed |
| `LICENSE_EXPIRED` | Key is valid but past the expiry date |
| `DEVICE_LIMIT_REACHED` | Key valid but used on too many devices |

---

## 6. IPC Implementation Notes

### Zod Validation Pattern
Every `ipcMain.handle` should validate its payload with Zod before processing:
```typescript
import { z } from 'zod'

const CreateSongSchema = z.object({
  title:    z.string().min(1),
  artist:   z.string(),
  key:      z.string(),
  bpm:      z.number().int().min(40).max(240),
  sections: z.array(z.object({
    type:   z.enum(['verse','chorus','bridge','pre-chorus','tag','outro','instrumental']),
    label:  z.string(),
    lyrics: z.string(),
    order:  z.number().int(),
  })),
  // ...
})

ipcMain.handle('songs:create', async (_, payload) => {
  const parsed = CreateSongSchema.safeParse(payload)
  if (!parsed.success) return { error: parsed.error.message, code: 'VALIDATION_ERROR' }
  return db.songs.create(parsed.data)
})
```

### SQLite Transaction Pattern
All multi-step writes use `better-sqlite3` transactions:
```typescript
const insertSong = db.transaction((song: CreateSongPayload) => {
  const id = uuid()
  db.prepare('INSERT INTO songs ...').run({ id, ...song })
  for (const section of song.sections) {
    db.prepare('INSERT INTO song_sections ...').run({ id: uuid(), songId: id, ...section })
  }
  return db.prepare('SELECT * FROM songs WHERE id = ?').get(id)
})
```

### Tier Gate Pattern
Feature gates are enforced in the main process:
```typescript
function requireTier(minTier: 'standard' | 'pro', currentTier: string): boolean {
  const order = { community: 0, standard: 1, pro: 2 }
  return order[currentTier] >= order[minTier]
}

ipcMain.handle('ai:setModel', async (_, model) => {
  if (model === 'whisper-small' && !requireTier('pro', currentTier)) {
    return { error: 'Whisper Small requires Pro tier', code: 'TIER_REQUIRED', requiredTier: 'pro' }
  }
  // ...
})
```
