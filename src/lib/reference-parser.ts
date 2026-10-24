export interface ParsedVerseRef {
  book: string;
  bookId: number;
  chapter: number;
  verse: number;
  reference: string;
  confidence: number;
}

const BOOKS: { id: number; name: string; aliases: string[] }[] = [
  { id: 1, name: "Genesis", aliases: ["gen", "genesis"] },
  { id: 2, name: "Exodus", aliases: ["exo", "exodus", "ex"] },
  { id: 3, name: "Leviticus", aliases: ["lev", "leviticus"] },
  { id: 4, name: "Numbers", aliases: ["num", "numbers"] },
  { id: 5, name: "Deuteronomy", aliases: ["deu", "deuteronomy", "deut"] },
  { id: 6, name: "Joshua", aliases: ["jos", "joshua", "josh"] },
  { id: 7, name: "Judges", aliases: ["jdg", "judges", "judg"] },
  { id: 8, name: "Ruth", aliases: ["rut", "ruth"] },
  { id: 9, name: "1 Samuel", aliases: ["1sa", "1 samuel", "1sam", "first samuel"] },
  { id: 10, name: "2 Samuel", aliases: ["2sa", "2 samuel", "2sam", "second samuel"] },
  { id: 11, name: "1 Kings", aliases: ["1ki", "1 kings", "1kings", "first kings"] },
  { id: 12, name: "2 Kings", aliases: ["2ki", "2 kings", "2kings", "second kings"] },
  { id: 13, name: "1 Chronicles", aliases: ["1ch", "1 chronicles", "1chron", "first chronicles"] },
  { id: 14, name: "2 Chronicles", aliases: ["2ch", "2 chronicles", "2chron", "second chronicles"] },
  { id: 15, name: "Ezra", aliases: ["ezr", "ezra"] },
  { id: 16, name: "Nehemiah", aliases: ["neh", "nehemiah"] },
  { id: 17, name: "Esther", aliases: ["est", "esther"] },
  { id: 18, name: "Job", aliases: ["job"] },
  { id: 19, name: "Psalms", aliases: ["psa", "psalm", "psalms", "ps"] },
  { id: 20, name: "Proverbs", aliases: ["pro", "proverbs", "prov"] },
  { id: 21, name: "Ecclesiastes", aliases: ["ecc", "ecclesiastes"] },
  { id: 22, name: "Song of Solomon", aliases: ["son", "song of solomon", "song of songs", "sos"] },
  { id: 23, name: "Isaiah", aliases: ["isa", "isaiah"] },
  { id: 24, name: "Jeremiah", aliases: ["jer", "jeremiah"] },
  { id: 25, name: "Lamentations", aliases: ["lam", "lamentations"] },
  { id: 26, name: "Ezekiel", aliases: ["eze", "ezekiel", "ezek"] },
  { id: 27, name: "Daniel", aliases: ["dan", "daniel"] },
  { id: 28, name: "Hosea", aliases: ["hos", "hosea"] },
  { id: 29, name: "Joel", aliases: ["joe", "joel"] },
  { id: 30, name: "Amos", aliases: ["amo", "amos"] },
  { id: 31, name: "Obadiah", aliases: ["oba", "obadiah"] },
  { id: 32, name: "Jonah", aliases: ["jon", "jonah"] },
  { id: 33, name: "Micah", aliases: ["mic", "micah"] },
  { id: 34, name: "Nahum", aliases: ["nah", "nahum"] },
  { id: 35, name: "Habakkuk", aliases: ["hab", "habakkuk"] },
  { id: 36, name: "Zephaniah", aliases: ["zep", "zephaniah"] },
  { id: 37, name: "Haggai", aliases: ["hag", "haggai"] },
  { id: 38, name: "Zechariah", aliases: ["zec", "zechariah"] },
  { id: 39, name: "Malachi", aliases: ["mal", "malachi"] },
  { id: 40, name: "Matthew", aliases: ["mat", "matthew", "matt"] },
  { id: 41, name: "Mark", aliases: ["mar", "mark", "mk"] },
  { id: 42, name: "Luke", aliases: ["luk", "luke", "lk"] },
  { id: 43, name: "John", aliases: ["joh", "john", "jn"] },
  { id: 44, name: "Acts", aliases: ["act", "acts"] },
  { id: 45, name: "Romans", aliases: ["rom", "romans", "roms"] },
  { id: 46, name: "1 Corinthians", aliases: ["1co", "1 corinthians", "1cor", "first corinthians"] },
  {
    id: 47,
    name: "2 Corinthians",
    aliases: ["2co", "2 corinthians", "2cor", "second corinthians"],
  },
  { id: 48, name: "Galatians", aliases: ["gal", "galatians"] },
  { id: 49, name: "Ephesians", aliases: ["eph", "ephesians"] },
  { id: 50, name: "Philippians", aliases: ["phi", "philippians", "phil"] },
  { id: 51, name: "Colossians", aliases: ["col", "colossians"] },
  { id: 52, name: "1 Thessalonians", aliases: ["1th", "1 thessalonians", "1thess"] },
  { id: 53, name: "2 Thessalonians", aliases: ["2th", "2 thessalonians", "2thess"] },
  { id: 54, name: "1 Timothy", aliases: ["1ti", "1 timothy", "1tim"] },
  { id: 55, name: "2 Timothy", aliases: ["2ti", "2 timothy", "2tim"] },
  { id: 56, name: "Titus", aliases: ["tit", "titus"] },
  { id: 57, name: "Philemon", aliases: ["phm", "philemon"] },
  { id: 58, name: "Hebrews", aliases: ["heb", "hebrews"] },
  { id: 59, name: "James", aliases: ["jam", "james", "jas"] },
  { id: 60, name: "1 Peter", aliases: ["1pe", "1 peter", "1pet"] },
  { id: 61, name: "2 Peter", aliases: ["2pe", "2 peter", "2pet"] },
  { id: 62, name: "1 John", aliases: ["1jo", "1 john", "1jn"] },
  { id: 63, name: "2 John", aliases: ["2jo", "2 john", "2jn"] },
  { id: 64, name: "3 John", aliases: ["3jo", "3 john", "3jn"] },
  { id: 65, name: "Jude", aliases: ["jud", "jude"] },
  { id: 66, name: "Revelation", aliases: ["rev", "revelation", "revelations"] },
];

