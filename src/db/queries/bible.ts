import type { BibleTranslation } from "@/lib/constants";
import type { BibleVerse } from "../bible-store";
import {
  getChapterVerses as getChapterFromStore,
  getTranslationId as getTranslationIdFromStore,
  getVerse as getVerseFromStore,
  listChapters as listChaptersFromStore,
  searchBible as searchBibleFromStore,
} from "../bible-store";

export type { BibleVerse };

export async function listChapters(translationId: number, bookNumber: number): Promise<number[]> {
  const code = translationIdToCode(translationId);
  return listChaptersFromStore(code, bookNumber);
}

export async function getTranslationId(code: BibleTranslation): Promise<number> {
  return getTranslationIdFromStore(code);
}

export async function getChapterVerses(
  translationId: number,
  bookNumber: number,
  chapter: number,
): Promise<BibleVerse[]> {
  const code = translationIdToCode(translationId);
  return getChapterFromStore(code, bookNumber, chapter);
}

export async function getVerse(
  translationId: number,
  bookNumber: number,
  chapter: number,
  verse: number,
): Promise<BibleVerse | null> {
  const code = translationIdToCode(translationId);
  return getVerseFromStore(code, bookNumber, chapter, verse);
}

export async function searchBible(
  translationId: number,
  query: string,
  limit = 20,
): Promise<BibleVerse[]> {
  const code = translationIdToCode(translationId);
  return searchBibleFromStore(code, query, limit);
}

export async function verseCount(translationId: number): Promise<number> {
  const code = translationIdToCode(translationId);
  const { getLoadedVerseCount } = await import("../bible-store");
  return getLoadedVerseCount(code);
}

function translationIdToCode(id: number): BibleTranslation {
  const map: Record<number, BibleTranslation> = { 1: "KJV", 2: "NKJV", 3: "NLT", 4: "AMP" };
  const code = map[id];
  if (!code) throw new Error(`Unknown translation id ${id}`);
  return code;
}
