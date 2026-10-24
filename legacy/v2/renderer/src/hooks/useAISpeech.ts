import { useEffect, useRef } from 'react'
import { useAIStore } from '../store/aiStore'
import { startSpeechCapture, stopSpeechCapture } from '../lib/speechCapture'
import type { VerseMatch } from '../types/luminary'

export function useAISpeech(onVerseDetected?: (match: VerseMatch) => void): void {
  const { isListening, setIsListening, setAudioLevel, setTranscriptBuffer } = useAIStore()
  const activeRef = useRef(false)

  useEffect(() => {
    if (!isListening || typeof window === 'undefined' || !window.luminary) {
      if (activeRef.current) {
        stopSpeechCapture()
        void window.luminary?.ai.stopListening()
        activeRef.current = false
      }
      return
    }

    let cancelled = false

    const start = async () => {
      await window.luminary.ai.startListening()
      if (cancelled) return

      const ok = startSpeechCapture({
        onPartial: (text) => {
          setTranscriptBuffer(text)
          void window.luminary.ai.submitTranscript(text, false)
        },
        onFinal: (text) => {
          setTranscriptBuffer(text)
          void window.luminary.ai.submitTranscript(text, true)
        },
        onError: () => {
          setIsListening(false)
        },
      })

      activeRef.current = ok
      if (!ok) setIsListening(false)
    }

    void start()

    const unsubStatus = window.luminary.on.aiStatus((data) => {
      const status = data as { audioLevel?: number; partial?: string; isPartial?: boolean }
      if (status.audioLevel !== undefined) setAudioLevel(status.audioLevel)
      if (status.partial && status.isPartial) setTranscriptBuffer(status.partial)
    })

    const unsubVerse = onVerseDetected
      ? window.luminary.on.verseDetected((data) => onVerseDetected(data as VerseMatch))
      : () => {}

    return () => {
      cancelled = true
      stopSpeechCapture()
      void window.luminary?.ai.stopListening()
      activeRef.current = false
      unsubStatus()
      unsubVerse()
    }
  }, [isListening, onVerseDetected, setAudioLevel, setIsListening, setTranscriptBuffer])
}
