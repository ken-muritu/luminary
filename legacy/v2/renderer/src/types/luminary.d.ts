export interface SongSection {
  id?:       number
  type:      'verse' | 'chorus' | 'bridge' | 'pre_chorus' | 'tag' | 'outro' | 'instrumental'
  label:     string
  lyrics:    string
  position:  number
}

export interface Song {
  id:          number
  title:       string
  artist:      string
  album:       string
  keySig:      string
  bpm:         number | null
  ccliNumber:  string
  copyright:   string
  year:        number | null
  licenseType: 'public_domain' | 'ccli' | 'custom'
  createdAt:   string
  updatedAt:   string
  sections:    SongSection[]
}

export interface SetlistItem {
  id:          number
  setlistId:   number
  type:        'song' | 'verse' | 'media' | 'timer' | 'announcement' | 'blank'
  title:       string
  subtitle:    string
  songId:      number | null
  verseRef:    string | null
  translation: string | null
  mediaPath:   string | null
  durationS:   number | null
  position:    number
}

export interface Setlist {
  id:          number
  name:        string
  serviceDate: string | null
  isTemplate:  boolean
  notes:       string
  createdAt:   string
  updatedAt:   string
  items:       SetlistItem[]
}

export interface BibleVerse {
  id:          number
  book_id:     number
  book_name:   string
  chapter:     number
  verse:       number
  text:        string
  translation: string
}

export interface MediaAsset {
  id:         number
  filePath:   string
  fileName:   string
  category:   'backgrounds' | 'announcements' | 'countdowns' | 'video_loops'
  mimeType:   string
  width:      number | null
  height:     number | null
  fileSize:   number | null
  tags:       string
  thumbnail:  string | null
  importedAt: string
}

export interface VerseMatch {
  reference:  string
  book:       string
  bookId?:    number
  chapter:    number
  verse:      number
  confidence: number
  rawText?:   string
  text?:      string
  translation?: string
}

export interface SlidePayload {
  type:        'song' | 'verse' | 'media' | 'blank' | 'logo'
  text?:       string
  subtext?:    string
  reference?:  string
  mediaPath?:  string
  songId?:     number
  songTitle?:  string
  ccliNumber?: string
}

export interface AppSettings {
  isOnboarded:          boolean
  defaultTranslation:   string
  showVerseNumbers:     boolean
  fontFamily:           string
  baseFontSize:         number
  fontWeight:           string
  shadowDepth:          number
  glowDepth:            number
  autoBackup:           boolean
  cloudSync:            boolean
  reducedMotion:        boolean
  largeFontMode:        boolean
  licenseTier:          'community' | 'standard' | 'pro'
  licenseKey:           string
  language:             string
  audioInputDevice:     string
  aiMode:               string
  aiModel:              string
  aiSensitivity:        string
  aiConfidenceThreshold: number
}

export interface UsageLogRow {
  id:           number
  song_id:      number | null
  song_title:   string
  ccli_number:  string | null
  service_date: string
  logged_at:    string
}

export interface TopSongRow {
  song_title:     string
  ccli_number:    string | null
  song_id:        number | null
  count:          number
  last_projected: string
}

export interface MonthlyCount {
  month: string
  count: number
}

export interface ReportSummary {
  total:       number
  unique:      number
  missingCcli: number
}

