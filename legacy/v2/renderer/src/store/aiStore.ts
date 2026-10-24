import { create } from 'zustand'

export type AIMode = 'auto' | 'assisted' | 'off'
export type ModelType = 'vosk-small' | 'whisper-tiny' | 'whisper-base' | 'whisper-small'
export type SensitivityLevel = 'high' | 'medium' | 'low'

interface AIState {
  mode: AIMode
  model: ModelType
  sensitivity: SensitivityLevel
  confidenceThreshold: number
  isListening: boolean
  isCalibrating: boolean
  audioInputDevice: string
  audioLevel: number
  transcriptBuffer: string
  lastDetectionTime: number | null
  setMode: (m: AIMode) => void
  setModel: (m: ModelType) => void
  setSensitivity: (s: SensitivityLevel) => void
  setConfidenceThreshold: (v: number) => void
  setIsListening: (v: boolean) => void
  setIsCalibrating: (v: boolean) => void
  setAudioInputDevice: (d: string) => void
  setAudioLevel: (v: number) => void
  setTranscriptBuffer: (t: string) => void
  setLastDetectionTime: (t: number | null) => void
}

export const useAIStore = create<AIState>((set) => ({
  mode: 'assisted',
  model: 'whisper-tiny',
  sensitivity: 'medium',
  confidenceThreshold: 85,
  isListening: false,
  isCalibrating: false,
  audioInputDevice: 'Default Microphone',
  audioLevel: 0,
  transcriptBuffer: '',
  lastDetectionTime: null,

  setMode: (m) => set({ mode: m }),
  setModel: (m) => set({ model: m }),
  setSensitivity: (s) => set({ sensitivity: s }),
  setConfidenceThreshold: (v) => set({ confidenceThreshold: v }),
  setIsListening: (v) => set({ isListening: v }),
  setIsCalibrating: (v) => set({ isCalibrating: v }),
  setAudioInputDevice: (d) => set({ audioInputDevice: d }),
  setAudioLevel: (v) => set({ audioLevel: v }),
  setTranscriptBuffer: (t) => set({ transcriptBuffer: t }),
  setLastDetectionTime: (t) => set({ lastDetectionTime: t }),
}))
