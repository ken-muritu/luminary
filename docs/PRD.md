# Luminary — Product Requirements Document (PRD)

**Version:** 2.0.0  
**Author:** Kennedy Muritu  
**Classification:** Strictly Confidential  
**Last Updated:** April 2026  
**Status:** Active Development  
**Repository:** https://github.com/ken-muritu/luminary

---

## 1. Executive Summary

Luminary is a professional-grade, offline-first church presentation and worship media management application built on Electron. It replaces legacy tools such as ProPresenter, EasyWorship, and MediaShout with a radically modern, AI-augmented, design-first experience built for the worship environment.

**Core tenets:**
- **Zero network dependency at runtime** — all projection, Bible retrieval, and AI inference happen entirely on-device
- **AI passive listening** — Whisper/Vosk-based voice detection auto-cues scripture verses in real time as the preacher speaks
- **Premium minimalist UX** — a dark, reverent interface built for distraction-free operation
- **Multi-tier licensing** — a Community (free) tier that is genuinely useful, with paid Standard and Pro tiers for larger ministries

---

## 2. Problem Statement

Existing church presentation software suffers from five critical failures:

| Problem | Impact |
|---|---|
| **Legacy UX** | Cluttered interfaces requiring weeks of operator training |
| **Cloud dependency** | Tools fail when internet drops during service |
| **No intelligence** | Operators manually search every verse; cognitive load is high |
| **Poor performance** | Slow startup, dropped frames during transitions |
| **Excessive cost** | $400–$1,200/year per seat with no viable free tier |

Luminary solves all five, simultaneously.

---

## 3. Target Users

### 3.1 Primary — Worship Operator / Presentation Tech
- Runs slides live during Sunday services and mid-week events
- Needs fast, keyboard-first, one-click projection with zero cognitive friction
- Must not disturb the congregation through slow or clumsy UI actions
- Typically seated at a rear station, partially in the dark

### 3.2 Secondary — Worship Leader / Senior Pastor
- Configures setlists 24–48 hours before services
- Benefits from AI-assisted verse detection while preaching
- Uses the Stage Display to see upcoming slides and a service timer

### 3.3 Tertiary — Church Administrator
- Manages CCLI licensing compliance and filing
- Reviews song usage reports quarterly
- Manages cloud backup, media assets, and multi-user licensing

---

## 4. Product Pillars

### Pillar 1: Offline-First, Always
No runtime network call is ever required for any core functionality. The Bible engine, AI inference pipeline, and all projection features function completely without internet. This is non-negotiable — a dropped connection during service must be a non-event.

### Pillar 2: AI-Augmented Operation
The AI Voice Engine passively monitors audio via the configured input device, transcribes speech in real time, detects scripture references, and either auto-projects them (Auto mode) or queues them for operator confirmation (Assisted mode). Latency target is ≤ 1.5 seconds from utterance to cue.

### Pillar 3: Premium, Distraction-Free Design
The UI uses a dark, minimal design system tuned for dim worship environments. The colour palette is deep navy/purple with high-contrast white text. Every interaction is optimised for speed under pressure. No tooltips-on-hover required to operate core features.

### Pillar 4: Operator Respect
Luminary never auto-projects without clear operator intent (except in explicit Auto mode). All AI actions are reversible. The operator always has the final say.

---

## 5. Licensing Tiers

### Community — Free Forever
| Capability | Limit |
|---|---|
| Display outputs | 1 (main congregation) |
| Bible translations | KJV + ASV (bundled) |
| AI model | Vosk Small (50 MB, < 5% CPU) |
| Song library | Unlimited songs |
| Setlists | Unlimited |
| Media library | Unlimited local files |
| CCLI reporting | Manual CSV download |
| Cloud sync | ❌ |
| Stage Display | ❌ |
| NDI® output | ❌ |
| Remote API | ❌ |
| Support | Community forum |

### Standard — $99/year
| Capability | Value |
|---|---|
| Display outputs | 2 (main + stage or lobby) |
| Bible translations | All major (NIV, ESV, NASB, NKJV, KJV, ASV) |
| AI models | Whisper Tiny (75 MB, < 15% CPU) + Whisper Base (142 MB, < 30% CPU) |
| CCLI reporting | Auto-generated CSV |
| Cloud sync | Dropbox, Google Drive, OneDrive |
| Advanced transitions | Crossfade, Dissolve, Wipe |
| Support | Priority email (48h SLA) |
| Stage Display | Basic |
| NDI® output | ❌ |
| Remote API | ❌ |