const BOOK_LOOKUP = new Map<string, { id: number; name: string }>();
for (const b of BOOKS) {
  for (const alias of [b.name, ...b.aliases]) {
    BOOK_LOOKUP.set(normalize(alias), { id: b.id, name: b.name });
  }
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,'"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSpokenNumber(text: string): number | null {
  const t = normalize(text);
  if (/^\d+$/.test(t)) return Number.parseInt(t, 10);
  const parts = t.split(/[\s-]+/);
  let total = 0;
  for (const p of parts) {
    if (p === "and") continue;
    const n = NUMBER_WORDS[p];
    if (n === undefined) return null;
    if (n === 100) total = (total || 1) * 100;
    else if (n >= 20) total += n;
    else total += n;
  }
  return total > 0 ? total : null;
}

function resolveBook(raw: string): { id: number; name: string } | null {
  const key = normalize(raw);
  return BOOK_LOOKUP.get(key) ?? null;
}

const EXPLICIT_PATTERNS = [
  /\b(\d?\s*(?:first|second|third|1st|2nd|3rd|\d)?\s*[a-z]+(?:\s+of\s+[a-z]+)?)\s+(\d{1,3})\s*[:.]\s*(\d{1,3})\b/gi,
  /\b(\d?\s*(?:first|second|third|1st|2nd|3rd|\d)?\s*[a-z]+(?:\s+of\s+[a-z]+)?)\s+(\d{1,3})\s+(\d{1,3})\b/gi,
  // Range formats (we just take the first verse)
  /\b(\d?\s*(?:first|second|third|1st|2nd|3rd|\d)?\s*[a-z]+(?:\s+of\s+[a-z]+)?)\s+(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\s*(?:-|to|through)\s*(?:\d{1,3}))\b/gi,
  /\b(\d?\s*(?:first|second|third|1st|2nd|3rd|\d)?\s*[a-z]+(?:\s+of\s+[a-z]+)?)\s+(\d{1,3})\s+(\d{1,3})(?:\s*(?:-|to|through)\s*(?:\d{1,3}))\b/gi,
];

