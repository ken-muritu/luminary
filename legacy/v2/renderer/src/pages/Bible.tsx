import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MonitorPlay, BookOpen, Bookmark, History, X, ChevronDown, Columns2 } from 'lucide-react'
import { useServiceStore } from '../store/serviceStore'
import { cn } from '../lib/utils'

interface BibleVerse {
  id: number
  book_id: number
  book_name: string
  chapter: number
  verse: number
  text: string
  translation: string
}

interface BibleBook {
  id: number
  name: string
  short_name: string
  testament: 'old' | 'new'
  position: number
}

interface Translation {
  id: number
  code: string
  name: string
  language: string
}

const CHAPTER_COUNTS: Record<string, number> = {
  Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,Ruth:4,
  '1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,'1 Chronicles':29,'2 Chronicles':36,
  Ezra:10,Nehemiah:13,Esther:10,Job:42,Psalms:150,Proverbs:31,Ecclesiastes:12,
  'Song of Solomon':8,Isaiah:66,Jeremiah:52,Lamentations:5,Ezekiel:48,Daniel:12,
  Hosea:14,Joel:3,Amos:9,Obadiah:1,Jonah:4,Micah:7,Nahum:3,Habakkuk:3,
  Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4,
  Matthew:28,Mark:16,Luke:24,John:21,Acts:28,Romans:16,'1 Corinthians':16,'2 Corinthians':13,
  Galatians:6,Ephesians:6,Philippians:4,Colossians:4,'1 Thessalonians':5,'2 Thessalonians':3,
  '1 Timothy':6,'2 Timothy':4,Titus:3,Philemon:1,Hebrews:13,James:5,'1 Peter':5,'2 Peter':3,
  '1 John':5,'2 John':1,'3 John':1,Jude:1,Revelation:22,
}

