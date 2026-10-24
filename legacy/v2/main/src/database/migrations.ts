import { getDb } from './client'

async function execAll(db: ReturnType<typeof getDb>, sql: string): Promise<void> {
  const statements: string[] = []
  let current = ''
  let depth = 0

  for (const line of sql.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('--')) continue

    current += `${line}\n`
    if (/\bBEGIN\b/i.test(line)) depth++
    if (/\bEND\b/i.test(trimmed)) depth = Math.max(0, depth - 1)

    if (trimmed.endsWith(';') && depth === 0) {
      const stmt = current.trim().replace(/;\s*$/, '')
      if (stmt) statements.push(stmt)
      current = ''
    }
  }

  if (current.trim()) statements.push(current.trim().replace(/;\s*$/, ''))

  for (const stmt of statements) {
    await db.execute(stmt)
  }
}

export async function runMigrations(): Promise<void> {
  const db = getDb()

  await execAll(db, `
    CREATE TABLE IF NOT EXISTS songs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL DEFAULT '',
      artist      TEXT    NOT NULL DEFAULT '',
      album       TEXT    NOT NULL DEFAULT '',
      key_sig     TEXT    NOT NULL DEFAULT '',
      bpm         INTEGER,
      ccli_number TEXT    NOT NULL DEFAULT '',
      copyright   TEXT    NOT NULL DEFAULT '',
      year        INTEGER,
      license_type TEXT   NOT NULL DEFAULT 'ccli' CHECK (license_type IN ('public_domain','ccli','custom')),
      font_family TEXT,
      font_size   INTEGER,
      text_align  TEXT    CHECK (text_align IN ('left','center','right')),
      bg_color    TEXT,
      bg_image    TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS song_sections (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id     INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
      type        TEXT    NOT NULL DEFAULT 'verse' CHECK (type IN ('verse','chorus','bridge','pre_chorus','tag','outro','instrumental')),
      label       TEXT    NOT NULL DEFAULT 'Verse 1',
      lyrics      TEXT    NOT NULL DEFAULT '',
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_song_sections_song_id ON song_sections(song_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
      title,
      artist,
      ccli_number,
      content=songs,
      content_rowid=id
    );

    CREATE TABLE IF NOT EXISTS setlists (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL DEFAULT 'New Setlist',
      service_date TEXT,
      is_template  INTEGER NOT NULL DEFAULT 0,
      notes        TEXT    NOT NULL DEFAULT '',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS setlist_items (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      setlist_id   INTEGER NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
      type         TEXT    NOT NULL CHECK (type IN ('song','verse','media','timer','announcement','blank')),
      title        TEXT    NOT NULL DEFAULT '',
      subtitle     TEXT    NOT NULL DEFAULT '',
      song_id      INTEGER REFERENCES songs(id) ON DELETE SET NULL,
      verse_ref    TEXT,
      translation  TEXT,
      media_path   TEXT,
      duration_s   INTEGER,
      position     INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_setlist_items_setlist_id ON setlist_items(setlist_id);

    CREATE TABLE IF NOT EXISTS media_assets (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path    TEXT    NOT NULL UNIQUE,
      file_name    TEXT    NOT NULL DEFAULT '',
      category     TEXT    NOT NULL DEFAULT 'backgrounds' CHECK (category IN ('backgrounds','announcements','countdowns','video_loops')),
      mime_type    TEXT    NOT NULL DEFAULT '',
      width        INTEGER,
      height       INTEGER,
      file_size    INTEGER,
      tags         TEXT    NOT NULL DEFAULT '',
      thumbnail    TEXT,
      imported_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS song_usage_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id      INTEGER REFERENCES songs(id) ON DELETE SET NULL,
      song_title   TEXT    NOT NULL DEFAULT '',
      ccli_number  TEXT,
      service_date TEXT    NOT NULL DEFAULT (date('now')),
      logged_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_usage_log_service_date ON song_usage_log(service_date);
    CREATE INDEX IF NOT EXISTS idx_usage_log_song_id ON song_usage_log(song_id);

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('isOnboarded',       'false'),
      ('defaultTranslation','KJV'),
      ('showVerseNumbers',  'true'),
      ('fontFamily',        'Inter'),
      ('baseFontSize',      '72'),
      ('fontWeight',        'bold'),
      ('shadowDepth',       '50'),
      ('glowDepth',         '30'),
      ('autoBackup',        'true'),
      ('cloudSync',         'false'),
      ('reducedMotion',     'false'),
      ('largeFontMode',     'false'),
      ('licenseTier',       'community'),
      ('licenseKey',        ''),
      ('language',          'en');

    -- Bible Tables
    CREATE TABLE IF NOT EXISTS bible_translations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      language    TEXT    NOT NULL DEFAULT 'en',
      is_public_domain INTEGER NOT NULL DEFAULT 1,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS bible_books (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      short_name  TEXT    NOT NULL,
      testament   TEXT    NOT NULL CHECK (testament IN ('old','new')),
      position    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bible_verses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      translation TEXT    NOT NULL,
      book_id     INTEGER NOT NULL REFERENCES bible_books(id),
      chapter     INTEGER NOT NULL,
      verse       INTEGER NOT NULL,
      text        TEXT    NOT NULL,
      UNIQUE(translation, book_id, chapter, verse)
    );

    CREATE INDEX IF NOT EXISTS idx_verses_lookup ON bible_verses(translation, book_id, chapter, verse);

    -- FTS5 for full-text Bible search
    CREATE VIRTUAL TABLE IF NOT EXISTS bible_verses_fts USING fts5(
      text,
      content='bible_verses',
      content_rowid='id',
      tokenize='porter unicode61'
    );

    -- Sync triggers for FTS5
    CREATE TRIGGER IF NOT EXISTS bible_fts_insert AFTER INSERT ON bible_verses
    BEGIN
      INSERT INTO bible_verses_fts(rowid, text) VALUES (new.id, new.text);
    END;

    CREATE TRIGGER IF NOT EXISTS bible_fts_delete AFTER DELETE ON bible_verses
    BEGIN
      INSERT INTO bible_verses_fts(bible_verses_fts, rowid, text) VALUES ('delete', old.id, old.text);
    END;

    CREATE TRIGGER IF NOT EXISTS bible_fts_update AFTER UPDATE ON bible_verses
    BEGIN
      INSERT INTO bible_verses_fts(bible_verses_fts, rowid, text) VALUES ('delete', old.id, old.text);
      INSERT INTO bible_verses_fts(rowid, text) VALUES (new.id, new.text);
    END;

    -- Insert default translations
    INSERT OR IGNORE INTO bible_translations (code, name, language, is_public_domain, description) VALUES
      ('KJV',  'King James Version', 'en', 1, 'Classic 1611 translation'),
      ('NKJV', 'New King James Version', 'en', 0, 'Modern update of KJV'),
      ('NLT',  'New Living Translation', 'en', 0, 'Easy-to-read modern translation'),
      ('AMP',  'Amplified Bible', 'en', 0, 'Expanded translation with alternate readings'),
      ('ASV',  'American Standard Version', 'en', 1, '1901 public domain translation'),
      ('WEB',  'World English Bible', 'en', 1, 'Modern public domain translation');

    -- Insert Bible books (66 canonical books)
    INSERT OR IGNORE INTO bible_books (id, name, short_name, testament, position) VALUES
      (1,  'Genesis', 'Gen', 'old', 1),
      (2,  'Exodus', 'Exo', 'old', 2),
      (3,  'Leviticus', 'Lev', 'old', 3),
      (4,  'Numbers', 'Num', 'old', 4),
      (5,  'Deuteronomy', 'Deu', 'old', 5),
      (6,  'Joshua', 'Jos', 'old', 6),
      (7,  'Judges', 'Jdg', 'old', 7),
      (8,  'Ruth', 'Rut', 'old', 8),
      (9,  '1 Samuel', '1Sa', 'old', 9),
      (10, '2 Samuel', '2Sa', 'old', 10),
      (11, '1 Kings', '1Ki', 'old', 11),
      (12, '2 Kings', '2Ki', 'old', 12),
      (13, '1 Chronicles', '1Ch', 'old', 13),
      (14, '2 Chronicles', '2Ch', 'old', 14),
      (15, 'Ezra', 'Ezr', 'old', 15),
      (16, 'Nehemiah', 'Neh', 'old', 16),
      (17, 'Esther', 'Est', 'old', 17),
      (18, 'Job', 'Job', 'old', 18),
      (19, 'Psalms', 'Psa', 'old', 19),
      (20, 'Proverbs', 'Pro', 'old', 20),
      (21, 'Ecclesiastes', 'Ecc', 'old', 21),
      (22, 'Song of Solomon', 'Sng', 'old', 22),
      (23, 'Isaiah', 'Isa', 'old', 23),
      (24, 'Jeremiah', 'Jer', 'old', 24),
      (25, 'Lamentations', 'Lam', 'old', 25),
      (26, 'Ezekiel', 'Eze', 'old', 26),
      (27, 'Daniel', 'Dan', 'old', 27),
      (28, 'Hosea', 'Hos', 'old', 28),
      (29, 'Joel', 'Joe', 'old', 29),
      (30, 'Amos', 'Amo', 'old', 30),
      (31, 'Obadiah', 'Oba', 'old', 31),
      (32, 'Jonah', 'Jon', 'old', 32),
      (33, 'Micah', 'Mic', 'old', 33),
      (34, 'Nahum', 'Nah', 'old', 34),
      (35, 'Habakkuk', 'Hab', 'old', 35),
      (36, 'Zephaniah', 'Zep', 'old', 36),
      (37, 'Haggai', 'Hag', 'old', 37),
      (38, 'Zechariah', 'Zec', 'old', 38),
      (39, 'Malachi', 'Mal', 'old', 39),
      (40, 'Matthew', 'Mat', 'new', 1),
      (41, 'Mark', 'Mrk', 'new', 2),
      (42, 'Luke', 'Luk', 'new', 3),
      (43, 'John', 'Jhn', 'new', 4),
      (44, 'Acts', 'Act', 'new', 5),
      (45, 'Romans', 'Rom', 'new', 6),
      (46, '1 Corinthians', '1Co', 'new', 7),
      (47, '2 Corinthians', '2Co', 'new', 8),
      (48, 'Galatians', 'Gal', 'new', 9),
      (49, 'Ephesians', 'Eph', 'new', 10),
      (50, 'Philippians', 'Php', 'new', 11),
      (51, 'Colossians', 'Col', 'new', 12),
      (52, '1 Thessalonians', '1Th', 'new', 13),
      (53, '2 Thessalonians', '2Th', 'new', 14),
      (54, '1 Timothy', '1Ti', 'new', 15),
      (55, '2 Timothy', '2Ti', 'new', 16),
      (56, 'Titus', 'Tit', 'new', 17),
      (57, 'Philemon', 'Phm', 'new', 18),
      (58, 'Hebrews', 'Heb', 'new', 19),
      (59, 'James', 'Jas', 'new', 20),
      (60, '1 Peter', '1Pe', 'new', 21),
      (61, '2 Peter', '2Pe', 'new', 22),
      (62, '1 John', '1Jn', 'new', 23),
      (63, '2 John', '2Jn', 'new', 24),
      (64, '3 John', '3Jn', 'new', 25),
      (65, 'Jude', 'Jud', 'new', 26),
      (66, 'Revelation', 'Rev', 'new', 27);
  `)

  await execAll(db, `
    CREATE TRIGGER IF NOT EXISTS songs_fts_insert AFTER INSERT ON songs
    BEGIN
      INSERT INTO songs_fts(rowid, title, artist, ccli_number)
      VALUES (new.id, new.title, new.artist, new.ccli_number);
    END;

    CREATE TRIGGER IF NOT EXISTS songs_fts_delete AFTER DELETE ON songs
    BEGIN
      INSERT INTO songs_fts(songs_fts, rowid, title, artist, ccli_number)
      VALUES ('delete', old.id, old.title, old.artist, old.ccli_number);
    END;

    CREATE TRIGGER IF NOT EXISTS songs_fts_update AFTER UPDATE ON songs
    BEGIN
      INSERT INTO songs_fts(songs_fts, rowid, title, artist, ccli_number)
      VALUES ('delete', old.id, old.title, old.artist, old.ccli_number);
      INSERT INTO songs_fts(rowid, title, artist, ccli_number)
      VALUES (new.id, new.title, new.artist, new.ccli_number);
    END;
  `)

  // Full Bible seeding is handled by seedBibleIfEmpty() in index.ts
}

