export const SCHEMA_VERSION = 4;

export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  artist TEXT NOT NULL DEFAULT '',
  ccli_number TEXT NOT NULL DEFAULT '',
  copyright TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS song_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Verse 1',
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_song_sections_song_id ON song_sections(song_id);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS bible_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bible_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  translation_id INTEGER NOT NULL REFERENCES bible_translations(id),
  name TEXT NOT NULL,
  number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bible_verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  translation_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verses_lookup ON bible_verses(translation_id, book_id, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_verses_text ON bible_verses(translation_id, text);

CREATE TABLE IF NOT EXISTS setlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Sunday Service',
  service_date TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS setlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setlist_id INTEGER NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('song', 'verse', 'blank', 'logo')),
  title TEXT NOT NULL DEFAULT '',
  song_id INTEGER REFERENCES songs(id) ON DELETE SET NULL,
  verse_ref TEXT,
  translation TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