const SPOKEN_PATTERNS = [
  /\b(?:turn\s+to|open\s+to|read\s+from|in|from)\s+([a-z0-9\s]+?)\s+chapter\s+([a-z0-9-]+)(?:\s+verse\s+([a-z0-9-]+))?/gi,
  /\b([a-z0-9\s]+?)\s+chapter\s+(\d+|[a-z-]+)\s+verse\s+(\d+|[a-z-]+)/gi,
];

const COMPACT_SPOKEN =
  /\b([a-z][a-z\s]*?)\s+([a-z0-9-]+)\s+([a-z0-9-]+)\b/gi;

const DIRECTIVE_SPOKEN =
  /\b(?:turn\s+to|go\s+to|open\s+to|read\s+from|look\s+at|in)\s+([a-z0-9\s]+?)\s+([a-z0-9-]+)\s+([a-z0-9-]+)\b/gi;

function tryRef(
  bookRaw: string,
  chapterRaw: string,
  verseRaw: string,
  confidence: number,
): ParsedVerseRef | null {
  const book = resolveBook(bookRaw);
  const chapter = Number.parseInt(chapterRaw, 10) || parseSpokenNumber(chapterRaw);
  const verse = Number.parseInt(verseRaw, 10) || parseSpokenNumber(verseRaw);
  if (!book || !chapter || !verse) return null;
  return buildRef(book, chapter, verse, confidence);
}

function firstMatch(
  text: string,
  pattern: RegExp,
  confidence: number,
  groups: { book: number; chapter: number; verse: number },
): ParsedVerseRef | null {
  pattern.lastIndex = 0;
  let match = pattern.exec(text);
  while (match !== null) {
    const ref = tryRef(match[groups.book], match[groups.chapter], match[groups.verse], confidence);
    if (ref) return ref;
    match = pattern.exec(text);
  }
  return null;
}

export function parseReferenceFromText(text: string): ParsedVerseRef | null {
  const normalized = normalize(text);
  if (!normalized) return null;

  for (const pattern of EXPLICIT_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(normalized);
    while (match !== null) {
      const ref = tryRef(match[1], match[2], match[3], 0.97);
      if (ref) return ref;
      match = pattern.exec(normalized);
    }
  }

  for (const pattern of SPOKEN_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(normalized);
    while (match !== null) {
      const chapter = parseSpokenNumber(match[2]);
      const verse = match[3] ? parseSpokenNumber(match[3]) : 1;
      const book = resolveBook(match[1]);
      if (book && chapter && verse) {
        return buildRef(book, chapter, verse, 0.9);
      }
      match = pattern.exec(normalized);
    }
  }

  const directive = firstMatch(normalized, DIRECTIVE_SPOKEN, 0.95, {
    book: 1,
    chapter: 2,
    verse: 3,
  });
  if (directive) return directive;

  const compact = firstMatch(normalized, COMPACT_SPOKEN, 0.92, {
    book: 1,
    chapter: 2,
    verse: 3,
  });
  if (compact) return compact;

  return null;
}

function buildRef(
  book: { id: number; name: string },
  chapter: number,
  verse: number,
  confidence: number,
): ParsedVerseRef {
  return {
    book: book.name,
    bookId: book.id,
    chapter,
    verse,
    reference: `${book.name} ${chapter}:${verse}`,
    confidence,
  };
}