// Legacy function - now handled by seedBible.ts
async function seedBibleVerses(db: ReturnType<typeof getDb>): Promise<void> {
  const result = await db.execute('SELECT COUNT(*) as count FROM bible_verses')
  const count = Number(result.rows[0]?.count || 0)
  if (count > 0) return

  // Seed John 3:16-18 for all translations
  const verses = [
    // KJV
    { t: 'KJV', b: 43, c: 3, v: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
    { t: 'KJV', b: 43, c: 3, v: 17, text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.' },
    { t: 'KJV', b: 43, c: 3, v: 18, text: 'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.' },
    // NKJV
    { t: 'NKJV', b: 43, c: 3, v: 16, text: 'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.' },
    { t: 'NKJV', b: 43, c: 3, v: 17, text: 'For God did not send His Son into the world to condemn the world, but that the world through Him might be saved.' },
    { t: 'NKJV', b: 43, c: 3, v: 18, text: 'He who believes in Him is not condemned; but he who does not believe is condemned already, because he has not believed in the name of the only begotten Son of God.' },
    // NLT
    { t: 'NLT', b: 43, c: 3, v: 16, text: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.' },
    { t: 'NLT', b: 43, c: 3, v: 17, text: 'God sent his Son into the world not to judge the world, but to save the world through him.' },
    { t: 'NLT', b: 43, c: 3, v: 18, text: 'There is no judgment against anyone who believes in him. But anyone who does not believe in him has already been judged for not believing in God\'s one and only Son.' },
    // AMP
    { t: 'AMP', b: 43, c: 3, v: 16, text: 'For God so [greatly] loved and dearly prized the world, that He [even] gave His [One and] only begotten Son, so that whoever believes and trusts in Him [as Savior] shall not perish, but have eternal life.' },
    { t: 'AMP', b: 43, c: 3, v: 17, text: 'For God did not send the Son into the world to judge and condemn the world [that is, to initiate the final judgment of the world], but that the world might be saved through Him.' },
    { t: 'AMP', b: 43, c: 3, v: 18, text: 'Whoever believes and trusts in the Son and accepts Him [as Savior] has eternal life; but whoever does not believe the Son and chooses to reject Him, refuse to trust in Him will not see life, but God\'s wrath hangs over him continually.' },
    // ASV
    { t: 'ASV', b: 43, c: 3, v: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.' },
    { t: 'ASV', b: 43, c: 3, v: 17, text: 'For God sent not the Son into the world to judge the world; but that the world should be saved through him.' },
    { t: 'ASV', b: 43, c: 3, v: 18, text: 'He that believeth on him is not judged: he that believeth not hath been judged already, because he hath not believed on the name of the only begotten Son of God.' },
    // WEB
    { t: 'WEB', b: 43, c: 3, v: 16, text: 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.' },
    { t: 'WEB', b: 43, c: 3, v: 17, text: 'For God didn\'t send his Son into the world to judge the world, but that the world should be saved through him.' },
    { t: 'WEB', b: 43, c: 3, v: 18, text: 'He who believes in him is not judged. He who doesn\'t believe has been judged already, because he has not believed in the name of the one and only Son of God.' },
  ]

  for (const v of verses) {
    await db.execute({
      sql: 'INSERT INTO bible_verses (translation, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)',
      args: [v.t, v.b, v.c, v.v, v.text]
    })
  }
}
