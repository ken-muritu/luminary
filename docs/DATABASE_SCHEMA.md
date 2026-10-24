# Luminary — Database Schema

**Version:** 2.0.0  
**Last Updated:** April 2026  
**Engine:** SQLite via `better-sqlite3`  
**Journal Mode:** WAL (Write-Ahead Logging)

---

## 1. Initialisation

File: `apps/main/src/database/init.ts`

```typescript
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

export function initDatabase(): Database.Database {
  const dbPath = path.join(app.getPath('userData'), 'luminary.db')
  const db = new Database(dbPath)
  
  // Performance and safety pragmas
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')   // Safe with WAL; faster than FULL
  db.pragma('cache_size = -64000')    // 64 MB page cache
  db.pragma('temp_store = MEMORY')
  
  runMigrations(db)
  return db
}
```

All schema changes are versioned migrations. The `schema_migrations` table tracks which have run.

---

## 2. Primary Database: `luminary.db`

### 2.1 `schema_migrations`

Tracks applied migrations. Never modified by application logic.

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version     TEXT    NOT NULL PRIMARY KEY,  -- e.g. "001_initial_schema"
    applied_at  TEXT    NOT NULL               -- ISO 8601 timestamp
);
```

---

### 2.2 `songs`

Core song metadata. One row per song. Does **not** store lyrics (see `song_sections`).

```sql
CREATE TABLE songs (
    id              TEXT    NOT NULL PRIMARY KEY,      -- UUID v4
    title           TEXT    NOT NULL,
    artist          TEXT    NOT NULL DEFAULT '',
    album           TEXT    NOT NULL DEFAULT '',
    key             TEXT    NOT NULL DEFAULT 'C',      -- e.g. 'G', 'Am', 'F#'
    bpm             INTEGER NOT NULL DEFAULT 120,      -- 40–240
    ccli_number     TEXT,                              -- NULL if not set
    copyright       TEXT    NOT NULL DEFAULT '',
    year            INTEGER,                            -- 4-digit year
    license_type    TEXT    NOT NULL DEFAULT 'ccli'
                    CHECK (license_type IN ('public-domain', 'ccli', 'custom')),
    theme_override  TEXT,                              -- JSON blob (SongThemeOverride)
    last_projected  TEXT,                              -- ISO date string
    created_at      TEXT    NOT NULL,                  -- ISO 8601
    updated_at      TEXT    NOT NULL                   -- ISO 8601
);

CREATE INDEX idx_songs_title    ON songs (title COLLATE NOCASE);
CREATE INDEX idx_songs_artist   ON songs (artist COLLATE NOCASE);
CREATE INDEX idx_songs_ccli     ON songs (ccli_number) WHERE ccli_number IS NOT NULL;
CREATE INDEX idx_songs_updated  ON songs (updated_at DESC);