export default function Bible() {
  const [books, setBooks] = useState<BibleBook[]>([])
  const [translations, setTranslations] = useState<Translation[]>([])
  const [activeTranslation, setActiveTranslation] = useState('KJV')
  const [activeTab, setActiveTab] = useState<'old' | 'new'>('new')
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null)
  const [selectedChapter, setSelectedChapter] = useState(3)
  const [chapterVerses, setChapterVerses] = useState<BibleVerse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ reference: string; text: string; translation: string }[]>([])
  const [viewMode, setViewMode] = useState<'single' | 'parallel'>('parallel')
  const [isSearching, setIsSearching] = useState(false)
  const [history, setHistory] = useState<BibleVerse[]>([])
  const [bookmarks, setBookmarks] = useState<BibleVerse[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isLive, goLive, setProjectionText } = useServiceStore()

  // Load books and translations on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.luminary) return
    window.luminary.bible.getBooks().then(setBooks)
    window.luminary.bible.getTranslations().then(setTranslations)
  }, [])

  // Load chapter verses when selection changes
  useEffect(() => {
    if (!selectedBook || !window.luminary) return
    window.luminary.bible.getChapter({
      translation: activeTranslation,
      bookId: selectedBook.id,
      chapter: selectedChapter
    }).then((verses) => {
      setChapterVerses(verses as BibleVerse[])
    })
  }, [selectedBook, selectedChapter, activeTranslation])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    searchTimer.current = setTimeout(() => {
      if (window.luminary) {
        window.luminary.bible.search({
          query,
          translation: activeTranslation,
          limit: 50
        }).then(({ results }) => {
          setSearchResults(results)
        })
      }
    }, 300)
  }, [activeTranslation])

  // Send verse to live projection
  const handleSendToLive = useCallback((verse: BibleVerse) => {
    const ref = `${verse.book_name} ${verse.chapter}:${verse.verse}`
    setProjectionText(verse.text, ref)
    if (window.luminary && isLive) {
      window.luminary.output.setSlide({
        type: 'verse',
        text: verse.text,
        subtext: ref,
        reference: ref
      })
    }
    // Add to history
    setHistory((prev) => [verse, ...prev].slice(0, 20))
  }, [setProjectionText, isLive])

  async function loadBooks() {
    try {
      const data = await window.luminary.bible.getBooks()
      setBooks(data as BibleBook[])
      // Set default book to John
      const john = (data as BibleBook[]).find(b => b.name === 'John')
      if (john) setSelectedBook(john)
    } catch (e) {
      console.error('Failed to load books:', e)
    }
  }

  async function loadTranslations() {
    try {
      const data = await window.luminary.bible.getTranslations()
      setTranslations(data as Translation[])
    } catch (e) {
      console.error('Failed to load translations:', e)
    }
  }

  async function loadChapter() {
    if (!selectedBook) return
    try {
      const data = await window.luminary.bible.getChapter({
        translation: activeTranslation,
        bookId: selectedBook.id,
        chapter: selectedChapter,
      })
      setChapterVerses(data as BibleVerse[])
    } catch (e) {
      console.error('Failed to load chapter:', e)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const result = await window.luminary.bible.search({
          query: searchQuery,
          translation: activeTranslation,
          limit: 20,
        })
        setSearchResults(result.results || [])
      } catch (e) {
        console.error('Search failed:', e)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [searchQuery, activeTranslation])

  const handleProjectVerse = async (verse: BibleVerse) => {
    const ref = `${verse.book_name} ${verse.chapter}:${verse.verse} (${verse.translation})`
    setProjectionText(verse.text, ref)
    addToHistory(verse)
    if (!isLive) {
      goLive()
      await window.luminary?.output.goLive()
    }
    await window.luminary?.output.setSlide({
      type: 'verse',
      text: verse.text,
      reference: ref,
      subtext: ref,
    })
  }

  const addToHistory = (verse: BibleVerse) => {
    setHistory(prev => [verse, ...prev.slice(0, 49)])
  }

  const toggleBookmark = (verse: BibleVerse) => {
    const exists = bookmarks.find(b => b.id === verse.id)
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== verse.id))
    } else {
      setBookmarks(prev => [...prev, verse])
    }
  }

  const filteredBooks = books.filter(b => b.testament === activeTab)

  const maxChapters = selectedBook ? CHAPTER_COUNTS[selectedBook.name] || 21 : 21

  return (
    <div className="h-full flex bg-[#13131a] overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Controls Row */}
        <section className="px-6 py-4 border-b border-[#1B1B22] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-1">
                  {selectedBook ? `${selectedBook.name} ${selectedChapter}` : 'Bible'}
                </h1>
                <p className="text-[#C8C4D7] font-label text-xs uppercase tracking-widest">
                  {viewMode === 'parallel' ? 'Scripture Comparison Mode' : 'Single Translation View'}
                </p>
              </div>
              <div className="flex items-center gap-3 bg-[#1F1F26] p-1.5 rounded-full">
                <button
                  onClick={() => setViewMode('parallel')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
                    viewMode === 'parallel'
                      ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20'
                      : 'text-[#C8C4D7] hover:text-white'
                  )}
                >
                  Parallel
                </button>
                <button
                  onClick={() => setViewMode('single')}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-bold transition-all',
                    viewMode === 'single'
                      ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20'
                      : 'text-[#C8C4D7] hover:text-white'
                  )}
                >
                  Single
                </button>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-4 bg-[#1F1F26] p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C8C4D7]">Translation</span>
              <select
                value={activeTranslation}
                onChange={(e) => setActiveTranslation(e.target.value)}
                className="bg-[#13131a] border border-[#474554] rounded-lg px-3 py-1.5 text-xs text-white"
              >
                {translations.map((t) => (
                  <option key={t.code} value={t.code}>{t.code} - {t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C8C4D7]">Search</span>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#928ea0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search verses..."
                  className="bg-[#13131a] border border-[#474554] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white w-40"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Scripture Main Area */}
        <section className="flex-1 overflow-y-auto p-6">
          {isSearching ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-[#C8C4D7]">Searching...</div>
            </div>
          ) : searchQuery.trim() && searchResults.length > 0 ? (
            <div className="max-w-4xl mx-auto space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">Search Results</h2>
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={async () => {
                    // Parse reference and navigate
                    const parsed = await window.luminary?.bible.parseReference({ reference: result.reference, translation: activeTranslation })
                    if (parsed && parsed.success) {
                      const book = books.find(b => b.name === parsed.book)
                      if (book && parsed.chapter) {
                        setSelectedBook(book)
                        setSelectedChapter(parsed.chapter)
                      }
                    }
                  }}
                  className="w-full text-left p-4 bg-[#1F1F26] rounded-xl hover:bg-[#2A2931] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#c6bfff] font-bold">{result.reference}</span>
                    <span className="text-xs text-[#928ea0]">{result.translation}</span>
                  </div>
                  <p className="text-[#e4e1ec] text-sm leading-relaxed">{result.text}</p>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#928ea0]">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : chapterVerses.length > 0 ? (
            viewMode === 'parallel' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#2A2931] rounded-xl overflow-hidden shadow-2xl">
                {/* Primary Translation Column */}
                <div className="bg-[#1F1F26] p-6 min-h-[500px]">
                  <div className="flex items-center justify-between pb-4 border-b border-[#474554]/30 mb-6">
                    <span className="font-black text-lg text-[#c6bfff]">{activeTranslation}</span>
                    <span className="text-[10px] font-bold text-[#928ea0] uppercase tracking-widest">
                      {translations.find(t => t.code === activeTranslation)?.name}
                    </span>
                  </div>
                  <div className="space-y-6 font-body leading-relaxed text-[#e4e1ec]">
                    {chapterVerses.map((v) => (
                      <div key={v.id} className="group flex items-start gap-3 hover:bg-[#2A2931] p-2 rounded-lg cursor-pointer"
                        onClick={() => handleProjectVerse(v)}>
                        <sup className="text-[#6c5ce7] font-bold text-xs mt-1">{v.verse}</sup>
                        <p className="text-sm">{v.text}</p>
                        <MonitorPlay className="w-4 h-4 text-[#928ea0] opacity-0 group-hover:opacity-100 ml-auto shrink-0 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Secondary Translation Column (KJV) */}
                <div className="bg-[#1B1B22] p-6 min-h-[500px]">
                  <div className="flex items-center justify-between pb-4 border-b border-[#474554]/30 mb-6">
                    <span className="font-black text-lg text-[#f0bf63]">KJV</span>
                    <span className="text-[10px] font-bold text-[#928ea0] uppercase tracking-widest">King James Version</span>
                  </div>
                  <div className="space-y-6 font-body leading-relaxed text-[#e4e1ec]/90 italic">
                    {chapterVerses.map((v) => (
                      <div key={`kjv-${v.verse}`} className="flex items-start gap-3">
                        <sup className="text-[#f0bf63] font-bold text-xs mt-1">{v.verse}</sup>
                        <p className="text-sm">{v.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto bg-[#1F1F26] p-8 rounded-xl">
                <div className="flex items-center justify-between pb-4 border-b border-[#474554]/30 mb-6">
                  <span className="font-black text-lg text-[#c6bfff]">{activeTranslation}</span>
                </div>
                <div className="space-y-6 font-body leading-relaxed text-[#e4e1ec]">
                  {chapterVerses.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleProjectVerse(v)}
                      className="w-full text-left group flex items-start gap-3 p-3 rounded-lg hover:bg-[#2A2931] transition-colors"
                    >
                      <sup className="text-[#6c5ce7] font-bold text-xs mt-1">{v.verse}</sup>
                      <p className="text-sm flex-1">{v.text}</p>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 shrink-0">
                        <MonitorPlay className="w-4 h-4 text-[#928ea0]" />
                        <Bookmark className="w-4 h-4 text-[#928ea0] hover:text-[#f0bf63]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#928ea0]">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a book and chapter to view scripture</p>
            </div>
          )}
        </section>

        {/* Navigator Grid */}
        {!searchQuery.trim() && (
          <section className="bg-[#1F1F26] rounded-t-2xl p-6 border-t border-[#2A2931]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">The Navigator</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('old')}
                  className={cn(
                    'text-xs font-bold uppercase tracking-widest transition-colors',
                    activeTab === 'old' ? 'text-[#c6bfff]' : 'text-[#928ea0] hover:text-white'
                  )}
                >
                  Old Testament
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className={cn(
                    'text-xs font-bold uppercase tracking-widest transition-colors',
                    activeTab === 'new' ? 'text-[#c6bfff]' : 'text-[#928ea0] hover:text-white'
                  )}
                >
                  New Testament
                </button>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2 mb-6">
              {filteredBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => { setSelectedBook(book); setSelectedChapter(1) }}
                  className={cn(
                    'h-10 flex items-center justify-center rounded-lg text-xs font-bold transition-all',
                    selectedBook?.id === book.id
                      ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/20'
                      : 'bg-[#2A2931] text-[#C8C4D7] hover:bg-[#6c5ce7]/30 hover:text-white'
                  )}
                >
                  {book.short_name}
                </button>
              ))}
            </div>

            {/* Chapter Quick Pick */}
            {selectedBook && (
              <div className="pt-4 border-t border-[#474554]/20">
                <span className="w-full text-[10px] font-bold text-[#928ea0] uppercase tracking-[0.2em] mb-3 block">
                  Chapters: {selectedBook.name}
                </span>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: maxChapters }, (_, i) => i + 1).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setSelectedChapter(ch)}
                      className={cn(
                        'w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all',
                        selectedChapter === ch
                          ? 'bg-[#6c5ce7] text-white shadow-lg shadow-[#6c5ce7]/40 scale-110'
                          : 'hover:bg-[#2A2931] text-[#C8C4D7]'
                      )}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Right Sidebar - History & Bookmarks */}
      <aside className="w-72 bg-[#1B1B22] border-l border-[#2A2931] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2A2931]">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent & Saved</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#928ea0] mb-2 flex items-center gap-2">
                <History className="w-3 h-3" /> Recent
              </div>
              <div className="space-y-1">
                {history.slice(0, 8).map((v, idx) => (
                  <button
                    key={`hist-${v.id}-${idx}`}
                    onClick={() => handleProjectVerse(v)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2A2931] transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#C8C4D7] group-hover:text-white">
                        {v.book_name} {v.chapter}:{v.verse}
                      </span>
                      <MonitorPlay className="w-3 h-3 text-[#928ea0] opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="text-[10px] text-[#928ea0] mt-0.5 line-clamp-1">{v.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bookmarks */}
          {bookmarks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#928ea0] mb-2 flex items-center gap-2">
                <Bookmark className="w-3 h-3" /> Bookmarks
              </div>
              <div className="space-y-1">
                {bookmarks.map((v) => (
                  <button
                    key={`bm-${v.id}`}
                    onClick={() => handleProjectVerse(v)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2A2931] transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#f0bf63] group-hover:text-white">
                        {v.book_name} {v.chapter}:{v.verse}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <MonitorPlay className="w-3 h-3 text-[#928ea0]" />
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(v) }}
                          className="w-3 h-3 text-[#928ea0] hover:text-[#ffb4ab]"
                        >
                          <X className="w-full h-full" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#928ea0] mt-0.5 line-clamp-1">{v.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.length === 0 && bookmarks.length === 0 && (
            <div className="flex flex-col items-center py-8 text-[#928ea0] text-xs gap-2">
              <BookOpen className="w-8 h-8 opacity-20" />
              <p>Click a verse to project it</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
