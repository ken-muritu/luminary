import { ensureBibleTranslation } from "@/db/client";
import {
  type BibleVerse,
  getChapterVerses,
  getTranslationId,
  getVerse,
  listChapters,
  searchBible,
} from "@/db/queries/bible";
import {
  ALL_BOOKS,
  BIBLE_TRANSLATIONS,
  BOOKS_NT,
  BOOKS_OT,
  type BibleTranslation,
} from "@/lib/constants";
import { parseReferenceFromText } from "@/lib/reference-parser";
import { useServiceStore } from "@/stores/serviceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCallback, useEffect, useState } from "react";

export default function Bible() {
  const defaultTranslation = useSettingsStore((s) => s.defaultTranslation);
  const { setProjection, projectCurrent, isLive } = useServiceStore();

  const [translation, setTranslation] = useState<BibleTranslation>(
    defaultTranslation as BibleTranslation,
  );

  useEffect(() => {
    setTranslation(defaultTranslation as BibleTranslation);
  }, [defaultTranslation]);

  useEffect(() => {
    void ensureBibleTranslation(translation);
  }, [translation]);
  const [selectedBook, setSelectedBook] = useState("John");
  const [chapter, setChapter] = useState(3);
  const [chapters, setChapters] = useState<number[]>([1, 2, 3]);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [reference, setReference] = useState("John 3:16");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);

  const bookNumber = (ALL_BOOKS as readonly string[]).indexOf(selectedBook) + 1;

  const loadChapter = useCallback(async () => {
    if (bookNumber < 1) return;
    try {
      const tid = await getTranslationId(translation);
      const chs = await listChapters(tid, bookNumber);
      setChapters(chs.length ? chs : [1]);
      const activeChapter = chs.includes(chapter) ? chapter : (chs[0] ?? 1);
      if (activeChapter !== chapter) setChapter(activeChapter);
      const rows = await getChapterVerses(tid, bookNumber, activeChapter);
      setVerses(rows);
    } catch {
      setVerses([]);
    }
  }, [translation, bookNumber, chapter]);

  useEffect(() => {
    void loadChapter();
    const timer = setInterval(() => void loadChapter(), 2000);
    return () => clearInterval(timer);
  }, [loadChapter]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const tid = await getTranslationId(translation);
        setSearchResults(await searchBible(tid, search));
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, translation]);

  async function jumpToReference() {
    const parsed = parseReferenceFromText(reference);
    if (!parsed) return;
    setSelectedBook(parsed.book);
    setChapter(parsed.chapter);
    try {
      const tid = await getTranslationId(translation);
      const verse = await getVerse(tid, parsed.bookId, parsed.chapter, parsed.verse);
      if (verse) sendToLive(verse);
    } catch {
      // not seeded yet
    }
  }

  function sendToLive(verse: BibleVerse) {
    const ref = `${verse.book_name ?? selectedBook} ${verse.chapter}:${verse.verse}`;
    setProjection(verse.text, ref);
    if (isLive) projectCurrent();
  }

  return (
    <div className="h-full grid grid-cols-[220px_1fr_280px]">
      <aside className="border-r border-[#2A2931] p-4 overflow-y-auto">
        <select
          value={translation}
          onChange={(e) => setTranslation(e.target.value as BibleTranslation)}
          className="w-full mb-4 rounded-lg bg-[#2A2931] px-3 py-2 text-sm"
        >
          {BIBLE_TRANSLATIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="text-[10px] uppercase tracking-widest text-[#8a8699] mb-2">Old Testament</p>
        {BOOKS_OT.map((book) => (
          <button
            key={book}
            type="button"
            onClick={() => {
              setSelectedBook(book);
              setChapter(1);
            }}
            className={`block w-full text-left px-2 py-1 rounded text-sm ${
              selectedBook === book ? "bg-[#6c5ce7]" : "hover:bg-[#2A2931]"
            }`}
          >
            {book}
          </button>
        ))}
        <p className="text-[10px] uppercase tracking-widest text-[#8a8699] mt-4 mb-2">
          New Testament
        </p>
        {BOOKS_NT.map((book) => (
          <button
            key={book}
            type="button"
            onClick={() => {
              setSelectedBook(book);
              setChapter(1);
            }}
            className={`block w-full text-left px-2 py-1 rounded text-sm ${
              selectedBook === book ? "bg-[#6c5ce7]" : "hover:bg-[#2A2931]"
            }`}
          >
            {book}
          </button>
        ))}
      </aside>

      <section className="p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <h2 className="text-xl font-semibold">{selectedBook}</h2>
          <select
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
            className="rounded-lg bg-[#2A2931] px-3 py-1 text-sm"
          >
            {chapters.map((c) => (
              <option key={c} value={c}>
                Chapter {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {verses.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => sendToLive(v)}
              className="w-full text-left rounded-xl bg-[#2A2931] hover:bg-[#3a3844] p-4 transition-colors"
            >
              <span className="text-[#6c5ce7] font-semibold mr-2">{v.verse}</span>
              <span className="text-sm leading-relaxed">{v.text}</span>
            </button>
          ))}
          {verses.length === 0 && (
            <p className="text-sm text-[#8a8699]">Loading Bible data… John 3:16 is available while the full text downloads.</p>
          )}
        </div>
      </section>

      <aside className="border-l border-[#2A2931] p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs text-[#8a8699] mb-1">Quick reference</p>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void jumpToReference()}
            className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm"
          />
          <button
            type="button"
            className="btn-primary mt-2 w-full"
            onClick={() => void jumpToReference()}
          >
            Go
          </button>
        </div>
        <div>
          <p className="text-xs text-[#8a8699] mb-1">Search</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Phrase search…"
            className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm"
          />
          <div className="mt-2 space-y-2">
            {searchResults.map((v) => (
              <button
                key={`${v.id}-${v.verse}`}
                type="button"
                onClick={() => sendToLive(v)}
                className="w-full text-left text-xs rounded-lg bg-[#2A2931] p-2 hover:bg-[#3a3844]"
              >
                <div className="text-[#6c5ce7]">
                  {v.book_name} {v.chapter}:{v.verse}
                </div>
                <div className="line-clamp-2 opacity-80">{v.text}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
