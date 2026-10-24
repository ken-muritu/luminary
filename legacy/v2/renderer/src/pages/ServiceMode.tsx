import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, ChevronRight, ChevronLeft, EyeOff, X, Check,
  Mic2, MonitorPlay, Volume2, Layers
} from 'lucide-react'
import { useServiceStore, type VerseDetectedEvent } from '../store/serviceStore'
import { useAIStore } from '../store/aiStore'
import ProjectionPreview from '../components/ProjectionPreview'
import { cn } from '../lib/utils'
import { useAISpeech } from '../hooks/useAISpeech'
import type { Setlist, SetlistItem, Song, VerseMatch } from '../types/luminary'

const FALLBACK_SECTIONS = [{ label: 'Intro' }, { label: 'Verse 1' }, { label: 'Chorus' }]

function CueCard({ cue, onConfirm, onDismiss }: {
  cue: VerseDetectedEvent
  onConfirm: () => void
  onDismiss: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(6)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { onDismiss(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onDismiss])

  return (
    <div className={cn(
      'relative rounded-xl p-3 border animate-slide-up',
      cue.confidence >= 0.85 ? 'bg-secondary/10 border-secondary/30' : 'bg-tertiary/10 border-tertiary/40'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'text-xs font-bold uppercase tracking-wider',
              cue.confidence >= 0.85 ? 'text-secondary' : 'text-tertiary'
            )}>
              {cue.confidence >= 0.85 ? 'AI Detected' : 'Unconfirmed'}
            </span>
            <span className="text-[10px] text-text-secondary">{Math.round(cue.confidence * 100)}%</span>
          </div>
          <p className="text-sm font-bold text-white truncate">{cue.reference}</p>
          {cue.text && (
            <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">{cue.text}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onConfirm}
            className="w-7 h-7 rounded-lg bg-secondary/20 hover:bg-secondary/30 flex items-center justify-center text-secondary transition-colors"
            title="Confirm (Enter)"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg bg-surface-high hover:bg-surface-bright flex items-center justify-center text-text-secondary transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 h-0.5 bg-surface-bright rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', cue.confidence >= 0.85 ? 'bg-secondary' : 'bg-tertiary')}
          style={{ width: `${(timeLeft / 6) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function ServiceMode() {
  const [activeSection, setActiveSection] = useState(0)
  const [activeSetlistItem, setActiveSetlistItem] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [activeSong, setActiveSong] = useState<Song | null>(null)

  const {
    isLive, isBlackout, cueQueue,
    goLive, stopLive, blackout, clearBlackout,
    confirmCue, dismissCue, setProjectionText, setCurrentItem,
    aiActive,
  } = useServiceStore()

  const { isListening, audioLevel, setIsListening } = useAIStore()

  useAISpeech(useCallback((match: VerseMatch) => {
    const cue: VerseDetectedEvent = {
      id: `cue-${Date.now()}`,
      book: match.book,
      chapter: match.chapter,
      verse: match.verse,
      confidence: match.confidence,
      rawText: match.rawText ?? match.reference,
      reference: match.reference,
      text: match.text,
      detectedAt: Date.now(),
    }
    useServiceStore.getState().addCue(cue)
  }, []))

  const currentItem = useMemo(
    () => activeSetlist?.items?.find((i) => String(i.id) === activeSetlistItem) ?? null,
    [activeSetlist, activeSetlistItem]
  )

  const sections = useMemo(() => {
    if (activeSong?.sections?.length) {
      return activeSong.sections.map((s) => ({ label: s.label }))
    }
    if (currentItem?.type === 'verse') {
      return [{ label: currentItem.title }]
    }
    return FALLBACK_SECTIONS
  }, [activeSong, currentItem])

  // Load real data on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !window.luminary) return
    window.luminary.setlists.getAll().then((lists) => {
      setSetlists(lists)
      if (!lists.length) return
      const today = new Date().toISOString().split('T')[0]
      const pick = lists.find((l) => l.serviceDate === today) ?? lists[0]
      setActiveSetlist(pick)
      if (pick.items?.[0]) setActiveSetlistItem(String(pick.items[0].id))
    })
    window.luminary.songs.getAll().then(setSongs)
  }, [])

  // Load song sections when setlist item changes
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'song' || !currentItem.songId) {
      setActiveSong(null)
      return
    }
    if (typeof window === 'undefined' || !window.luminary) return
    window.luminary.songs.getById(currentItem.songId).then(setActiveSong).catch(() => setActiveSong(null))
  }, [currentItem])

  const handleSetlistItemClick = useCallback(async (item: SetlistItem) => {
    setActiveSetlistItem(String(item.id))
    setActiveSection(0)
    setCurrentItem({ id: String(item.id), type: item.type, title: item.title, subtitle: item.subtitle })

    if (typeof window === 'undefined' || !window.luminary) return

    if (item.type === 'verse' && (item.verseRef || item.title)) {
      const ref = item.verseRef ?? item.title
      const parsed = await window.luminary.bible.parseReference({
        reference: ref,
        translation: item.translation ?? 'KJV',
      })
      if (!parsed.success) return
      const verse = parsed.verses?.[0]
      if (verse?.text) {
        setProjectionText(verse.text, ref)
        if (useServiceStore.getState().isLive) {
          window.luminary.output.setSlide({ type: 'verse', text: verse.text, reference: ref })
        }
      }
    }
  }, [setCurrentItem, setProjectionText])

  // Keyboard shortcuts from main process
  useEffect(() => {
    if (typeof window === 'undefined' || !window.luminary) return
    const unsubs = [
      window.luminary.on.shortcutNextSection(() => {
        setActiveSection((s) => Math.min(sections.length - 1, s + 1))
      }),
      window.luminary.on.shortcutPrevSection(() => setActiveSection((s) => Math.max(0, s - 1))),
      window.luminary.on.shortcutToggleBlackout(() => {
        const { isBlackout, blackout, clearBlackout } = useServiceStore.getState()
        if (isBlackout) clearBlackout(); else blackout()
        if (window.luminary) window.luminary.output.setBlank(!isBlackout)
      }),
      window.luminary.on.shortcutGoLive(() => {
        useServiceStore.getState().goLive()
        if (window.luminary) window.luminary.output.goLive()
      }),
      window.luminary.on.shortcutClear(() => {
        useServiceStore.getState().setProjectionText('')
        if (window.luminary) window.luminary.output.setSlide({ type: 'blank' })
      }),
      window.luminary.on.shortcutToggleLogo(() => {
        if (window.luminary) window.luminary.output.setLogo(true)
      }),
      window.luminary.on.shortcutToggleFreeze(() => {
        if (window.luminary) window.luminary.output.setFreeze(true)
      }),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [sections.length])

  const handleSectionClick = useCallback((idx: number, label: string, song: Song | null) => {
    setActiveSection(idx)
    if (!song) return
    const section = song.sections?.[idx]
    const text = section?.lyrics?.trim() || `${song.title} — ${label}`
    setProjectionText(text, song.title)
    if (window.luminary) {
      void window.luminary.output.setSlide({ type: 'song', text, subtext: song.title, songId: song.id })
      if (isLive && song.ccliNumber) {
        void window.luminary.reports.logSongUsage({
          song_id: song.id,
          song_title: song.title,
          ccli_number: song.ccliNumber,
          service_date: new Date().toISOString().split('T')[0],
        })
      }
    }
  }, [setProjectionText, isLive])

  return (
    <div className="flex h-full bg-surface">
      {/* Left Control Panel */}
      <div className="w-[420px] shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-low">
        {/* Search */}
        <div className="p-4 border-b border-outline-variant/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search verse or song… (e.g. John 3:16)"
              className="input pl-9 pr-3"
            />
          </div>
        </div>

        {/* Active Song / Content Block */}
        <div className="flex-1 overflow-y-auto">
          {/* Current item header */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="section-label">Now Active</span>
              {isLive && <span className="live-indicator text-[10px]"><span className="live-dot" />On Screen</span>}
            </div>
            <h3 className="text-sm font-bold text-white">
              {currentItem?.title ?? 'No item selected'}
            </h3>
            <p className="text-xs text-text-secondary">
              {activeSong
                ? `${activeSong.keySig || '—'} · ${activeSong.bpm ?? '—'} BPM`
                : currentItem?.subtitle ?? 'Select an item from the service order'}
            </p>
          </div>

          {/* Song sections */}
          <div className="px-4 space-y-1 pb-4">
            {sections.map((section, idx) => (
              <button
                key={`${section.label}-${idx}`}
                onClick={() => handleSectionClick(idx, section.label, activeSong)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  activeSection === idx
                    ? 'bg-primary/20 text-white border border-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-high'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{section.label}</span>
                  {activeSection === idx && (
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider">Projected</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Setlist quick nav */}
          <div className="px-4 pb-4">
            <div className="section-label mb-3">Service Order</div>
            <div className="space-y-1">
              {(activeSetlist?.items ?? []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSetlistItemClick(item)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all duration-150',
                    activeSetlistItem === String(item.id)
                      ? 'bg-surface-high'
                      : 'hover:bg-surface-container'
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    item.type === 'song' ? 'bg-primary' :
                    item.type === 'verse' ? 'bg-secondary' :
                    'bg-tertiary'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-on-surface-variant truncate">{item.title}</div>
                    {item.subtitle && <div className="text-[10px] text-text-secondary truncate">{item.subtitle}</div>}
                  </div>
                  {item.type === 'song' && item.songId && (
                    <span className="text-[10px] text-text-secondary font-mono">
                      {songs.find((s) => s.id === item.songId)?.keySig ?? ''}
                    </span>
                  )}
                </button>
              ))}
              {!activeSetlist?.items?.length && (
                <p className="text-xs text-text-secondary px-3 py-2">No setlist items — add one in Setlists</p>
              )}
            </div>
          </div>

          {/* AI Cue Queue */}
          {cueQueue.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="section-label">AI Cue Queue</span>
                <span className="w-4 h-4 rounded-full bg-tertiary text-surface text-[9px] font-bold flex items-center justify-center">
                  {cueQueue.length}
                </span>
              </div>
              <div className="space-y-2">
                {cueQueue.map((cue) => (
                  <CueCard
                    key={cue.id}
                    cue={cue}
                    onConfirm={() => confirmCue(cue)}
                    onDismiss={() => dismissCue(cue.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section navigation */}
        <div className="p-3 border-t border-outline-variant/10 flex items-center gap-2">
          <button
            onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
            className="w-9 h-9 rounded-lg bg-surface-high hover:bg-surface-bright flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveSection((s) => Math.min(sections.length - 1, s + 1))}
            className="flex-1 h-9 rounded-lg bg-surface-high hover:bg-surface-bright flex items-center justify-center gap-2 text-sm font-medium text-on-surface-variant transition-colors"
          >
            Next Section <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Preview Panel */}
      <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        {/* Projection Preview */}
        <div className="flex-1 min-h-0">
          <ProjectionPreview className="h-full" />
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-2.5">
          {/* Audio level */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-text-secondary" />
            <div className="flex gap-0.5 h-3 items-end">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1 rounded-sm transition-all duration-75',
                    audioLevel > (i / 12)
                      ? i > 9 ? 'bg-destructive' : i > 7 ? 'bg-tertiary' : 'bg-secondary'
                      : 'bg-surface-high'
                  )}
                  style={{ height: `${40 + i * 5}%` }}
                />
              ))}
            </div>
          </div>

          <div className="w-px h-4 bg-outline-variant/20" />

          {/* AI status */}
          <button
            onClick={() => setIsListening(!isListening)}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-all duration-150 px-2 py-1 rounded-md',
              isListening
                ? 'text-secondary hover:bg-secondary/10'
                : 'text-text-secondary hover:bg-surface-high'
            )}
          >
            <Mic2 className={cn('w-3.5 h-3.5', isListening && 'animate-pulse')} />
            {isListening ? 'AI Active' : 'AI Off'}
          </button>

          <div className="flex-1" />

          {/* Action buttons */}
          <button
            onClick={() => {
              if (isBlackout) { clearBlackout(); window.luminary?.output.setBlank(false) }
              else { blackout(); window.luminary?.output.setBlank(true) }
            }}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150',
              isBlackout
                ? 'bg-destructive text-white'
                : 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
            )}
          >
            <EyeOff className="w-3.5 h-3.5" />
            {isBlackout ? 'BLACKED OUT' : 'BLACKOUT'}
          </button>

          <button
            onClick={() => {
              clearBlackout()
              window.luminary?.output.setBlank(false)
              window.luminary?.output.setLogo(false)
              window.luminary?.output.setFreeze(false)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg
                       bg-surface-high text-on-surface-variant hover:bg-surface-bright border border-outline-variant/20 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            Clear Overlays
          </button>

          <button
            onClick={() => {
              if (isLive) { stopLive(); window.luminary?.output.endLive() }
              else { goLive(); window.luminary?.output.goLive() }
            }}
            className={cn(
              'flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition-all duration-150',
              isLive
                ? 'bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30'
                : 'bg-primary-gradient text-white shadow-glow hover:opacity-90'
            )}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            {isLive ? 'LIVE' : 'GO LIVE'}
          </button>
        </div>
      </div>
    </div>
  )
}