### Pro — $199/year
| Capability | Value |
|---|---|
| Display outputs | Unlimited |
| Bible translations | All + custom import |
| AI models | Whisper Small (466 MB, < 60% CPU, best accuracy) |
| NDI® output | ✅ (stream to OBS, vMix, Tricaster) |
| Remote Control API | REST + WebSocket |
| Stage Display | HD with confidence indicators |
| Multi-campus sync | Setlist push to remote Luminary instances |
| Support | 24/7 concierge (4h SLA) |
| Devices | Up to 5 simultaneous activations |

---

## 6. Feature Requirements

### 6.1 Application Shell & Navigation

**FR-SHELL-01:** The application SHALL display a fixed left sidebar containing navigation icons and labels for: Dashboard, Songs, Bible, Live, Media, Setlist, AI Engine, Settings, Reports, Licensing.

**FR-SHELL-02:** The left sidebar SHALL include a collapsible section at the bottom showing the current live output preview (a 16:9 thumbnail of the projection state), the current projection text, and a Go Live / End Live button.

**FR-SHELL-03:** A persistent top bar SHALL display: the Luminary wordmark/logo, a live service indicator (animated dot + "LIVE" when active), the current local time, and native window controls (traffic lights on macOS; standard chrome on Windows/Linux).

**FR-SHELL-04:** The sidebar bottom section SHALL show a compact live preview that is always visible regardless of which page is active.

**FR-SHELL-05:** The application SHALL show the Onboarding page if the user has not completed first-run setup. `isOnboarded` is persisted to SQLite; `false` on first install.

**FR-SHELL-06:** A system tray icon SHALL be present while the application is running with context menu items: "Show Luminary", "Go Live", "Toggle AI Listening", separator, "Quit Luminary".

**FR-SHELL-07:** A floating disambiguation card SHALL appear above the main content area (or as a system notification) when the AI engine detects a verse below the confidence threshold. The card SHALL show: detected reference, confidence %, verse text preview, and actions: "Project", "Dismiss", "Choose Verse…".

**FR-SHELL-08:** The sidebar SHALL display an active navigation indicator (highlighted background + coloured left border) for the current route.

---

### 6.2 Onboarding

**FR-ONBOARD-01:** First launch SHALL present a 3-step full-screen wizard before granting access to the main application. Steps: Welcome, Preferences, Audio Calibration.

**FR-ONBOARD-02 — Step 1 (Welcome):** Display the Luminary logo, app tagline ("Architect of Sacred Light"), a 2×2 grid of feature highlights (100% Offline, AI Listening, All Translations, <1.5s Detection), and a "system ready — all services offline" status indicator.

**FR-ONBOARD-03 — Step 2 (Preferences):** Allow selection of:
- Primary Language: English, Swahili, French, Spanish, Portuguese, Arabic
- Default Bible Translation: KJV, ASV (free); NIV, ESV, NASB, NKJV (require license activation; shown with "License req." badge)

**FR-ONBOARD-04 — Step 3 (Audio Calibration):** 
- Microphone device selection from available system inputs
- Live VU meter showing real-time input level
- "Run Auto-Test" — 10-second room noise calibration that sets the ambient noise floor baseline
- Calibration status indicator (Calibrated / Not Calibrated)
- A tip card recommending line-in from mixing board over room microphone

**FR-ONBOARD-05:** On "Complete Setup", the app SHALL: persist the selected translation to settings, set `isOnboarded = true` in SQLite, and navigate to the Dashboard.

**FR-ONBOARD-06:** The Back button SHALL navigate to the previous step. The Back button on step 1 SHALL be invisible (not disabled — invisible, via `invisible` CSS class).

---

### 6.3 Dashboard

**FR-DASH-01:** The Dashboard SHALL display three columns: (1) service status + quick controls, (2) live projection preview, (3) activity feed / AI queue.

**FR-DASH-02:** Column 1 SHALL contain:
- A "Next Up" card showing the next setlist item (type icon, title, type label, scheduled time)
- Four stat tiles: Songs in Library (count), Setlists (count), AI Status (Listening/Off badge), CCLI (Compliant/Attention Required badge)
- A "Recent Setlists" list showing the last 5 setlists with date and quick-load button

**FR-DASH-03:** Column 2 SHALL contain:
- A large 16:9 projection preview showing the current output state
- Current projection text below the preview
- Go Live / End Live button
- Blank / Logo / Black quick-control buttons

**FR-DASH-04:** Column 3 SHALL contain:
- AI Cue Queue — a list of detected verses awaiting operator action (Assisted mode). Each card shows: detected reference, confidence %, verse text (first 80 chars), "Project" and "Dismiss" buttons.
- If queue is empty and AI is Off, show an "AI is off" prompt with link to AI Engine settings.
- A compact activity log showing the last 10 projection events (song/verse projected, time).

