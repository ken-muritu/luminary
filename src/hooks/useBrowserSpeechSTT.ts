import { useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseBrowserSpeechSTTOptions {
  enabled: boolean;
  onTranscript: (text: string) => void;
}

export function useBrowserSpeechSTT({ enabled, onTranscript }: UseBrowserSpeechSTTOptions) {
  const [status, setStatus] = useState<"idle" | "ready" | "error" | "unsupported">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const supported = getSpeechRecognition() !== null;

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!enabled) {
      setStatus("idle");
      setError(null);
      return;
    }
    if (!SpeechRecognition) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0]?.transcript ?? "";
        }
      }
      const trimmed = text.trim();
      if (trimmed) {
        setLastTranscript(trimmed);
        onTranscriptRef.current(trimmed);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (cancelled) return;
      if (event.error === "aborted" || event.error === "no-speech") return;
      setStatus("error");
      setError(
        event.error === "not-allowed"
          ? "Speech recognition blocked — allow microphone access"
          : `Speech recognition error: ${event.error}`,
      );
    };

    recognition.onend = () => {
      if (cancelled) return;
      try {
        recognition.start();
      } catch {
        // ignore restart races
      }
    };

    try {
      recognition.start();
      setStatus("ready");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not start speech recognition");
    }

    return () => {
      cancelled = true;
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      setStatus("idle");
    };
  }, [enabled]);

  return { status, error, lastTranscript, supported };
}
