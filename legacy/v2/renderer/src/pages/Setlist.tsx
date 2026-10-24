import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Play, MonitorPlay, Clock, Music2, BookOpen,
  Image, Timer, GripVertical, Trash2, Zap, Loader2, AlertCircle,
  ArrowUp, ArrowDown, Save, Calendar
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useServiceStore } from '../store/serviceStore'
import ProjectionPreview from '../components/ProjectionPreview'
import type { Setlist, SetlistItem } from '../types/luminary'

const TYPE_CONFIG: Record<SetlistItem['type'], { icon: React.ElementType; color: string; bg: string }> = {
  song:         { icon: Music2,   color: 'text-primary',          bg: 'bg-primary/10' },
  verse:        { icon: BookOpen, color: 'text-secondary',        bg: 'bg-secondary/10' },
  media:        { icon: Image,    color: 'text-tertiary',         bg: 'bg-tertiary/10' },
  timer:        { icon: Timer,    color: 'text-on-surface-variant', bg: 'bg-surface-high' },
  blank:        { icon: Play,     color: 'text-text-secondary',   bg: 'bg-surface-high' },
  announcement: { icon: Image,    color: 'text-tertiary',         bg: 'bg-tertiary/10' },
}

export default function Setlist() {
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [activeItemId, setActiveItemId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const { isLive, goLive, stopLive, setCurrentItem } = useServiceStore()

  // Drag-and-drop state
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => { loadSetlists() }, [])

  async function loadSetlists() {
    setLoading(true); setError(null)
    try {
      const data = await window.luminary.setlists.getAll()
      setSetlists(data)
      if (data.length > 0 && activeId === null) setActiveId(data[0].id)
    } catch { setError('Failed to load setlists') }
    finally { setLoading(false) }
  }

  const active = setlists.find((s) => s.id === activeId) ?? null
  const activeItem = active?.items.find((i) => i.id === activeItemId) ?? null

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const created = await window.luminary.setlists.create({ name: newName.trim() })
      setSetlists((prev) => [created, ...prev])
      setActiveId(created.id)
      setNewName(''); setCreating(false)
    } catch { setError('Failed to create setlist') }
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this setlist?')) return
    try {
      await window.luminary.setlists.delete(id)
      const next = setlists.filter((s) => s.id !== id)
      setSetlists(next)
      if (activeId === id) setActiveId(next[0]?.id ?? null)
    } catch { setError('Failed to delete setlist') }
  }

  const handleRemoveItem = async (itemId: number) => {
    if (!active) return
    try {
      await window.luminary.setlists.removeItem(itemId)
      setSetlists((prev) => prev.map((s) =>
        s.id === active.id ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      ))
      if (activeItemId === itemId) setActiveItemId(null)
    } catch { setError('Failed to remove item') }
  }

  const handleProjectItem = (item: SetlistItem) => {
    setCurrentItem({ id: String(item.id), type: item.type, title: item.title })
    window.luminary?.output.setSlide({ type: item.type as 'song' | 'verse' | 'media' | 'blank', text: item.title, subtext: item.subtitle })
    if (!isLive) { goLive(); window.luminary?.output.goLive() }
  }

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null || !active) return

    const items = [...active.items]
    const dragIndex = items.findIndex(i => i.id === draggedItem)
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedItem(null)
      setDragOverIndex(null)
      return
    }

    // Reorder items
    const [removed] = items.splice(dragIndex, 1)
    items.splice(dropIndex, 0, removed)

    // Update positions
    const updatedItems = items.map((item, idx) => ({ ...item, position: idx }))

    try {
      await window.luminary.setlists.reorderItems(updatedItems.map(i => ({ id: i.id, position: i.position })))
      setSetlists(prev => prev.map(s => s.id === active.id ? { ...s, items: updatedItems } : s))
    } catch {
      setError('Failed to reorder items')
    }

    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const moveItem = async (itemId: number, direction: 'up' | 'down') => {
    if (!active) return
    const items = [...active.items]
    const index = items.findIndex(i => i.id === itemId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const [removed] = items.splice(index, 1)
    items.splice(newIndex, 0, removed)

    const updatedItems = items.map((item, idx) => ({ ...item, position: idx }))
    try {
      await window.luminary.setlists.reorderItems(updatedItems.map(i => ({ id: i.id, position: i.position })))
      setSetlists(prev => prev.map(s => s.id === active.id ? { ...s, items: updatedItems } : s))
    } catch {
      setError('Failed to move item')
    }
  }

  const recent = setlists.filter((s) => !s.isTemplate)
  const templates = setlists.filter((s) => s.isTemplate)

  return (
    <div className="flex h-full bg-surface">
      {/* Left: Setlist Library */}
      <div className="w-[240px] shrink-0 flex flex-col bg-surface-low border-r border-outline-variant/10">
        <div className="p-4 border-b border-outline-variant/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Setlists</h2>
            <button
              onClick={() => setCreating((v) => !v)}
              className="w-7 h-7 rounded-lg bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          </div>
          {creating && (
            <div className="flex gap-1.5">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
                placeholder="Setlist name…"
                className="input text-xs flex-1"
              />
              <button onClick={handleCreate} className="btn-primary text-xs px-2">Add</button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-text-secondary" /></div>}
          {error && <div className="flex items-center gap-1.5 text-destructive text-xs p-2"><AlertCircle className="w-3 h-3" />{error}</div>}

          {recent.length > 0 && <div className="section-label mb-2">Recent</div>}
          {recent.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={cn('w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group',
                activeId === s.id ? 'bg-surface-high' : 'hover:bg-surface-container')}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-on-surface-variant truncate flex-1">{s.name}</div>
                <button
                  onClick={(e) => handleDelete(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-text-secondary hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">
                {s.serviceDate ?? 'No date'} · {s.items.length} items
              </div>
            </button>
          ))}

          {templates.length > 0 && <div className="section-label mb-2 mt-4">Templates</div>}
          {templates.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={cn('w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150',
                activeId === s.id ? 'bg-surface-high' : 'hover:bg-surface-container')}
            >
              <div className="text-xs font-medium text-on-surface-variant truncate">{s.name}</div>
              <div className="text-[10px] text-text-secondary mt-0.5">{s.items.length} items</div>
            </button>
          ))}

          {!loading && setlists.length === 0 && !error && (
            <div className="flex flex-col items-center py-8 text-text-secondary text-xs gap-2">
              <Zap className="w-6 h-6 opacity-30" />
              No setlists yet
            </div>
          )}
        </div>
      </div>

      {/* Center: Active Setlist */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {active ? (
          <>
            <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">{active.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  {active.serviceDate && (
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                      <Clock className="w-3 h-3" />{active.serviceDate}
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">{active.items.length} items</span>
                  {isLive && <span className="live-indicator text-[10px]"><span className="live-dot" />Live Link Active</span>}
                </div>
              </div>
              <button
                onClick={() => { if (isLive) { stopLive(); window.luminary?.output.endLive() } else { goLive(); window.luminary?.output.goLive() } }}
                className={cn('flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition-all',
                  isLive ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-primary-gradient text-white shadow-glow hover:opacity-90')}
              >
                <Zap className="w-3.5 h-3.5" fill={isLive ? undefined : 'currentColor'} />
                {isLive ? 'LIVE' : 'GO LIVE'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-2 flex items-center gap-3 text-[10px] text-text-secondary border-b border-outline-variant/5">
                <span className="w-5" /><span className="flex-1">Item</span><span className="w-8" />
              </div>

              {active.items.map((item, index) => {
                const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.blank
                const Icon = cfg.icon
                const isDragging = draggedItem === item.id
                const isDragOver = dragOverIndex === index
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => setActiveItemId(item.id)}
                    className={cn('w-full px-5 py-3 flex items-center gap-3 border-b border-outline-variant/5 transition-all cursor-pointer group select-none',
                      activeItemId === item.id ? 'bg-surface-high' : 'hover:bg-surface-container',
                      isDragging && 'opacity-50',
                      isDragOver && 'border-t-2 border-t-primary bg-primary/5')}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-text-secondary/30 group-hover:text-text-secondary/60 shrink-0 cursor-grab active:cursor-grabbing" />
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-on-surface-variant group-hover:text-white transition-colors truncate">{item.title}</div>
                      {item.subtitle && <div className="text-[10px] text-text-secondary truncate">{item.subtitle}</div>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, 'up') }}
                        disabled={index === 0}
                        className="w-6 h-6 rounded hover:bg-surface-bright flex items-center justify-center text-text-secondary disabled:opacity-30">
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveItem(item.id, 'down') }}
                        disabled={index === active.items.length - 1}
                        className="w-6 h-6 rounded hover:bg-surface-bright flex items-center justify-center text-text-secondary disabled:opacity-30">
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleProjectItem(item) }}
                        className="w-6 h-6 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center">
                        <MonitorPlay className="w-3 h-3 text-primary" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id) }}
                        className="w-6 h-6 rounded hover:bg-destructive/10 flex items-center justify-center text-text-secondary hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {active.items.length === 0 && (
                <div className="flex flex-col items-center py-12 text-text-secondary text-xs gap-2">
                  <Zap className="w-6 h-6 opacity-20" />
                  No items — add songs, verses, or media
                </div>
              )}
            </div>
          </>
        ) : (
          !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-3">
              <Zap className="w-10 h-10 opacity-20" />
              <span className="text-sm">Select a setlist or create a new one</span>
            </div>
          )
        )}
      </div>

      {/* Right: Preview + Selected Item */}
      <div className="w-[280px] shrink-0 flex flex-col bg-surface-low border-l border-outline-variant/10">
        <div className="p-4 border-b border-outline-variant/10">
          <div className="section-label mb-3">Live Output Preview</div>
          <ProjectionPreview compact className="w-full" />
        </div>

        {activeItem && (
          <div className="p-4 border-b border-outline-variant/10">
            <div className="section-label mb-3">Selected Item</div>
            <div className="bg-surface-container rounded-xl p-3">
              <div className="text-sm font-semibold text-white mb-1">{activeItem.title}</div>
              <div className="text-xs text-text-secondary capitalize">{activeItem.type}</div>
            </div>
            <div className="mt-3 space-y-2">
              <button
                onClick={() => handleProjectItem(activeItem)}
                className="w-full btn-primary text-xs flex items-center justify-center gap-2"
              >
                <MonitorPlay className="w-3.5 h-3.5" /> Push to Screen
              </button>
              <button
                onClick={() => handleRemoveItem(activeItem.id)}
                className="w-full btn-destructive text-xs flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