**FR-DASH-05:** A "Quick Project" bar SHALL sit above the column layout — a keyboard-focused input that accepts a verse reference or song title. Pressing Enter SHALL immediately project the match (if unique) or show a disambiguation dropdown.

---

### 6.4 Song Manager

**FR-SONG-01:** The Song Manager page SHALL be divided into three panes: (left) song list with search, (center) lyrics editor with section tabs, (right) metadata & display settings panel.

**FR-SONG-02:** The song list SHALL display all songs from SQLite, sorted by title by default. Each row shows: title, artist, key, BPM, last projected date, CCLI number or missing indicator.

**FR-SONG-03:** The search bar SHALL perform real-time full-text search across title, artist, CCLI number, and lyric content using SQLite FTS5. Results update as the user types with ≤ 150 ms debounce.

**FR-SONG-04:** Clicking a song loads it into the center editor pane. The previously selected song is deselected.

**FR-SONG-05:** The center editor pane SHALL display:
- A tab bar listing all sections of the song (Verse 1, Verse 2, Chorus, Bridge, etc.)
- The active section's lyrics in a large, editable textarea
- Section type selector (Verse / Chorus / Bridge / Pre-Chorus / Tag / Outro / Instrumental)
- Add Section (+) and Remove Section (−) buttons
- Drag handles on section tabs for reordering

**FR-SONG-06:** Sections SHALL be reorderable via drag-and-drop on the tab strip.

