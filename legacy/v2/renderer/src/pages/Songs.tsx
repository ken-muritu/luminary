import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, Music2, Edit3, Trash2, MonitorPlay,
  Hash, ChevronUp, ChevronDown, GripVertical, Loader2, AlertCircle
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useServiceStore } from '../store/serviceStore'
import type { Song, SongSection } from '../types/luminary'

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm']

const SECTION_TYPE_LABELS: Record<string, string> = {
  verse: 'Verse', chorus: 'Chorus', bridge: 'Bridge',
  pre_chorus: 'Pre-Chorus', tag: 'Tag', outro: 'Outro', instrumental: 'Instrumental',
}

function emptyDraft(): Partial<Song> & { title: string; sections: SongSection[] } {
  return {
    title: '', artist: '', ccliNumber: '', keySig: '', bpm: null,
    copyright: '', year: null, licenseType: 'ccli',
    sections: [{ type: 'verse', label: 'Verse 1', lyrics: '', position: 0 }],
  }
}

export default function Songs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const [draft, setDraft] = useState<Partial<Song> & { title: string; sections: SongSection[] }>(emptyDraft())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { setProjectionText, goLive } = useServiceStore()

  useEffect(() => {
    loadSongs()
  }, [])

  async function loadSongs() {
    setLoading(true)
    setError(null)
    try {
      const data = await window.luminary.songs.getAll()
      setSongs(data)
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].id)
        setDraft({ ...data[0] })
      }
    } catch (e) {
      setError('Failed to load songs')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (q: string) => {
    setSearch(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const data = q.trim()
          ? await window.luminary.songs.search(q)
          : await window.luminary.songs.getAll()
        setSongs(data)
      } catch {}
    }, 300)
  }

  const selected = songs.find((s) => s.id === selectedId) ?? null
  const sections = (creating ? draft.sections : selected?.sections) ?? []
  const activeSec = sections[activeSection] ?? sections[0]

  const handleSelectSong = (song: Song) => {
    setSelectedId(song.id)
    setDraft({ ...song })
    setCreating(false)
    setEditMode(false)
    setActiveSection(0)
  }

  const handleNewSong = () => {
    setCreating(true)
    setEditMode(true)
    setSelectedId(null)
    setDraft(emptyDraft())
    setActiveSection(0)
  }

  const handleProject = (sectionIdx: number) => {
    const sec = sections[sectionIdx]
    const songTitle = creating ? draft.title : (selected?.title ?? '')
    if (!sec) return
    setProjectionText(sec.lyrics, songTitle)
    goLive()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (creating) {
        const saved = await window.luminary.songs.create(draft)
        setSongs((prev) => [saved, ...prev])
        setSelectedId(saved.id)
        setDraft({ ...saved })
        setCreating(false)
      } else if (selected) {
        const saved = await window.luminary.songs.update({ ...draft, id: selected.id })
        setSongs((prev) => prev.map((s) => s.id === saved.id ? saved : s))
        setDraft({ ...saved })
      }
      setEditMode(false)
    } catch {
      setError('Failed to save song')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (creating) {
      setCreating(false)
      setEditMode(false)
      setSelectedId(songs[0]?.id ?? null)
      setDraft(songs[0] ? { ...songs[0] } : emptyDraft())
    } else {
      setDraft(selected ? { ...selected } : emptyDraft())
      setEditMode(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!confirm(`Delete "${selected.title}"? This cannot be undone.`)) return
    try {
      await window.luminary.songs.delete(selected.id)
      const next = songs.filter((s) => s.id !== selected.id)
      setSongs(next)
      setSelectedId(next[0]?.id ?? null)
      setDraft(next[0] ? { ...next[0] } : emptyDraft())
    } catch {
      setError('Failed to delete song')
    }
  }

  const updateDraftSection = (idx: number, lyrics: string) => {
    setDraft((d) => {
      const sections = [...(d.sections ?? [])]
      sections[idx] = { ...sections[idx], lyrics }
      return { ...d, sections }
    })
  }

  const addSection = () => {
    setDraft((d) => {
      const sections = [...(d.sections ?? [])]
      sections.push({ type: 'verse', label: `Verse ${sections.length + 1}`, lyrics: '', position: sections.length })
      return { ...d, sections }
    })
    setActiveSection(draft.sections.length)
  }

  return (
    <div className="flex h-full bg-surface">
      {/* Song Library List */}
      <div className="w-[380px] shrink-0 flex flex-col bg-surface-low border-r border-outline-variant/10">
        <div className="p-4 border-b border-outline-variant/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Song Library</h2>
            <button onClick={handleNewSong} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Song
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search title, artist, CCLI..."
              className="input pl-9"
            />
          </div>
        </div>

        <div className="px-4 py-2 flex items-center gap-3 border-b border-outline-variant/10">
          <span className="section-label flex-1">Title</span>
          <span className="section-label w-8 text-right">Key</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          )}
          {error && !loading && (
            <div className="flex items-center gap-2 mx-4 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}
          {!loading && songs.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary text-xs gap-2">
              <Music2 className="w-8 h-8 opacity-30" />
              No songs yet — add your first one
            </div>
          )}
          {songs.map((song) => (
            <button
              key={song.id}
              onClick={() => handleSelectSong(song)}
              className={cn(
                'w-full text-left px-4 py-3 flex items-center gap-3 border-b border-outline-variant/5 transition-all duration-150',
                selectedId === song.id && !creating ? 'bg-surface-high' : 'hover:bg-surface-container'
              )}
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Music2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-on-surface-variant truncate">{song.title}</div>
                <div className="text-[11px] text-text-secondary truncate">
                  {song.artist}{song.ccliNumber ? ` · #${song.ccliNumber}` : ''}
                </div>
              </div>
              <span className="text-xs font-mono text-text-secondary w-8 text-right shrink-0">{song.keySig}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Song Editor / Projection Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {(selected || creating) && (
          <>
            {/* Song header */}
            <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {editMode ? (
                  <input
                    value={draft.title ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Song title…"
                    className="input text-lg font-bold w-full max-w-sm"
                  />
                ) : (
                  <h2 className="text-lg font-bold text-white truncate">{selected?.title}</h2>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {editMode ? (
                    <input
                      value={draft.artist ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, artist: e.target.value }))}
                      placeholder="Artist"
                      className="input text-xs w-40"
                    />
                  ) : (
                    <span className="text-xs text-text-secondary">{selected?.artist}</span>
                  )}
                  {(selected?.ccliNumber || editMode) && (
                    <>
                      <span className="text-outline-variant/40">·</span>
                      {editMode ? (
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-text-secondary" />
                          <input
                            value={draft.ccliNumber ?? ''}
                            onChange={(e) => setDraft((d) => ({ ...d, ccliNumber: e.target.value }))}
                            placeholder="CCLI #"
                            className="input text-xs w-28"
                          />
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-text-secondary">
                          <Hash className="w-3 h-3" />{selected?.ccliNumber}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {!creating && (
                  <button
                    onClick={() => { setEditMode(!editMode); if (editMode) handleDiscard() }}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all',
                      editMode
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'text-text-secondary border-outline-variant/20 hover:bg-surface-high'
                    )}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {editMode ? 'Editing' : 'Edit'}
                  </button>
                )}
                {!creating && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-outline-variant/20 text-text-secondary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Sections list */}
              <div className="w-[240px] shrink-0 border-r border-outline-variant/10 flex flex-col">
                <div className="p-4 border-b border-outline-variant/10">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="section-label mb-1.5 block">Key</label>
                      <select
                        className="input text-xs"
                        value={editMode ? (draft.keySig ?? '') : (selected?.keySig ?? '')}
                        onChange={(e) => editMode && setDraft((d) => ({ ...d, keySig: e.target.value }))}
                        disabled={!editMode}
                      >
                        <option value="">—</option>
                        {KEYS.map((k) => <option key={k}>{k}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="section-label mb-1.5 block">BPM</label>
                      <input
                        type="number"
                        value={editMode ? (draft.bpm ?? '') : (selected?.bpm ?? '')}
                        onChange={(e) => editMode && setDraft((d) => ({ ...d, bpm: e.target.value ? Number(e.target.value) : null }))}
                        className="input text-xs"
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="section-label">Arrangement</span>
                    {editMode && (
                      <button onClick={addSection} className="text-[10px] text-primary hover:text-primary/80 font-medium">
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {sections.map((section, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSection(idx)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2 group transition-all duration-150',
                          activeSection === idx ? 'bg-primary/15 text-white' : 'text-on-surface-variant hover:bg-surface-high'
                        )}
                      >
                        <GripVertical className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <div className={cn('text-xs font-semibold', activeSection === idx ? 'text-primary' : 'text-on-surface-variant')}>
                            {section.label || SECTION_TYPE_LABELS[section.type] || section.type}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleProject(idx) }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Project this section"
                        >
                          <MonitorPlay className="w-3.5 h-3.5 text-text-secondary hover:text-white" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 border-t border-outline-variant/10 space-y-2">
                  <button
                    onClick={() => handleProject(activeSection)}
                    className="w-full btn-primary text-xs flex items-center justify-center gap-2"
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    Project Section
                  </button>
                  {editMode && (
                    <div className="flex gap-2">
                      <button onClick={handleDiscard} className="flex-1 btn-secondary text-xs">
                        Discard
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || !draft.title?.trim()}
                        className="flex-1 btn-primary text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                        {creating ? 'Create' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lyrics editor */}
              <div className="flex-1 p-6 overflow-y-auto">
                {activeSec && (
                  <>
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-sm font-bold text-white">
                        {activeSec.label || SECTION_TYPE_LABELS[activeSec.type] || activeSec.type}
                      </h3>
                      {editMode && sections.length > 1 && (
                        <div className="flex gap-1">
                          <button
                            disabled={activeSection === 0}
                            onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
                            className="w-6 h-6 rounded bg-surface-high hover:bg-surface-bright flex items-center justify-center disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3 text-text-secondary" />
                          </button>
                          <button
                            disabled={activeSection === sections.length - 1}
                            onClick={() => setActiveSection((s) => Math.min(sections.length - 1, s + 1))}
                            className="w-6 h-6 rounded bg-surface-high hover:bg-surface-bright flex items-center justify-center disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3 text-text-secondary" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editMode ? (
                      <textarea
                        value={activeSec.lyrics}
                        onChange={(e) => updateDraftSection(activeSection, e.target.value)}
                        className="input w-full h-56 resize-none text-sm leading-relaxed font-medium"
                        placeholder="Enter lyrics…"
                      />
                    ) : (
                      <div className="bg-surface-container rounded-xl p-5">
                        {activeSec.lyrics ? (
                          <p className="text-base text-on-surface-variant leading-loose font-medium whitespace-pre-line">
                            {activeSec.lyrics}
                          </p>
                        ) : (
                          <p className="text-sm text-text-secondary italic">No lyrics — click Edit to add</p>
                        )}
                      </div>
                    )}

                    {!editMode && selected?.copyright && (
                      <p className="mt-4 text-[11px] text-text-secondary">{selected.copyright}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {!selected && !creating && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-3">
            <Music2 className="w-10 h-10 opacity-20" />
            <span className="text-sm">Select a song or add a new one</span>
          </div>
        )}
      </div>
    </div>
  )
}
