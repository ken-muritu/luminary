import type { BibleTranslation } from "@/lib/constants";

export interface BibleVerse {
  id: number;
  translation_id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  book_name?: string;
}

export const FULL_BIBLE_MIN_VERSES = 28_000;

export type BibleSeedProgress = {
  translation: string;
  imported: number;
  total: number;
  phase: "minimal" | "full" | "done" | "error";
  message?: string;
};

export type BibleImportState = {
  active: BibleSeedProgress | null;
  completed: boolean;
  failed: string[];
};

interface BibleVerseRow {
  translation: string;
  book_id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface TranslationFile {
  translation: string;
  verses: BibleVerseRow[];
}

const TRANSLATION_IDS: Record<BibleTranslation, number> = {
  KJV: 1,
  NKJV: 2,
  NLT: 3,
  AMP: 4,
};

const cache = new Map<BibleTranslation, BibleVerseRow[]>();
const loading = new Map<BibleTranslation, Promise<void>>();

function rowToVerse(row: BibleVerseRow, translationId: number): BibleVerse {
  return {
    id: translationId * 1_000_000 + row.book_id * 10_000 + row.chapter * 100 + row.verse,
    translation_id: translationId,
    book_id: row.book_id,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
    book_name: row.book,
  };
}

export function getTranslationId(code: BibleTranslation): number {
  return TRANSLATION_IDS[code];
}

export function isTranslationLoaded(code: BibleTranslation): boolean {
  const verses = cache.get(code);
  return (verses?.length ?? 0) >= FULL_BIBLE_MIN_VERSES;
}

export function getLoadedVerseCount(code: BibleTranslation): number {
  return cache.get(code)?.length ?? 0;
}

export async function loadBibleTranslation(
  code: BibleTranslation,
  onProgress?: (p: BibleSeedProgress) => void,
): Promise<void> {
  if (isTranslationLoaded(code)) {
    const count = getLoadedVerseCount(code);
    onProgress?.({ translation: code, imported: count, total: count, phase: "done" });
    return;
  }

  const inFlight = loading.get(code);
  if (inFlight) return inFlight;

  const promise = (async () => {
    onProgress?.({ translation: code, imported: 0, total: FULL_BIBLE_MIN_VERSES, phase: "full" });

    const res = await fetch(`/bible-data/${code.toLowerCase()}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    onProgress?.({ translation: code, imported: 0, total: FULL_BIBLE_MIN_VERSES, phase: "full", message: "Downloading…" });

    const data = (await res.json()) as TranslationFile;
    if (!Array.isArray(data.verses) || data.verses.length < FULL_BIBLE_MIN_VERSES) {
      throw new Error(`Incomplete Bible data (${data.verses?.length ?? 0} verses)`);
    }

    cache.set(code, data.verses);
    onProgress?.({
      translation: code,
      imported: data.verses.length,
      total: data.verses.length,
      phase: "done",
    });
  })().catch((error) => {
    const message = error instanceof Error ? error.message : "Load failed";
    onProgress?.({ translation: code, imported: 0, total: 0, phase: "error", message });
    throw error;
  });

  loading.set(code, promise);
  try {
    await promise;
  } finally {
    loading.delete(code);
  }
}

function versesFor(code: BibleTranslation): BibleVerseRow[] {
  return cache.get(code) ?? [];
}

export function getChapterVerses(
  code: BibleTranslation,
  bookNumber: number,
  chapter: number,
): BibleVerse[] {
  const translationId = getTranslationId(code);
  return versesFor(code)
    .filter((v) => v.book_id === bookNumber && v.chapter === chapter)
    .map((v) => rowToVerse(v, translationId));
}

export function getVerse(
  code: BibleTranslation,
  bookNumber: number,
  chapter: number,
  verse: number,
): BibleVerse | null {
  const translationId = getTranslationId(code);
  const row = versesFor(code).find(
    (v) => v.book_id === bookNumber && v.chapter === chapter && v.verse === verse,
  );
  return row ? rowToVerse(row, translationId) : null;
}

export function listChapters(code: BibleTranslation, bookNumber: number): number[] {
  const chapters = new Set<number>();
  for (const v of versesFor(code)) {
    if (v.book_id === bookNumber) chapters.add(v.chapter);
  }
  return [...chapters].sort((a, b) => a - b);
}

export function searchBible(code: BibleTranslation, query: string, limit = 20): BibleVerse[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const translationId = getTranslationId(code);
  const results: BibleVerse[] = [];
  for (const row of versesFor(code)) {
    if (!row.text.toLowerCase().includes(q)) continue;
    results.push(rowToVerse(row, translationId));
    if (results.length >= limit) break;
  }
  return results;
}

/** Minimal John 3:16 available before full JSON fetch completes. */
const MINIMAL: Record<BibleTranslation, BibleVerseRow> = {
  KJV: {
    translation: "KJV",
    book_id: 43,
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  },
  NKJV: {
    translation: "NKJV",
    book_id: 43,
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have eternal life.",
  },
  NLT: {
    translation: "NLT",
    book_id: 43,
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.",
  },
  AMP: {
    translation: "AMP",
    book_id: 43,
    book: "John",
    chapter: 3,
    verse: 16,
    text: "For God so [greatly] loved and dearly prized the world, that He [even] gave His [One and] only begotten Son, so that whoever believes and trusts in Him [as Savior] shall not perish, but have eternal life.",
  },
};

export function seedMinimalInMemory(): void {
  for (const code of Object.keys(MINIMAL) as BibleTranslation[]) {
    if (!cache.has(code)) cache.set(code, [MINIMAL[code]]);
  }
}

export function resetBibleStoreForTests(): void {
  cache.clear();
  loading.clear();
}