**FR-SONG-07:** The right metadata panel SHALL contain:
- Title (text input)
- Artist (text input)
- Album (text input)
- Key selector (C, C#, D, D#, E, F, F#, G, G#, A, A#, B and minor equivalents)
- BPM (number input, 40–240)
- CCLI Number (text input with numeric validation)
- Copyright (text input)
- Year (4-digit number input)
- License Type selector: Public Domain / CCLI Licensed / Custom License
- Theme Override subsection: Font Family, Font Size, Text Alignment (left/center/right), Background Colour, Background Image (file picker)

**FR-SONG-08:** A "Send to Live" button SHALL immediately project the current section's lyrics to the active output display. This SHALL work even without an active setlist.

**FR-SONG-09:** A "Save" button SHALL write all changes to SQLite. Unsaved changes SHALL be indicated by a dot on the page title.

**FR-SONG-10:** A "+ New Song" button SHALL create a blank song with a default "Verse 1" section and place focus on the Title field.

**FR-SONG-11:** A "Delete" button SHALL remove the song after a confirmation dialog. Deletion SHALL also remove all song_sections and usage_log entries for that song.

**FR-SONG-12:** Import (via toolbar) SHALL accept:
- Plain text with section markers (`[Verse 1]`, `[Chorus]`, etc.)
- OpenLP XML song format
- ProPresenter 6/7 XML format
Duplicate detection (matching title + artist) SHALL present: "Song already exists — Overwrite / Keep Both / Cancel".

**FR-SONG-13:** Export SHALL produce: Plain Text, OpenLP XML, PDF lyric sheet (system print dialog).

---

### 6.5 Bible Engine

**FR-BIBLE-01:** KJV and ASV translation databases SHALL be bundled with the application (no network access required). Minimum verse count: KJV 31,102 verses, ASV 31,102 verses.

**FR-BIBLE-02:** Licensed translations (NIV, ESV, NASB, NKJV) SHALL be downloadable once upon license activation and then cached locally as separate SQLite database files. Download requires internet only at that single moment.

**FR-BIBLE-03:** The Bible page SHALL be divided into three panes: (left) translation + search controls, (center) results / passage browser, (right) output preview + actions.

**FR-BIBLE-04 — Reference Lookup:** Accepts free-form reference (e.g. "John 3:16", "Jn 3:16", "john 3 16", "Romans 8:28-32") and returns the exact verse(s). Book name matching SHALL be case-insensitive and support common abbreviations (Gen, Ex, Lev, Num, Dt, Josh, etc.).

**FR-BIBLE-05 — Keyword Search:** Accepts any text and returns all verses containing that exact phrase (SQLite FTS5). Results SHALL be grouped by book and sorted by canonical order. Maximum 200 results shown; pagination for more.

**FR-BIBLE-06:** The passage browser (center pane) SHALL show the matched verses with: book name, chapter:verse reference, verse text. Selected verses SHALL be highlighted.

**FR-BIBLE-07:** Multiple verses SHALL be selectable (click + Shift+click for range, Ctrl/Cmd+click for individual). The selection indicator shows "N verses selected".

**FR-BIBLE-08:** A translation switcher dropdown in the left pane SHALL allow changing the active translation. Switching SHALL re-render the current passage in the new translation without resetting the reference.

**FR-BIBLE-09:** Side-by-side comparison mode (Standard+ tier) SHALL display the same passage in two translations simultaneously in a split center pane. Both panes scroll synchronously.

**FR-BIBLE-10:** "Send to Live" SHALL project the selected verses as a slide (or multiple slides if the text exceeds the configured character limit per slide, defaulting to 3 verses per slide).

**FR-BIBLE-11:** "Add to Setlist" SHALL append the selected passage as a verse item at the end of the active setlist (or prompt to choose a setlist if none is active).

**FR-BIBLE-12:** Verse numbers SHALL be shown/hidden on the projected output according to the `showVerseNumbers` setting (Settings → Bible & Scripture). The toggle SHALL take effect immediately on the next projection event.

**FR-BIBLE-13:** The right panel SHALL show a live preview of how the selected verse(s) will appear on the output display (using current typography settings).

---

### 6.6 Live Control Panel

**FR-LIVE-01:** The Live page is the primary operator station. It SHALL be structured as three columns: (left) active setlist item list, (center) slide grid for the current item, (right) output preview + controls.

**FR-LIVE-02 — Left Pane (Setlist):**
- Shows all items of the active setlist as a scrollable list
- Each item shows: type icon, title, scheduled time, duration
- The currently active item is highlighted
- Clicking any item loads its slides into the center pane
- "Go Live" / "End Live" button at the top of this pane
- Item type badges: SONG (purple), VERSE (green), MEDIA (teal), TIMER (grey), BLANK (dark)

**FR-LIVE-03 — Center Pane (Slide Grid):**
- Shows all slides for the currently selected setlist item as a horizontal grid
- Each slide card is 16:9 with a text/media preview
- The currently projected slide has a highlighted ring (primary colour)
- Clicking a slide SHA immediately projects it (if Live) or stages it (if Standby)
- Keyboard: ArrowRight/ArrowLeft navigate slides; Enter projects the focused slide

**FR-LIVE-04 — Right Pane (Output Controls):**
- Large "Now Live" preview (16:9, real-time mirror of output)
- "Up Next" preview (smaller, shows next slide in queue)
- BLANK button (toggles black overlay on output)
- LOGO button (shows configured church logo on output)
- BLACK button (hard black — same as BLANK but styled differently)
- FREEZE button (locks current output frame — slide advances do not update output)
- Transition selector (Crossfade / Cut / Dissolve)
- Output status: "LIVE on [Display Name]" or "STANDBY"

**FR-LIVE-05 — Keyboard Shortcuts (Live Page):**
| Key | Action |
|---|---|
| `→` / `→` | Next / Previous slide |
| `Space` | Toggle BLANK |
| `Escape` | BLACK screen |
| `F1` | BLANK |
| `F2` | LOGO |
| `F3` | BLACK |
| `F4` | FREEZE |
| `G` | Go Live / End Live |
| `0-9` | Jump to setlist item by number |

**FR-LIVE-06:** The disambiguation card (from AI engine) SHALL appear as a floating overlay in the top-right of the Live panel when a below-threshold verse is detected. It SHALL not block the slide grid.

**FR-LIVE-07:** Slide transitions SHALL animate on the output window. The animation is rendered in the output `BrowserWindow`, not the operator `BrowserWindow`.

---

### 6.7 Media Library

**FR-MEDIA-01:** The Media Library page SHALL display a left sidebar with four category tabs: Backgrounds, Announcements, Countdowns, Video Loops.

**FR-MEDIA-02:** Each category's count SHALL be displayed next to its label in the sidebar.

**FR-MEDIA-03:** The center panel SHALL display a 3-column grid of media thumbnails. Each thumbnail card shows: preview image/video still, badge (4K / HD / LOOP / POSTER), filename.

**FR-MEDIA-04:** The grid SHALL support selection (single-click) and multi-selection (Ctrl+click). Selected items get a ring highlight.

**FR-MEDIA-05 — Import:**
- Accepted image formats: JPG, PNG, WEBP, GIF (static only), SVG
- Accepted video formats: MP4, MOV, WEBM
- Drag-and-drop onto the grid SHALL trigger import
- "Upload" button in sidebar header opens OS file picker
- On import, generate a thumbnail (first frame for video, scaled for image) and store metadata in SQLite

**FR-MEDIA-06:** The right detail panel (visible when an asset is selected) SHALL show:
- Preview (16:9 with play button for video)
- File name, dimensions, file size, type, import date
- Tags (comma-separated, editable inline)
- "Send to Live" — projects as background or fullscreen media
- "Edit Media" — opens OS default viewer/editor for the file
- "Delete" — removes from SQLite registry (leaves file on disk unless "also delete file" is checked)

**FR-MEDIA-07:** Tags SHALL be filterable from the sidebar via a tag chip list.

**FR-MEDIA-08:** The "Open Library Folder" action at the bottom of the sidebar SHALL open the configured media library path in the OS file manager (Finder on macOS, Explorer on Windows, Nautilus/Dolphin on Linux).

**FR-MEDIA-09:** Media assets are stored by absolute file path in SQLite. The library folder path is configurable (Settings → Media — to be added in future). The default library folder is `<userData>/media-library/`.

---

### 6.8 Setlist Manager

**FR-SETLIST-01:** The Setlist page SHALL display a left library panel with two groups: Recent setlists (non-templates, sorted by date descending) and Templates (isTemplate = true, sorted by name).

**FR-SETLIST-02:** The center pane SHALL show the active setlist's header (name, date, item count, estimated duration, live indicator) and the item list.

**FR-SETLIST-03:** The item list SHALL display a column header row: drag handle, item icon, title, scheduled time, duration, actions.

**FR-SETLIST-04 — Item Types and Icons:**
| Type | Icon | Colour |
|---|---|---|
| `song` | Music2 | Primary (purple) |
| `verse` | BookOpen | Secondary (green) |
| `media` | Image | Tertiary (amber) |
| `timer` | Timer | Surface variant |
| `announcement` | Megaphone | Tertiary |
| `blank` | Play | Text secondary |

**FR-SETLIST-05:** Items SHALL be reorderable via drag-and-drop on the drag handle. The new order is saved to SQLite immediately on drop.

**FR-SETLIST-06:** Song items SHALL display key and BPM below the title.

**FR-SETLIST-07:** Hovering an item reveals a "Send to Output" quick-action icon. Clicking it immediately projects that item without changing the active item selection.

**FR-SETLIST-08:** "Add item…" at the bottom of the list SHALL open a modal or inline picker to add: Song (search songs), Verse (reference input), Media (media library picker), Timer (duration input), Announcement, or Blank.

**FR-SETLIST-09:** Total estimated duration is calculated as the sum of all item durations and displayed in the header.

**FR-SETLIST-10:** The right panel SHALL show:
- Live Output Preview (ProjectionPreview component, compact mode)
- Selected item details card
- Per-item Theme Style and Transition selectors
- "Push to Screen", "Edit Slide", "Remove" actions
- Bottom: "Export as .luminary" and "Save as Template" links

**FR-SETLIST-11 — .luminary Export Format:** A JSON file with schema:
```json
{
  "version": "2.0",
  "setlist": { "name": "", "date": "", "isTemplate": false },
  "items": [
    { "type": "song", "title": "", "key": "", "bpm": 0, "sections": [] },
    { "type": "verse", "reference": "John 3:16", "translation": "KJV", "text": "" }
  ]
}
```

**FR-SETLIST-12:** "Duplicate" SHALL create a copy of the setlist with " (Copy)" appended to the name and today's date.

**FR-SETLIST-13:** "Save as Template" SHALL create a copy with `isTemplate = true` and date = null.

---

### 6.9 AI Voice Engine

**FR-AI-01:** The AI engine SHALL run as a managed child process or Worker Thread in the Electron main process. It SHALL NOT block the main thread.

**FR-AI-02 — Supported Models:**
| Model ID | Name | Size | CPU Usage | Tier |
|---|---|---|---|---|
| `vosk-small` | Vosk Small | 50 MB | < 5% | Community |
| `whisper-tiny` | Whisper Tiny | 75 MB | < 15% | Standard |
| `whisper-base` | Whisper Base | 142 MB | < 30% | Standard |
| `whisper-small` | Whisper Small | 466 MB | < 60% | Pro |

**FR-AI-03 — Detection Modes:**
- **Auto**: Detected verses at or above confidence threshold are immediately projected to the output. No operator confirmation required.
- **Assisted**: Detected verses appear in the cue queue (Dashboard + Live panel). Operator must click "Project" to project them.
- **Off**: AI listening is completely disabled. No audio processing occurs.

**FR-AI-04 — Confidence Threshold:**
- Configurable from 50% to 99% in 1% increments.
- Default: 85%.
- Detections at or above threshold in Auto mode → project immediately.
- Detections below threshold in any mode → send to disambiguation card.

**FR-AI-05 — Sensitivity Levels:**
- `high`: Low noise gate, detects quiet speech, more false positives
- `medium`: Balanced (default)
- `low`: High noise gate, requires clear speech, fewer false positives

**FR-AI-06 — Audio Input:**
- The user selects from enumerated system audio input devices
- Audio is captured as 16kHz mono PCM (the format required by both Vosk and Whisper)
- The audio pipeline: device input → resampler → model runner → transcript buffer → verse detector

**FR-AI-07 — Room Noise Calibration:**
- 10-second calibration run captures the ambient noise floor
- The baseline is subtracted from subsequent audio input to improve signal-to-noise ratio
- Calibration result is stored in settings (SQLite) and persisted across sessions

**FR-AI-08 — Live Transcript Buffer:**
- The last 30 seconds of detected speech is shown in a UI panel (AIEngine page)
- The buffer is stored exclusively in memory (never written to disk)
- The buffer is cleared when the session ends or AI is turned off
- UI label: "Never stored · Cleared on session end"

**FR-AI-09 — Verse Detection Algorithm:**
The detector runs a multi-pass regex over the transcript:
1. **Canonical references**: "John 3:16", "Genesis 1:1", "Revelation 22:21"
2. **Spoken references**: "john three sixteen", "genesis chapter one verse one"
3. **Partial references**: "verse 16" (uses current book/chapter context from last full detection)

**FR-AI-10 — Privacy Guarantee:**
- No audio data leaves the machine under any circumstances.
- No transcript data is logged to disk.
- The system makes no outbound network calls.
- This SHALL be communicated clearly in the UI and in all marketing materials.

**FR-AI-11 — Model Download:**
- Models are downloaded once (per model, per device) from the Luminary CDN upon user request.
- After download, they are cached in `<userData>/ai-models/`.
- Subsequent launches load from the local cache without network access.
- Download progress is shown in the AI Engine page.

---

### 6.10 Display Output & Windows

**FR-DISPLAY-01:** On startup, Luminary SHALL enumerate all connected displays using Electron's `screen.getAllDisplays()` API and store the results.

**FR-DISPLAY-02:** Display connection/disconnection events SHALL be monitored. On change, the display list is updated and IPC event `display:changed` is emitted to the renderer.

**FR-DISPLAY-03:** Each detected display SHALL be mappable to one of four roles: `main` (Main Congregation), `stage` (Stage Monitor), `overflow` (Lobby/Overflow), `unassigned`.

**FR-DISPLAY-04 — Output Window (Main Congregation):**
- A separate `BrowserWindow` rendered fullscreen on the display with role `main`
- `show: false` until "Go Live" is pressed
- Renders: slide text, backgrounds, media, blank/logo overlays
- Receives updates via IPC from the main process

**FR-DISPLAY-05 — Stage Display (Pro tier):**
- A separate `BrowserWindow` on the display with role `stage`
- Shows: current slide, next slide, service elapsed timer, operator notes
- Background is dark; text is large and legible from a distance

**FR-DISPLAY-06 — Lobby/Overflow:**
- A separate `BrowserWindow` on display with role `overflow`
- Mirrors the main output exactly

**FR-DISPLAY-07 — Quick Controls:**
- **BLANK**: All output windows show a solid black overlay
- **LOGO**: All output windows show the configured church logo on black background
- **BLACK**: Hard black (alias of BLANK, different UI label)
- **FREEZE**: Output windows stop updating; slide advances in the operator window do not propagate to output

**FR-DISPLAY-08:** The "Identify" button (Settings → Display Mapping) SHALL display the display number in large white text on that display for 3 seconds, so the operator can identify which physical display is which.

**FR-DISPLAY-09 — NDI® Output (Pro):**
- Uses the NDI SDK (or a Node.js NDI binding) to broadcast the output frame as an NDI source named "Luminary Output"
- Receivable by OBS Studio, vMix, Tricaster, and other NDI consumers on the local network
- Frame rate: 30fps minimum, 60fps target

---

### 6.11 Settings

**FR-SETTINGS-01 — Display Mapping:**
- Lists all detected displays with: role badge, display name, resolution
- Per-display: "Identify" button, "Calibrate" button, role selector dropdown
- Saved to SQLite on change

**FR-SETTINGS-02 — Global Typography:**
- Font Family: Inter (default), Georgia, Helvetica Neue, Noto Sans
- Base Font Size: 32–120px slider
- Font Weight: Semibold (600), Bold (700), Black (900)
- Shadow Depth: 0–100% slider (controls text-shadow blur and opacity on output)
- Glow Depth: 0–100% slider (controls text glow effect on output)
- Live Preview panel: shows "For God so loved the world" rendered with current settings
- All changes apply to the output window in real time

**FR-SETTINGS-03 — Bible & Scripture:**
- Default Translation selector
- Show Verse Numbers toggle (applies to output)
- (Future) Scripture slide split threshold (max verses per slide)

**FR-SETTINGS-04 — Backup & Sync:**
- Full System Backup: "Export Archive" → ZIP file (all SQLite data + media metadata), "Restore from File"
- Auto-Backup toggle: weekly, 4 rolling backups, stored in `<userData>/backups/`
- Cloud Sync: provider selector (Dropbox, Google Drive, OneDrive), enable toggle. Sync is file-system-level (Luminary writes to the configured cloud folder; the cloud client handles upload).

**FR-SETTINGS-05:** All settings SHALL be persisted to the `settings` table in SQLite. The renderer Zustand store is hydrated from SQLite on app start via IPC. Settings changes SHALL be written to SQLite immediately (not on explicit save button).

---

### 6.12 CCLI Reporting

**FR-CCLI-01 — Usage Logging:** Every time a song slide is projected (including re-projection of the same song), a record SHALL be written to `song_usage_log`: `song_id`, `song_title`, `ccli_number` (or null), `timestamp` (UTC ISO 8601), `service_date` (YYYY-MM-DD).

**FR-CCLI-02 — Reports Page Layout:**
- Header: title, date range filter (7d / 30d / 90d / 1y), "Generate CCLI Report" button
- Stat cards (4): Total Projections, Unique Songs, Weekly Engagement %, Missing CCLI count
- Alert banner (if missing CCLI > 0): lists song names with missing numbers, links to Song Manager
- Performance Velocity bar chart: one bar per month, height = projection count
- Status cards row: Reporting Status, Top Contributor, Next CCLI Audit date
- Song History table: title, artist, CCLI number, last projected date, frequency bar

**FR-CCLI-03 — CCLI Report CSV Format:**
```
Song Title,Artist,CCLI Number,Times Performed,Last Performed,License Type
"What A Beautiful Name","Hillsong Worship","7068424",12,"2026-03-31","CCLI"
```

**FR-CCLI-04:** "Export CSV" SHALL open a save-file dialog and write the filtered data as UTF-8 CSV.

**FR-CCLI-05:** "Generate CCLI Report" SHALL produce a formatted CCLI-compatible CSV (based on CCLI's SongSelect reporting requirements) and open the save-file dialog.

---

### 6.13 Licensing & Activation

**FR-LIC-01:** The Licensing page SHALL display the current active tier prominently.

**FR-LIC-02:** Three tier cards (Community, Standard, Pro) SHALL show: name, price, feature list (checkmarks for included, dashes for excluded), and an action button (Current Plan / Upgrade / Downgrade).

**FR-LIC-03:** The "License Key Activation" section SHALL accept a key in format `LUMINARY-XXXX-XXXX-XXXX-XXXX` and validate it via local HMAC (no network call).

**FR-LIC-04:** Successful activation SHALL: upgrade the tier in SQLite settings, update the Zustand settingsStore, and show a success indicator.

**FR-LIC-05:** Feature gates SHALL be enforced in the main process, not only in the renderer. Attempting to use a Pro feature via IPC with a Community license SHALL return an `{ error: 'TIER_REQUIRED', requiredTier: 'pro' }` response.

**FR-LIC-06:** The footer of the Licensing page SHALL show: version number, copyright, and links to Sign In, Terms of Service, Privacy Policy, Support.

---

### 6.14 Backup & Cloud Sync

**FR-BACKUP-01 — Export Archive:** A ZIP file containing:
- `luminary.db` (the main SQLite database)
- `bible-kjv.db`, `bible-asv.db` (translation databases, if present)
- `media-manifest.json` (a JSON list of all media asset metadata; actual media files are not included due to size)
- `export-manifest.json` (version, timestamp, app version, device ID)

**FR-BACKUP-02 — Restore from File:** A file picker accepts a `.luminary-backup` ZIP. After confirmation dialog ("This will replace all existing data. Continue?"), the app: stops all services, unpacks the ZIP to a temp dir, replaces database files, restarts the app.

**FR-BACKUP-03 — Auto-Backup:** Scheduled with Node.js `setInterval` at 23:00 on Saturdays (or on next app launch after that time if the app was not running). Stores rolling 4 backups in `<userData>/backups/`. File naming: `luminary-backup-YYYY-MM-DD.zip`.

**FR-BACKUP-04 — Cloud Sync:** Luminary writes the primary `luminary.db` file to a configured folder path (the cloud sync folder for the selected provider). The cloud client (Dropbox, Google Drive, OneDrive desktop app) handles the actual upload. Luminary does not call any cloud API directly.

---

## 7. Non-Functional Requirements

### 7.1 Performance
| ID | Requirement |
|---|---|
| NFR-PERF-01 | App cold start to interactive ≤ 3 seconds (4-core CPU, 8 GB RAM, SSD) |
| NFR-PERF-02 | Slide projection latency ≤ 100 ms from click to output update |
| NFR-PERF-03 | Slide transitions animate at ≥ 60 fps on output display |
| NFR-PERF-04 | Bible verse lookup returns in ≤ 200 ms |
| NFR-PERF-05 | Song full-text search returns in ≤ 150 ms |
| NFR-PERF-06 | AI detection latency ≤ 1.5 seconds from utterance to cue |
| NFR-PERF-07 | Memory ≤ 400 MB (no AI); ≤ 600 MB (Whisper Tiny); ≤ 900 MB (Whisper Small) |

### 7.2 Reliability
| ID | Requirement |
|---|---|
| NFR-REL-01 | Application SHALL NOT crash or require restart during an active live service |
| NFR-REL-02 | All SQLite writes use WAL mode and transactions; data is never corrupted on crash |
| NFR-REL-03 | AI engine crashes are auto-recovered without UI disruption |
| NFR-REL-04 | Loss of secondary display connection during service does NOT crash the app |
| NFR-REL-05 | App handles full disk gracefully (shows error, does not crash) |

### 7.3 Security
| ID | Requirement |
|---|---|
| NFR-SEC-01 | `nodeIntegration: false` on all renderer windows |
| NFR-SEC-02 | `contextIsolation: true` on all renderer windows |
| NFR-SEC-03 | Strict Content Security Policy (no inline scripts, no eval) |
| NFR-SEC-04 | No audio data transmitted off-device under any circumstances |
| NFR-SEC-05 | License validation is local HMAC only — no network calls |
| NFR-SEC-06 | No remote module usage |

### 7.4 Supported Platforms
| Platform | Versions | Architecture |
|---|---|---|
| Windows | 10, 11 | x64 |
| macOS | 12 (Monterey) and later | x64, arm64 |
| Linux | Ubuntu 20.04+, Debian 11+ | x64 |

---

## 8. Out of Scope for v2.0

The following are intentionally deferred:

- **Browser-based remote control** — web UI for tablet/phone operators (planned v2.1)
- **Mobile companion app** — iOS/Android app for worship leaders (planned v3.0)
- **Custom Bible translation importer** — import arbitrary .usfm / .osis files
- **Video editing** — trim, cut, or edit video files within Luminary
- **MIDI controller integration** — map MIDI signals to slide advance/controls
- **Live streaming integration** — direct stream to YouTube/Facebook Live (NDI covers the broadcast use case)
- **Multi-campus live video sync** — real-time video feed sharing between campuses (setlist sync only in Pro v2.0)

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| Installs within 3 months of launch | ≥ 500 |
| Crashes per 100 service sessions | < 1 |
| Net Promoter Score (worship operators) | ≥ 40 |
| Community → Standard conversion rate (6 months) | ≥ 30% |
| Average AI detection accuracy | ≥ 92% precision, ≥ 85% recall |
| Support tickets per 100 users per month | < 5 |

---

## 10. Glossary

| Term | Definition |
|---|---|
| **Setlist** | An ordered service plan (items to project during a church service) |
| **Slide** | A single projected frame: one song section or one/more Bible verses |
| **Output Window** | The `BrowserWindow` shown fullscreen on the congregation display |
| **Stage Display** | A separate display visible to the worship team (not the congregation) |
| **Disambiguation Card** | A floating UI card asking the operator to confirm an AI-detected verse |
| **Go Live** | Activating the output window to push slides to the congregation display |
| **BLANK** | A solid black overlay that hides the current slide from the congregation |
| **FREEZE** | Locking the output so slide advances in the operator UI do not show |
| **CCLI** | Christian Copyright Licensing International — licensing body for worship songs |
| **CCLI SongSelect** | CCLI's online database of licensed worship songs |
| **NDI®** | Network Device Interface — a protocol for transmitting video over LAN |
| **Vosk** | Open-source offline speech recognition library |
| **Whisper** | OpenAI's open-source speech recognition model (runs 100% on-device) |
| **WAL** | Write-Ahead Logging — SQLite journal mode for crash-safe writes |
| **FTS5** | SQLite's full-text search extension |
| **contextBridge** | Electron's secure API for exposing main-process functions to the renderer |
| **IPC** | Inter-Process Communication — message passing between Electron processes |
| **Hardware Fingerprint** | A hash of device identifiers used for offline license validation |
