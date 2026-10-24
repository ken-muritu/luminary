import { create } from 'zustand'

export interface BibleVerse {
  id: number
  book: string
  chapter: number
  verse: number
  text: string
  translation: string
}

export interface Translation {
  id: number
  code: string
  name: string
  language: string
}

interface BibleState {
  translations: Translation[]
  activeTranslation: string
  searchQuery: string
  searchResults: BibleVerse[]
  currentVerse: BibleVerse | null
  compareVerse: BibleVerse | null
  viewMode: 'single' | 'parallel' | 'interlinear'
  history: BibleVerse[]
  bookmarks: BibleVerse[]
  isSearching: boolean
  setActiveTranslation: (code: string) => void
  setSearchQuery: (q: string) => void
  setSearchResults: (r: BibleVerse[]) => void
  setCurrentVerse: (v: BibleVerse | null) => void
  setCompareVerse: (v: BibleVerse | null) => void
  setViewMode: (m: 'single' | 'parallel' | 'interlinear') => void
  addToHistory: (v: BibleVerse) => void
  addBookmark: (v: BibleVerse) => void
  removeBookmark: (id: number) => void
  setIsSearching: (v: boolean) => void
}

const MOCK_TRANSLATIONS: Translation[] = [
  { id: 1, code: 'KJV', name: 'King James Version', language: 'en' },
  { id: 2, code: 'ASV', name: 'American Standard Version', language: 'en' },
  { id: 3, code: 'NIV', name: 'New International Version', language: 'en' },
  { id: 4, code: 'ESV', name: 'English Standard Version', language: 'en' },
  { id: 5, code: 'NASB', name: 'New American Standard Bible', language: 'en' },
  { id: 6, code: 'NKJV', name: 'New King James Version', language: 'en' },
]

export const useBibleStore = create<BibleState>((set) => ({
  translations: MOCK_TRANSLATIONS,
  activeTranslation: 'KJV',
  searchQuery: '',
  searchResults: [],
  currentVerse: null,
  compareVerse: null,
  viewMode: 'single',
  history: [],
  bookmarks: [],
  isSearching: false,

  setActiveTranslation: (code) => set({ activeTranslation: code }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),
  setCurrentVerse: (v) => set({ currentVerse: v }),
  setCompareVerse: (v) => set({ compareVerse: v }),
  setViewMode: (m) => set({ viewMode: m }),

  addToHistory: (v) =>
    set((s) => ({
      history: [v, ...s.history.filter((h) => h.id !== v.id)].slice(0, 20),
    })),

  addBookmark: (v) =>
    set((s) => ({
      bookmarks: s.bookmarks.find((b) => b.id === v.id)
        ? s.bookmarks
        : [v, ...s.bookmarks],
    })),

  removeBookmark: (id) =>
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

  setIsSearching: (v) => set({ isSearching: v }),
}))
