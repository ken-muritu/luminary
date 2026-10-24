import { useState, useEffect } from 'react'
import {
  Image, Video, Timer, Megaphone, Upload, Play,
  MonitorPlay, Trash2, Tag, Info, FolderOpen
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useServiceStore } from '../store/serviceStore'
import type { MediaAsset } from '../types/luminary'

const CATEGORIES = [
  { id: 'backgrounds', label: 'Backgrounds', icon: Image, color: 'text-primary' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, color: 'text-tertiary' },
  { id: 'countdowns', label: 'Countdowns', icon: Timer, color: 'text-secondary' },
  { id: 'videos', label: 'Video Loops', icon: Video, color: 'text-destructive' },
] as const

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDims(width: number | null, height: number | null): string {
  if (!width || !height) return '—'
  return `${width}×${height}`
}

function categoryLabel(category: MediaAsset['category']): string {
  if (category === 'video_loops') return 'video'
  return category.replace('_', ' ').replace(/s$/, '')
}

function badgeFor(item: MediaAsset): string {
  if (item.category === 'countdowns') return 'TIMER'
  if (item.category === 'announcements') return 'POSTER'
  if (item.mimeType.startsWith('video/')) return 'LOOP'
  if ((item.width ?? 0) >= 3840) return '4K'
  return 'HD'
}

export default function Media() {
  const [activeCategory, setActiveCategory] = useState<string>('backgrounds')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mediaItems, setMediaItems] = useState<MediaAsset[]>([])
  const { setProjectionText, goLive, isLive } = useServiceStore()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.luminary) return
    window.luminary.media.list().then((data) => {
      setMediaItems(data.items)
    })
  }, [])

  const selected = mediaItems.find((m) => m.id === selectedId)

  const filtered = mediaItems.filter((m) => {
    if (activeCategory === 'videos') return m.category === 'video_loops'
    return m.category === activeCategory
  })

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = mediaItems.filter((m) =>
      cat.id === 'videos' ? m.category === 'video_loops' : m.category === cat.id
    ).length
    return acc
  }, {})

  const handleImport = async () => {
    if (!window.luminary) return
    const result = await window.luminary.media.import()
    if (result.success && result.items) {
      setMediaItems((prev) => [...(result.items as MediaAsset[]), ...prev])
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.luminary) return
    await window.luminary.media.delete(id)
    setMediaItems((prev) => prev.filter((m) => m.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="flex h-full bg-surface">
      <div className="w-[220px] shrink-0 flex flex-col bg-surface-low border-r border-outline-variant/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Media Library</h2>
          <button
            onClick={handleImport}
            className="w-7 h-7 rounded-lg bg-surface-high hover:bg-surface-bright flex items-center justify-center transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-text-secondary" />
          </button>
        </div>

        <div className="space-y-1">
          {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150',
                activeCategory === id ? 'bg-surface-high' : 'hover:bg-surface-container'
              )}
            >
              <Icon className={cn('w-4 h-4', color)} />
              <span className="flex-1 text-sm text-on-surface-variant">{label}</span>
              <span className="text-[10px] text-text-secondary font-mono">{categoryCounts[id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10">
          <h3 className="text-sm font-bold text-white capitalize">{activeCategory}</h3>
          <p className="text-xs text-text-secondary">{filtered.length} items</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-text-secondary">No media imported yet. Use Upload to add files.</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'relative rounded-xl overflow-hidden aspect-video transition-all duration-150',
                    selectedId === item.id
                      ? 'ring-2 ring-primary shadow-glow'
                      : 'ring-1 ring-outline-variant/10 hover:ring-outline-variant/30'
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-high to-surface-container">
                    {item.mimeType.startsWith('video/') ? (
                      <Play className="w-8 h-8 text-white/30" />
                    ) : (
                      <Image className="w-8 h-8 text-white/20" />
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-high text-text-secondary">
                      {badgeFor(item)}
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[10px] text-white font-medium truncate">{item.fileName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="w-[260px] shrink-0 flex flex-col bg-surface-low border-l border-outline-variant/10">
          <div className="p-4 border-b border-outline-variant/10">
            <h3 className="text-sm font-bold text-white mb-1">Selection Details</h3>
            <div className="w-full aspect-video rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br from-surface-high to-surface-container">
              {selected.mimeType.startsWith('video/') ? (
                <Play className="w-8 h-8 text-white/40" />
              ) : (
                <Image className="w-10 h-10 text-white/20" />
              )}
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'File', value: selected.fileName },
                { label: 'Dimensions', value: formatDims(selected.width, selected.height) },
                { label: 'Size', value: formatBytes(selected.fileSize) },
                { label: 'Type', value: categoryLabel(selected.category) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-text-secondary">{label}</span>
                  <span className="text-on-surface-variant font-medium">{value}</span>
                </div>
              ))}
            </div>
            {selected.tags && (
              <div className="mt-3 flex flex-wrap gap-1">
                {selected.tags.split(',').filter(Boolean).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-high text-[10px] text-text-secondary">
                    <Tag className="w-2 h-2" /> {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 space-y-2">
            <button
              onClick={() => {
                setProjectionText('', selected.fileName)
                goLive()
                if (window.luminary && isLive) {
                  window.luminary.output.setSlide({
                    type: 'media',
                    text: selected.fileName,
                    mediaPath: selected.filePath,
                  })
                }
              }}
              className="w-full btn-primary text-xs flex items-center justify-center gap-2"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              Send to Live
            </button>
            <button
              onClick={() => handleDelete(selected.id)}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-2 text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
