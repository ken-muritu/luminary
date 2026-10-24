import { useEffect } from 'react'
import { MonitorPlay, EyeOff } from 'lucide-react'
import { useServiceStore } from '../store/serviceStore'
import { cn } from '../lib/utils'
import type { SlidePayload } from '../types/luminary'

interface Props {
  className?: string
  compact?: boolean
}

export default function ProjectionPreview({ className, compact = false }: Props) {
  const { isLive, isBlackout, projectionText, projectionSubtext, currentItem, setProjectionText } = useServiceStore()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.luminary) return
    return window.luminary.on.outputPreview((data) => {
      const slide = data as SlidePayload
      if (slide.type === 'blank') return
      const text = slide.text ?? ''
      const subtext = slide.subtext ?? slide.reference ?? slide.songTitle ?? ''
      if (text || subtext) setProjectionText(text, subtext)
    })
  }, [setProjectionText])

  return (
    <div
      className={cn(
        'projection-screen flex flex-col items-center justify-center relative',
        'shadow-float border border-outline-variant/10',
        compact ? 'min-h-[120px]' : 'min-h-[200px]',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-xl" />

      {isBlackout ? (
        <div className="flex flex-col items-center gap-2 text-text-secondary">
          <EyeOff className="w-6 h-6" />
          <span className="text-xs font-medium uppercase tracking-widest">Blackout</span>
        </div>
      ) : projectionText ? (
        <div className="flex flex-col items-center justify-center text-center px-6 py-4 gap-2">
          <p
            className={cn(
              'font-bold text-white leading-tight',
              compact ? 'text-base' : 'text-2xl'
            )}
          >
            {projectionText}
          </p>
          {projectionSubtext && (
            <p className={cn('text-on-surface-variant', compact ? 'text-[10px]' : 'text-sm')}>
              {projectionSubtext}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-text-secondary/50">
          <MonitorPlay className={cn(compact ? 'w-5 h-5' : 'w-8 h-8')} />
          {!compact && <span className="text-xs">No content projected</span>}
        </div>
      )}

      {isLive && !isBlackout && (
        <div className="absolute top-2 right-2">
          <span className="live-indicator text-[9px]">
            <span className="live-dot" />
            LIVE
          </span>
        </div>
      )}

      {currentItem && (
        <div className="absolute bottom-2 left-2">
          <span className="text-[9px] text-text-secondary/60 font-medium truncate max-w-[100px]">
            {currentItem.title}
          </span>
        </div>
      )}
    </div>
  )
}