export interface LuminaryAPI {
  songs: {
    getAll:   ()                   => Promise<Song[]>
    getById:  (id: number)         => Promise<Song | null>
    create:   (data: Partial<Song> & { title: string }) => Promise<Song>
    update:   (data: Partial<Song> & { id: number })    => Promise<Song>
    delete:   (id: number)         => Promise<{ success: boolean; id: number }>
    search:   (query: string)      => Promise<Song[]>
  }
  setlists: {
    getAll:       ()                                                           => Promise<Setlist[]>
    getById:      (id: number)                                                 => Promise<Setlist | null>
    create:       (data: Partial<Setlist> & { name: string })                  => Promise<Setlist>
    update:       (data: Partial<Setlist> & { id: number })                    => Promise<Setlist>
    delete:       (id: number)                                                 => Promise<{ success: boolean; id: number }>
    addItem:      (data: Partial<SetlistItem> & { setlist_id: number; type: SetlistItem['type']; title: string }) => Promise<SetlistItem>
    removeItem:   (id: number)                                                 => Promise<{ success: boolean; id: number }>
    reorderItems: (items: { id: number; position: number }[])                  => Promise<{ success: boolean }>
  }
  bible: {
    search:          (payload: { query: string; translation?: string; limit?: number }) => Promise<{ results: { reference: string; text: string; translation: string; rank: number }[] }>
    getVerse:        (payload: { translation: string; bookId: number; chapter: number; verse: number }) => Promise<BibleVerse | null>
    getRange:        (payload: { translation: string; bookId: number; chapter: number; startVerse: number; endVerse: number }) => Promise<BibleVerse[]>
    getChapter:      (payload: { translation: string; bookId: number; chapter: number }) => Promise<BibleVerse[]>
    getBooks:        () => Promise<{ id: number; name: string; short_name: string; testament: 'old' | 'new'; position: number }[]>
    getTranslations: () => Promise<{ id: number; code: string; name: string; language: string }[]>
    parseReference:  (payload: { reference: string; translation?: string }) => Promise<{ success: boolean; book?: string; chapter?: number; verses?: BibleVerse[]; formatted?: string; error?: string }>
  }
  media: {
    list:   ()                     => Promise<{ items: MediaAsset[] }>
    import: ()                     => Promise<{ success: boolean; cancelled?: boolean; items?: MediaAsset[] }>
    delete: (id: number)           => Promise<{ success: boolean; id: number }>
  }
  settings: {
    getAll:  ()                                       => Promise<AppSettings>
    get:     (key: keyof AppSettings)                 => Promise<AppSettings[keyof AppSettings]>
    set:     (key: keyof AppSettings, value: unknown) => Promise<{ success: boolean }>
    setBulk: (data: Partial<AppSettings>)             => Promise<{ success: boolean }>
  }
  reports: {
    getUsageLog:     (params?: { days?: number })                                                         => Promise<{ rows: UsageLogRow[] }>
    logSongUsage:    (data: { song_id?: number; song_title: string; ccli_number?: string; service_date?: string }) => Promise<{ success: boolean; id: number }>
    getTopSongs:     (params?: { days?: number; limit?: number })                                        => Promise<{ rows: TopSongRow[] }>
    getMonthlyTotals:(params?: { months?: number })                                                     => Promise<{ rows: MonthlyCount[] }>
    getSummary:      (params?: { days?: number })                                                       => Promise<ReportSummary>
    exportCCLI:      (params?: { days?: number })                                                       => Promise<{ csv: string; count: number }>
  }
  license: {
    validate:  (key: string) => Promise<{ valid: boolean; tier: string; reason?: string }>
    getStatus: ()            => Promise<{ tier: string; key: string; valid: boolean }>
  }
  output: {
    goLive:      ()                      => Promise<void>
    endLive:     ()                      => Promise<void>
    setSlide:    (data: SlidePayload)    => Promise<void>
    setBlank:    (on: boolean)           => Promise<void>
    setLogo:     (on: boolean)           => Promise<void>
    setFreeze:   (on: boolean)           => Promise<void>
    getDisplays: ()                      => Promise<Electron.Display[]>
    mapDisplay:  (data: unknown)         => Promise<{ success: boolean }>
    updateConfig: (cfg: unknown)         => Promise<{ success: boolean }>
  }
  ai: {
    startListening: ()            => Promise<{ success: boolean }>
    stopListening:  ()            => Promise<{ success: boolean }>
    setMode:        (m: string)   => Promise<{ success: boolean }>
    setModel:       (m: string)   => Promise<{ success: boolean }>
    calibrate:      ()            => Promise<{ success: boolean; noiseFloor: number }>
    submitTranscript: (text: string, isFinal?: boolean) => Promise<{ success: boolean }>
  }
  stage: {
    open:       () => Promise<{ success: boolean }>
    close:      () => Promise<{ success: boolean }>
    setContent: (data: { current?: string; next?: string; reference?: string }) => Promise<{ success: boolean }>
  }
  backup: {
    create:  () => Promise<{ success: boolean; path?: string; timestamp?: string; size?: number; error?: string }>
    list:    () => Promise<{ success: boolean; backups?: { name: string; path: string; size: number; created: string }[]; error?: string }>
    restore: (path: string) => Promise<{ success: boolean; message?: string; error?: string }>
    export:  () => Promise<{ success: boolean; cancelled?: boolean; path?: string; size?: number; error?: string }>
    import:  () => Promise<{ success: boolean; cancelled?: boolean; message?: string; error?: string }>
    auto:    () => Promise<{ success: boolean; path?: string; error?: string }>
  }
  app: {
    getVersion: () => Promise<string>
  }
  on: {
    verseDetected:          (cb: (data: VerseMatch) => void)    => () => void
    aiStatus:               (cb: (data: unknown) => void)       => () => void
    displayChanged:         (cb: (data: unknown) => void)       => () => void
    systemAlert:            (cb: (data: unknown) => void)       => () => void
    outputPreview:          (cb: (data: SlidePayload) => void)  => () => void
    shortcutNextSection:    (cb: () => void)                    => () => void
    shortcutPrevSection:    (cb: () => void)                    => () => void
    shortcutNextItem:       (cb: () => void)                    => () => void
    shortcutPrevItem:       (cb: () => void)                    => () => void
    shortcutToggleBlackout: (cb: () => void)                    => () => void
    shortcutToggleFreeze:   (cb: () => void)                    => () => void
    shortcutToggleLogo:     (cb: () => void)                    => () => void
    shortcutGoLive:         (cb: () => void)                    => () => void
    shortcutClear:          (cb: () => void)                    => () => void
  }
}

declare global {
  interface Window {
    luminary: LuminaryAPI
  }
}
