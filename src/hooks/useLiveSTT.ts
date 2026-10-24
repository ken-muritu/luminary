import type { AppSettings } from "@/stores/settingsStore";
import { type RefObject, useMemo } from "react";
import { useBrowserSpeechSTT } from "./useBrowserSpeechSTT";
import { useWhisperSTT } from "./useWhisperSTT";

interface UseLiveSTTOptions {
  enabled: boolean;
  model: AppSettings["aiModel"];
  streamRef: RefObject<MediaStream | null>;
  audioCtxRef: RefObject<AudioContext | null>;
  onTranscript: (text: string) => void;
}

export function useLiveSTT({
  enabled,
  model,
  streamRef,
  audioCtxRef,
  onTranscript,
}: UseLiveSTTOptions) {
  const whisper = useWhisperSTT({
    enabled,
    model,
    streamRef,
    audioCtxRef,
    onTranscript,
  });

  const whisperReady = whisper.status === "ready";
  const browser = useBrowserSpeechSTT({
    enabled: enabled && !whisperReady,
    onTranscript,
  });

  return useMemo(() => {
    const browserReady = browser.status === "ready";
    const ready = whisperReady || browserReady;
    const engine = whisperReady ? "whisper" : browserReady ? "browser" : null;

    let statusLabel: string;
    if (ready && engine === "browser") {
      statusLabel = "listening (browser)";
    } else if (ready) {
      statusLabel = "listening";
    } else if (whisper.status === "loading") {
      statusLabel = whisper.loadProgress ?? "loading Whisper model…";
    } else if (browser.status === "error") {
      statusLabel = "error";
    } else if (whisper.status === "error") {
      statusLabel = "error";
    } else if (!browser.supported && whisper.status === "idle") {
      statusLabel = "loading Whisper model…";
    } else {
      statusLabel = "starting…";
    }

    return {
      status: ready ? ("ready" as const) : whisper.status,
      engine,
      statusLabel,
      error: browser.error ?? whisper.error,
      lastTranscript: whisper.lastTranscript ?? browser.lastTranscript,
      whisperLoading: whisper.status === "loading",
    };
  }, [whisper, browser, whisperReady]);
}
