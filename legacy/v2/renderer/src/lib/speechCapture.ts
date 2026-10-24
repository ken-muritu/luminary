type SpeechRecognitionCtor = new () => SpeechRecognition

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface SpeechCaptureHandlers {
  onPartial?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (message: string) => void
}

let recognition: SpeechRecognition | null = null

export function isSpeechCaptureAvailable(): boolean {
  return getRecognitionCtor() !== null
}

export function startSpeechCapture(handlers: SpeechCaptureHandlers): boolean {
  const Ctor = getRecognitionCtor()
  if (!Ctor) {
    handlers.onError?.('Speech recognition not available in this environment')
    return false
  }

  stopSpeechCapture()
  recognition = new Ctor()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = ''
    let finalText = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const part = event.results[i][0]?.transcript ?? ''
      if (event.results[i].isFinal) finalText += part
      else interim += part
    }
    if (interim.trim()) handlers.onPartial?.(interim.trim())
    if (finalText.trim()) handlers.onFinal?.(finalText.trim())
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    handlers.onError?.(event.error || 'speech-error')
  }

  recognition.onend = () => {
    if (recognition) {
      try { recognition.start() } catch { /* restarted */ }
    }
  }

  try {
    recognition.start()
    return true
  } catch (err) {
    handlers.onError?.(String(err))
    return false
  }
}

export function stopSpeechCapture(): void {
  if (!recognition) return
  try {
    recognition.onend = null
    recognition.stop()
  } catch { /* ignore */ }
  recognition = null
}
