import { create } from 'zustand'

export interface VerseDetectedEvent {
  id: string
  book: string
  chapter: number
  verse: number | null
  confidence: number
  rawText: string
  reference: string
  text?: string
  detectedAt: number
}

export interface SetlistItem {
  id: string
  type: 'song' | 'verse' | 'media' | 'timer' | 'announcement' | 'blank'
  title: string
  subtitle?: string
  duration?: number
  scheduled?: string
  key?: string
  bpm?: number
  isActive?: boolean
}

interface ServiceState {
  isLive: boolean
  currentItem: SetlistItem | null
  projectionText: string
  projectionSubtext: string
  cueQueue: VerseDetectedEvent[]
  mode: 'service' | 'rehearsal'
  isBlackout: boolean
  aiActive: boolean
  audioLevel: number
  isOnboarded: boolean
  setIsOnboarded: (v: boolean) => void
  goLive: () => void
  stopLive: () => void
  nextSlide: () => void
  confirmCue: (event: VerseDetectedEvent) => void
  dismissCue: (id: string) => void
  blackout: () => void
  clearBlackout: () => void
  setCurrentItem: (item: SetlistItem | null) => void
  setProjectionText: (text: string, subtext?: string) => void
  addCue: (cue: VerseDetectedEvent) => void
  setAiActive: (v: boolean) => void
  setAudioLevel: (v: number) => void
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  isLive: false,
  currentItem: null,
  projectionText: '',
  projectionSubtext: '',
  cueQueue: [],
  mode: 'service',
  isBlackout: false,
  aiActive: true,
  audioLevel: 0,
  isOnboarded: false,

  setIsOnboarded: (v) => {
    if (typeof window !== 'undefined' && window.luminary) {
      window.luminary.settings.set('isOnboarded', v)
    }
    set({ isOnboarded: v })
  },

  goLive: () => set({ isLive: true, isBlackout: false }),
  stopLive: () => set({ isLive: false }),

  nextSlide: () => {
    // advance logic handled at page level
  },

  confirmCue: (event) => {
    const { cueQueue } = get()
    set({
      cueQueue: cueQueue.filter((c) => c.id !== event.id),
      projectionText: event.text ?? `${event.book} ${event.chapter}:${event.verse}`,
      projectionSubtext: event.reference,
      isLive: true,
      isBlackout: false,
    })
  },

  dismissCue: (id) =>
    set((s) => ({ cueQueue: s.cueQueue.filter((c) => c.id !== id) })),

  blackout: () => set({ isBlackout: true }),
  clearBlackout: () => set({ isBlackout: false }),

  setCurrentItem: (item) => set({ currentItem: item }),

  setProjectionText: (text: string, subtext = '') =>
    set({ projectionText: text, projectionSubtext: subtext }),

  addCue: (cue: VerseDetectedEvent) =>
    set((s: ServiceState) => ({
      cueQueue: [cue, ...s.cueQueue.filter((c: VerseDetectedEvent) => c.reference !== cue.reference)].slice(0, 5),
    })),

  setAiActive: (v: boolean) => set({ aiActive: v }),
  setAudioLevel: (v: number) => set({ audioLevel: v }),
}))