-- Full-text search index (FTS5)
-- Searches across title, artist, ccli_number, and all section lyrics
CREATE VIRTUAL TABLE songs_fts USING fts5(
    title,
    artist,
    ccli_number,
    lyrics_blob,          -- Concatenated text of all sections for this song
    content = '',         -- External content: managed manually on insert/update
    tokenize = 'unicode61 remove_diacritics 2'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER songs_fts_insert AFTER INSERT ON songs BEGIN
    INSERT INTO songs_fts (rowid, title, artist, ccli_number, lyrics_blob)
    VALUES (new.rowid, new.title, new.artist, COALESCE(new.ccli_number, ''), '');
END;

CREATE TRIGGER songs_fts_update AFTER UPDATE ON songs BEGIN
    INSERT INTO songs_fts (songs_fts, rowid, title, artist, ccli_number, lyrics_blob)
    VALUES ('delete', old.rowid, old.title, old.artist, COALESCE(old.ccli_number, ''), '');
    INSERT INTO songs_fts (rowid, title, artist, ccli_number, lyrics_blob)
    VALUES (new.rowid, new.title, new.artist, COALESCE(new.ccli_number, ''), '');
END;

CREATE TRIGGER songs_fts_delete AFTER DELETE ON songs BEGIN
    INSERT INTO songs_fts (songs_fts, rowid, title, artist, ccli_number, lyrics_blob)
    VALUES ('delete', old.rowid, old.title, old.artist, COALESCE(old.ccli_number, ''), '');
END;
```

**Column notes:**
- `id` — UUIDs generated in the main process using `crypto.randomUUID()`
- `key` — Musical key. Valid values: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B, and minor variants (Cm, etc.)
- `theme_override` — Stored as JSON string, parsed when read. Schema: `SongThemeOverride` (see Technical Spec)
- `lyrics_blob` in FTS — This should be a concatenation of all `song_sections.lyrics` for this song. The trigger above leaves it empty and it must be updated whenever sections change. A helper function `rebuildSongFTS(songId)` handles this.

---

### 2.3 `song_sections`

Lyric sections for a song. Each song has one or more sections.

```sql
CREATE TABLE song_sections (
    id          TEXT    NOT NULL PRIMARY KEY,          -- UUID v4
    song_id     TEXT    NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    type        TEXT    NOT NULL DEFAULT 'verse'
                CHECK (type IN ('verse', 'chorus', 'bridge', 'pre-chorus', 'tag', 'outro', 'instrumental')),
    label       TEXT    NOT NULL,                      -- e.g. "Verse 1", "Chorus"
    lyrics      TEXT    NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0             -- 0-indexed display order
);

CREATE INDEX idx_sections_song_id    ON song_sections (song_id);
CREATE INDEX idx_sections_song_order ON song_sections (song_id, order_index);
```

**Constraints:**
- Deleting a `songs` row cascades to delete all its `song_sections`
- `order_index` values must be unique per `song_id` (enforced in application logic, not DB)

---

### 2.4 `setlists`

Service plans. Can be a regular dated setlist or a template (no date).

```sql
CREATE TABLE setlists (
    id          TEXT    NOT NULL PRIMARY KEY,          -- UUID v4
    name        TEXT    NOT NULL,
    date        TEXT,                                  -- YYYY-MM-DD, NULL for templates
    is_template INTEGER NOT NULL DEFAULT 0             -- 0 = false, 1 = true
                CHECK (is_template IN (0, 1)),
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
);

CREATE INDEX idx_setlists_date      ON setlists (date DESC) WHERE date IS NOT NULL;
CREATE INDEX idx_setlists_template  ON setlists (is_template);
CREATE INDEX idx_setlists_updated   ON setlists (updated_at DESC);
```

---

### 2.5 `setlist_items`

Ordered items within a setlist. Polymorphic — different `type` values have different optional columns populated.

```sql
CREATE TABLE setlist_items (
    id              TEXT    NOT NULL PRIMARY KEY,      -- UUID v4
    setlist_id      TEXT    NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
    type            TEXT    NOT NULL
                    CHECK (type IN ('song', 'verse', 'media', 'timer', 'announcement', 'blank')),
    title           TEXT    NOT NULL,
    order_index     INTEGER NOT NULL DEFAULT 0,
    duration        TEXT,                              -- e.g. "5:30", "0:45", "—"
    scheduled       TEXT,                              -- e.g. "11:00 AM"

    -- song-specific
    song_id         TEXT    REFERENCES songs(id) ON DELETE SET NULL,
    song_key        TEXT,
    song_bpm        INTEGER,

    -- verse-specific
    verse_ref       TEXT,                              -- e.g. "John 3:16"
    translation     TEXT,                              -- e.g. "KJV"

    -- media-specific
    media_id        TEXT    REFERENCES media_assets(id) ON DELETE SET NULL,

    -- timer-specific
    timer_seconds   INTEGER,                           -- duration in seconds

    -- display overrides
    theme_style     TEXT,                              -- preset name or NULL
    transition      TEXT    DEFAULT 'crossfade'
                    CHECK (transition IN ('crossfade', 'cut', 'dissolve'))
);

CREATE INDEX idx_setlist_items_setlist ON setlist_items (setlist_id, order_index);
CREATE INDEX idx_setlist_items_song    ON setlist_items (song_id) WHERE song_id IS NOT NULL;
```

**On deletion:**
- Deleting a `setlists` row cascades to delete all its `setlist_items`
- If a referenced `songs` row is deleted, `song_id` becomes NULL (the item stays, now orphaned)
- If a referenced `media_assets` row is deleted, `media_id` becomes NULL

---

### 2.6 `media_assets`

Registry of imported media files. Stores metadata only — the actual files remain on disk.

```sql
CREATE TABLE media_assets (
    id              TEXT    NOT NULL PRIMARY KEY,      -- UUID v4
    name            TEXT    NOT NULL,                  -- Display name (usually filename without extension)
    file_path       TEXT    NOT NULL UNIQUE,           -- Absolute path to the media file
    category        TEXT    NOT NULL
                    CHECK (category IN ('backgrounds', 'announcements', 'countdowns', 'videos')),
    mime_type       TEXT    NOT NULL,                  -- e.g. "image/jpeg", "video/mp4"
    width           INTEGER NOT NULL DEFAULT 0,
    height          INTEGER NOT NULL DEFAULT 0,
    file_size       INTEGER NOT NULL DEFAULT 0,        -- bytes
    duration        REAL,                              -- seconds, NULL for images
    badge           TEXT    NOT NULL DEFAULT 'HD',     -- '4K' | 'HD' | 'LOOP' | 'POSTER'
    tags            TEXT    NOT NULL DEFAULT '[]',     -- JSON array of tag strings
    thumbnail_path  TEXT,                              -- Absolute path to generated thumbnail
    imported_at     TEXT    NOT NULL
);

CREATE INDEX idx_media_category   ON media_assets (category);
CREATE INDEX idx_media_imported   ON media_assets (imported_at DESC);
```

**Badge auto-detection logic (application code):**
```
width >= 3840 → '4K'
width >= 1920 → 'HD'
mime_type starts with 'video' and has no audio → 'LOOP'
mime_type starts with 'image' and category = 'announcements' → 'POSTER'
```

---

### 2.7 `song_usage_log`

Immutable projection event log for CCLI reporting. Every time a song slide is projected, a row is appended. Rows are never updated or deleted.

```sql
CREATE TABLE song_usage_log (
    id              TEXT    NOT NULL PRIMARY KEY,      -- UUID v4
    song_id         TEXT,                              -- NULL if song was deleted
    song_title      TEXT    NOT NULL,                  -- Denormalised (preserved even if song deleted)
    artist          TEXT    NOT NULL DEFAULT '',       -- Denormalised
    ccli_number     TEXT,                              -- NULL if not set at time of projection
    service_date    TEXT    NOT NULL,                  -- YYYY-MM-DD (local date of service)
    projected_at    TEXT    NOT NULL                   -- ISO 8601 UTC timestamp
);

CREATE INDEX idx_usage_song_id      ON song_usage_log (song_id) WHERE song_id IS NOT NULL;
CREATE INDEX idx_usage_service_date ON song_usage_log (service_date DESC);
CREATE INDEX idx_usage_projected_at ON song_usage_log (projected_at DESC);
```

**Design decisions:**
- `song_title` and `artist` are denormalised (copied at projection time). This ensures CCLI reports remain accurate even after songs are edited or deleted.
- There is no `ON DELETE CASCADE` on `song_id` — it becomes NULL if the song is deleted, but the log entry is preserved.
- This table is append-only in the application layer. No UPDATE or DELETE queries are ever issued against it.

---

### 2.8 `settings`

Generic key-value store for all application settings.

```sql
CREATE TABLE settings (
    key         TEXT    NOT NULL PRIMARY KEY,
    value       TEXT    NOT NULL,                      -- JSON-encoded value
    updated_at  TEXT    NOT NULL
);
```

**Default rows (inserted on first run):**
```sql
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
    ('isOnboarded',           'false',          datetime('now')),
    ('defaultTranslation',    '"KJV"',          datetime('now')),
    ('showVerseNumbers',      'true',           datetime('now')),
    ('baseFontSize',          '64',             datetime('now')),
    ('fontFamily',            '"Inter"',        datetime('now')),
    ('fontWeight',            '"bold"',         datetime('now')),
    ('shadowDepth',           '50',             datetime('now')),
    ('glowDepth',             '30',             datetime('now')),
    ('autoBackup',            'false',          datetime('now')),
    ('cloudSync',             'false',          datetime('now')),
    ('tier',                  '"community"',    datetime('now')),
    ('licenseKey',            '""',             datetime('now')),
    ('primaryLanguage',       '"English"',      datetime('now')),
    ('aiMode',                '"assisted"',     datetime('now')),
    ('aiModel',               '"whisper-tiny"', datetime('now')),
    ('aiSensitivity',         '"medium"',       datetime('now')),
    ('aiConfidenceThreshold', '0.85',           datetime('now')),
    ('mediaLibraryPath',      'null',           datetime('now'));
```

**Access pattern:**
```typescript
// Read a setting
const value = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
return JSON.parse(value?.value ?? 'null')

// Write a setting
db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
  .run(key, JSON.stringify(value), new Date().toISOString())
```

---

### 2.9 `display_mappings`

Persists the user's display role assignments across sessions.

```sql
CREATE TABLE display_mappings (
    display_id  INTEGER NOT NULL PRIMARY KEY,          -- Electron display.id (integer)
    role        TEXT    NOT NULL DEFAULT 'unassigned'
                CHECK (role IN ('main', 'stage', 'overflow', 'unassigned')),
    label       TEXT    NOT NULL DEFAULT '',           -- User-set display name
    updated_at  TEXT    NOT NULL
);
```

**Note:** `display_id` values can change between hardware reconfigurations. Luminary matches by display_id first; if a stored ID no longer exists in `screen.getAllDisplays()`, the mapping is silently ignored.

---

## 3. Bible Databases

Each translation is a separate SQLite file at `<userData>/bibles/bible-<id>.db`. All have the same schema.

### 3.1 `books`

```sql
CREATE TABLE books (
    id          INTEGER NOT NULL PRIMARY KEY,          -- Canonical book number (1–66)
    name        TEXT    NOT NULL UNIQUE,               -- e.g. "Genesis", "John"
    abbrev      TEXT    NOT NULL UNIQUE,               -- e.g. "Gen", "Jn"
    testament   TEXT    NOT NULL
                CHECK (testament IN ('OT', 'NT')),
    chapters    INTEGER NOT NULL                       -- Total chapter count
);
```

**Populated with all 66 canonical books.** OT: Genesis (1) through Malachi (39). NT: Matthew (40) through Revelation (66).

**Abbreviation mapping (sample):**
| ID | Name | Abbrev | Testament | Chapters |
|---|---|---|---|---|
| 1 | Genesis | Gen | OT | 50 |
| 2 | Exodus | Ex | OT | 40 |
| 19 | Psalms | Ps | OT | 150 |
| 40 | Matthew | Mt | NT | 28 |
| 43 | John | Jn | NT | 21 |
| 45 | Romans | Rom | NT | 16 |
| 66 | Revelation | Rev | NT | 22 |

Additional abbreviation aliases (e.g. "Joh" for John, "Ge" for Genesis) are handled in application code using a lookup table, not in the database.

---

### 3.2 `verses`

```sql
CREATE TABLE verses (
    id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    book_id     INTEGER NOT NULL REFERENCES books(id),
    chapter     INTEGER NOT NULL,
    verse       INTEGER NOT NULL,
    text        TEXT    NOT NULL,
    UNIQUE (book_id, chapter, verse)
);

CREATE INDEX idx_verses_book_chapter ON verses (book_id, chapter);
```

**Row count:** KJV = 31,102; ASV = 31,102.

---

### 3.3 `verses_fts` (Full-Text Search)

```sql
CREATE VIRTUAL TABLE verses_fts USING fts5(
    text,
    content = 'verses',
    content_rowid = 'id',
    tokenize = 'unicode61 remove_diacritics 2'
);

-- Rebuild triggers
CREATE TRIGGER verses_fts_insert AFTER INSERT ON verses BEGIN
    INSERT INTO verses_fts (rowid, text) VALUES (new.id, new.text);
END;
CREATE TRIGGER verses_fts_delete BEFORE DELETE ON verses BEGIN
    INSERT INTO verses_fts (verses_fts, rowid, text) VALUES ('delete', old.id, old.text);
END;
CREATE TRIGGER verses_fts_update AFTER UPDATE ON verses BEGIN
    INSERT INTO verses_fts (verses_fts, rowid, text) VALUES ('delete', old.id, old.text);
    INSERT INTO verses_fts (rowid, text) VALUES (new.id, new.text);
END;
```

**Query example:**
```sql
-- Keyword search with snippet
SELECT
    v.id, v.book_id, b.name AS book_name, b.abbrev,
    v.chapter, v.verse, v.text
FROM verses_fts
JOIN verses v ON v.id = verses_fts.rowid
JOIN books b  ON b.id = v.book_id
WHERE verses_fts MATCH ?
ORDER BY rank
LIMIT 200;
```

---

## 4. Migration Strategy

All DDL changes are applied as numbered migrations. The migration runner in `apps/main/src/database/migrations.ts` runs on every app start — it checks which versions are already in `schema_migrations` and runs only the new ones in order.

```typescript
const migrations: Array<{ version: string; up: (db: Database.Database) => void }> = [
  {
    version: '001_initial_schema',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (...);
        CREATE TABLE IF NOT EXISTS songs (...);
        CREATE TABLE IF NOT EXISTS song_sections (...);
        -- etc.
      `)
    }
  },
  {
    version: '002_add_display_mappings',
    up: (db) => {
      db.exec(`CREATE TABLE IF NOT EXISTS display_mappings (...)`)
    }
  },
  // Future migrations appended here
]

export function runMigrations(db: Database.Database): void {
  for (const migration of migrations) {
    const already = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(migration.version)
    if (already) continue
    
    const run = db.transaction(() => {
      migration.up(db)
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(migration.version, new Date().toISOString())
    })
    run()
  }
}
```

**Rules:**
- Migrations are **append-only**. Never edit an existing migration.
- All DDL in migrations is idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- Breaking changes (DROP COLUMN, rename) require a new migration with a data copy step.

---

## 5. Database Access Layer

File: `apps/main/src/database/` (to be created)

Structure:
```
database/
├── init.ts          ← Database connection, pragma setup, migration runner
├── migrations.ts    ← All migration definitions
├── songs.ts         ← Songs CRUD + FTS queries
├── sections.ts      ← Song sections CRUD
├── setlists.ts      ← Setlists CRUD
├── setlist-items.ts ← Setlist items CRUD + reorder
├── media.ts         ← Media assets CRUD
├── usage-log.ts     ← Append-only usage log writes + reporting queries
├── settings.ts      ← Settings get/set
├── displays.ts      ← Display mapping CRUD
└── bible.ts         ← Bible search + verse lookup (per-translation database)
```

Each module exports typed functions, not raw SQL. Example — `songs.ts`:

```typescript
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import type { Song, CreateSongPayload, UpdateSongPayload } from '../types'

export function makeSongsRepo(db: Database.Database) {
  return {
    getAll(): Song[] {
      return db.prepare(`
        SELECT s.*, GROUP_CONCAT(sec.id) AS section_ids
        FROM songs s
        LEFT JOIN song_sections sec ON sec.song_id = s.id
        GROUP BY s.id
        ORDER BY s.title COLLATE NOCASE
      `).all().map(hydrateSong)
    },

    getById(id: string): Song | null {
      const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(id)
      if (!row) return null
      return hydrateSong(row)
    },

    search(query: string): Song[] {
      return db.prepare(`
        SELECT s.*
        FROM songs_fts
        JOIN songs s ON s.rowid = songs_fts.rowid
        WHERE songs_fts MATCH ?
        ORDER BY rank
        LIMIT 100
      `).all(query).map(hydrateSong)
    },

    create: db.transaction((payload: CreateSongPayload): Song => {
      const id = randomUUID()
      const now = new Date().toISOString()
      db.prepare(`INSERT INTO songs (id, title, artist, album, key, bpm, ccli_number, 
        copyright, year, license_type, theme_override, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, payload.title, payload.artist || '', payload.album || '', payload.key,
             payload.bpm, payload.ccliNumber || null, payload.copyright || '',
             payload.year || null, payload.licenseType, 
             payload.themeOverride ? JSON.stringify(payload.themeOverride) : null,
             now, now)
      
      payload.sections.forEach((sec, i) => {
        db.prepare(`INSERT INTO song_sections (id, song_id, type, label, lyrics, order_index)
          VALUES (?, ?, ?, ?, ?, ?)`
        ).run(randomUUID(), id, sec.type, sec.label, sec.lyrics, i)
      })

      return this.getById(id)!
    }),

    // update, delete — similar patterns
  }
}

