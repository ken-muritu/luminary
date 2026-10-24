import { getDatabase } from "../client";
import { sqlAll, sqlGet, sqlRun } from "../sql";

export interface Song {
  id: number;
  title: string;
  artist: string;
  ccli_number: string;
  copyright: string;
  created_at: number;
  updated_at: number;
}

export interface SongSection {
  id: number;
  song_id: number;
  label: string;
  content: string;
  sort_order: number;
}

export interface SongWithSections extends Song {
  sections: SongSection[];
}

export async function listSongs(search = ""): Promise<Song[]> {
  const db = getDatabase();
  const term = search.trim();
  if (term) {
    const like = `%${term}%`;
    return sqlAll<Song>(
      db,
      `SELECT * FROM songs
       WHERE title LIKE ? OR artist LIKE ?
       ORDER BY title COLLATE NOCASE`,
      [like, like],
    );
  }
  return sqlAll<Song>(db, "SELECT * FROM songs ORDER BY title COLLATE NOCASE");
}

export async function getSong(id: number): Promise<SongWithSections | null> {
  const db = getDatabase();
  const song = await sqlGet<Song>(db, "SELECT * FROM songs WHERE id = ?", [id]);
  if (!song) return null;
  const sections = await sqlAll<SongSection>(
    db,
    "SELECT * FROM song_sections WHERE song_id = ? ORDER BY sort_order",
    [id],
  );
  return { ...song, sections };
}

export async function createSong(input: {
  title: string;
  artist?: string;
  ccli_number?: string;
  copyright?: string;
  sections?: { label: string; content: string }[];
}): Promise<number> {
  const db = getDatabase();
  const result = await sqlRun(
    db,
    "INSERT INTO songs (title, artist, ccli_number, copyright) VALUES (?, ?, ?, ?)",
    [input.title, input.artist ?? "", input.ccli_number ?? "", input.copyright ?? ""],
  );

  let songId = Number(result.lastInsertRowid);
  if (!songId) {
    const row = await sqlGet<{ id: number }>(db, "SELECT last_insert_rowid() as id");
    songId = Number(row?.id);
  }
  if (!songId) throw new Error("Failed to create song — database may be busy. Try again.");

  const sections = input.sections?.length ? input.sections : [{ label: "Verse 1", content: "" }];

  for (let i = 0; i < sections.length; i++) {
    await sqlRun(
      db,
      "INSERT INTO song_sections (song_id, label, content, sort_order) VALUES (?, ?, ?, ?)",
      [songId, sections[i].label, sections[i].content, i],
    );
  }

  return songId;
}

export async function updateSong(
  id: number,
  input: Partial<Pick<Song, "title" | "artist" | "ccli_number" | "copyright">>,
): Promise<void> {
  const db = getDatabase();
  const existing = await getSong(id);
  if (!existing) throw new Error("Song not found");

  await sqlRun(
    db,
    "UPDATE songs SET title = ?, artist = ?, ccli_number = ?, copyright = ?, updated_at = unixepoch() WHERE id = ?",
    [
      input.title ?? existing.title,
      input.artist ?? existing.artist,
      input.ccli_number ?? existing.ccli_number,
      input.copyright ?? existing.copyright,
      id,
    ],
  );
}

export async function deleteSong(id: number): Promise<void> {
  const db = getDatabase();
  await sqlRun(db, "DELETE FROM songs WHERE id = ?", [id]);
}

export async function createSongSection(
  songId: number,
  input: { label: string; content?: string },
): Promise<number> {
  const db = getDatabase();
  const maxOrder = await sqlGet<{ max_order: number }>(
    db,
    "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM song_sections WHERE song_id = ?",
    [songId],
  );
  const sortOrder = Number(maxOrder?.max_order ?? -1) + 1;
  const result = await sqlRun(
    db,
    "INSERT INTO song_sections (song_id, label, content, sort_order) VALUES (?, ?, ?, ?)",
    [songId, input.label, input.content ?? "", sortOrder],
  );
  const sectionId = Number(result.lastInsertRowid);
  if (sectionId) return sectionId;
  const row = await sqlGet<{ id: number }>(db, "SELECT last_insert_rowid() as id");
  return Number(row?.id);
}

export async function deleteSongSection(sectionId: number): Promise<void> {
  const db = getDatabase();
  await sqlRun(db, "DELETE FROM song_sections WHERE id = ?", [sectionId]);
}

export async function updateSongSection(
  sectionId: number,
  updates: Partial<Pick<SongSection, "label" | "content" | "sort_order">>,
): Promise<void> {
  const db = getDatabase();
  const section = await sqlGet<SongSection>(db, "SELECT * FROM song_sections WHERE id = ?", [
    sectionId,
  ]);
  if (!section) throw new Error("Section not found");
  await sqlRun(db, "UPDATE song_sections SET label = ?, content = ?, sort_order = ? WHERE id = ?", [
    updates.label ?? section.label,
    updates.content ?? section.content,
    updates.sort_order ?? section.sort_order,
    sectionId,
  ]);
}
