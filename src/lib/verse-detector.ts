import { parseReferenceFromText } from "./reference-parser";

export interface VerseMatch {
  reference: string;
  book: string;
  bookId: number;
  chapter: number;
  verse: number;
  confidence: number;
  rawText: string;
  text?: string;
  translation?: string;
}

let lastDetectedKey = "";
let lastDetectedAt = 0;

export function detectVerse(text: string, translation = "KJV"): VerseMatch | null {
  const parsed = parseReferenceFromText(text);
  if (!parsed) return null;

  const key = `${parsed.bookId}:${parsed.chapter}:${parsed.verse}`;
  const now = Date.now();
  if (key === lastDetectedKey && now - lastDetectedAt < 8000) return null;

  lastDetectedKey = key;
  lastDetectedAt = now;

  return {
    reference: parsed.reference,
    book: parsed.book,
    bookId: parsed.bookId,
    chapter: parsed.chapter,
    verse: parsed.verse,
    confidence: parsed.confidence,
    rawText: text,
    translation,
  };
}

export function resetVerseDetector(): void {
  lastDetectedKey = "";
  lastDetectedAt = 0;
}
