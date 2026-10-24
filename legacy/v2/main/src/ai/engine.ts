import { getDb } from '../database/client'
import { detectVerse, resetVerseDetector, type VerseMatch } from './verse-detector'

interface AIWorkerCallbacks {
  onTranscript?: (text: string, isPartial: boolean) => void
  onVerseDetected?: (match: VerseMatch) => void
  onStatus?: (status: { isListening: boolean; audioLevel?: number }) => void
}

let running = false
let callbacks: AIWorkerCallbacks = {}
let transcriptBuffer = ''
let defaultTranslation = 'KJV'
let confidenceThreshold = 0.85
let audioLevelTimer: ReturnType<typeof setInterval> | null = null

export function startAIWorker(cbs: AIWorkerCallbacks): void {
  callbacks = cbs
  running = true
  transcriptBuffer = ''
  resetVerseDetector()
  callbacks.onStatus?.({ isListening: true })

  audioLevelTimer = setInterval(() => {
    if (!running) return
    callbacks.onStatus?.({ isListening: true, audioLevel: 0.15 + Math.random() * 0.5 })
  }, 200)
}

export function stopAIWorker(): void {
  running = false
  transcriptBuffer = ''
  resetVerseDetector()
  if (audioLevelTimer) {
    clearInterval(audioLevelTimer)
    audioLevelTimer = null
  }
  callbacks.onStatus?.({ isListening: false })
}

export function sendAudioChunk(_chunk: Buffer): void {
  // Reserved for future Whisper/Vosk binary pipeline
}

export function isAIWorkerRunning(): boolean {
  return running
}

export function setAIConfig(cfg: { translation?: string; confidenceThreshold?: number }): void {
  if (cfg.translation) defaultTranslation = cfg.translation
  if (cfg.confidenceThreshold !== undefined) confidenceThreshold = cfg.confidenceThreshold
}

export async function processTranscript(text: string, isFinal: boolean): Promise<void> {
  if (!running || !text.trim()) return

  callbacks.onTranscript?.(text, !isFinal)

  if (!isFinal) return

  transcriptBuffer = `${transcriptBuffer} ${text}`.trim().slice(-600)
  const match = detectVerse(transcriptBuffer, defaultTranslation)
  if (!match || match.confidence < confidenceThreshold) return

  try {
    const db = getDb()
    const result = await db.execute({
      sql: `
        SELECT text FROM bible_verses
        WHERE translation = ? AND book_id = ? AND chapter = ? AND verse = ?
      `,
      args: [defaultTranslation, match.bookId, match.chapter, match.verse],
    })
    const row = result.rows[0] as { text?: string } | undefined
    if (row?.text) match.text = row.text
  } catch {
    // verse text optional — reference still useful
  }

  callbacks.onVerseDetected?.(match)
}