function hydrateSong(row: Record<string, unknown>): Song {
  // Map snake_case DB columns to camelCase Song interface
  // Parse JSON fields (theme_override → themeOverride)
  // Load sections separately
  // ...
}
```

---

## 6. Query Reference

### Get song usage for CCLI report

```sql
-- All songs used in the last 30 days, with counts
SELECT
    song_title,
    artist,
    ccli_number,
    COUNT(*) AS times_performed,
    MAX(service_date) AS last_performed
FROM song_usage_log
WHERE projected_at >= datetime('now', '-30 days')
GROUP BY song_title, ccli_number
ORDER BY times_performed DESC;
```

### Monthly projection velocity (last 12 months)

```sql
SELECT
    strftime('%Y-%m', projected_at) AS month,
    COUNT(*) AS count
FROM song_usage_log
WHERE projected_at >= datetime('now', '-12 months')
GROUP BY month
ORDER BY month;
```

### Missing CCLI songs (used in last 90 days)

```sql
SELECT DISTINCT song_title, artist
FROM song_usage_log
WHERE ccli_number IS NULL
  AND projected_at >= datetime('now', '-90 days')
ORDER BY song_title;
```

### Reference lookup (exact verse)

```sql
SELECT v.*, b.name AS book_name, b.abbrev, b.testament
FROM verses v
JOIN books b ON b.id = v.book_id
WHERE b.name = ? AND v.chapter = ? AND v.verse = ?
LIMIT 1;
```

### Keyword search with book-level grouping

```sql
SELECT
    b.name AS book_name,
    b.abbrev,
    v.chapter,
    v.verse,
    snippet(verses_fts, 0, '<mark>', '</mark>', '...', 32) AS snippet
FROM verses_fts
JOIN verses v ON v.id = verses_fts.rowid
JOIN books  b ON b.id = v.book_id
WHERE verses_fts MATCH ?
ORDER BY rank
LIMIT 200;
```
