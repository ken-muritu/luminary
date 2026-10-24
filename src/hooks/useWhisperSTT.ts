import { WHISPER_MODELS } from "@/lib/constants";
import type { AppSettings } from "@/stores/settingsStore";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

interface UseWhisperSTTOptions {
  enabled: boolean;
  model: AppSettings["aiModel"];
  streamRef: RefObject<MediaStream | null>;
  audioCtxRef: RefObject<AudioContext | null>;
  onTranscript: (text: string) => void;
}

export function useWhisperSTT({
  enabled,
  model,
  streamRef,
  audioCtxRef,
  onTranscript,
}: UseWhisperSTTOptions) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const bufferRef = useRef<Float32Array[]>([]);
  const readyRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const modelRef = useRef(model);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const flushAudio = useCallback(() => {
    if (!readyRef.current) return;
    const worker = workerRef.current;
    const chunks = bufferRef.current;
    if (!worker || chunks.length === 0) return;

    const total = chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    bufferRef.current = [];
    worker.postMessage({ type: "transcribe", audio: merged }, [merged.buffer]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setLoadProgress(null);
      readyRef.current = false;
      workerRef.current?.terminate();
      workerRef.current = null;
      return;
    }

    let interval = 0;
    let processor: ScriptProcessorNode | null = null;
    let cancelled = false;

    function spawnWorker(modelId: string) {
      workerRef.current?.terminate();
      readyRef.current = false;
      const worker = new Worker(new URL("../workers/stt.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      worker.onmessage = (
        event: MessageEvent<{ type: string; text?: string; message?: string; status?: string }>,
      ) => {
        if (event.data.type === "loading") {
          setLoadProgress(event.data.status ?? "Loading model…");
        }
        if (event.data.type === "ready") {
          readyRef.current = true;
          setStatus("ready");
          setLoadProgress(null);
          setError(null);
        }
        if (event.data.type === "transcript" && event.data.text) {
          setLastTranscript(event.data.text);
          onTranscriptRef.current(event.data.text);
        }
        if (event.data.type === "error") {
          setStatus("error");
          setError(event.data.message ?? "STT error");
        }
      };

      setStatus("loading");
      setLoadProgress("Loading Whisper model…");
      setError(null);
      worker.postMessage({ type: "load", model: modelId });
    }

    spawnWorker(WHISPER_MODELS[model]);
    modelRef.current = model;

    async function attachAudio() {
      const stream = streamRef.current;
      const ctx = audioCtxRef.current;
      if (!stream || !ctx || cancelled) return;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(stream);
      processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!readyRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        bufferRef.current.push(new Float32Array(input));
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      interval = window.setInterval(flushAudio, 4000);
    }

    const waitForStream = window.setInterval(() => {
      if (streamRef.current && audioCtxRef.current) {
        clearInterval(waitForStream);
        void attachAudio();
      }
    }, 100);

    return () => {
      cancelled = true;
      readyRef.current = false;
      clearInterval(waitForStream);
      clearInterval(interval);
      if (readyRef.current) flushAudio();
      bufferRef.current = [];
      processor?.disconnect();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [enabled, model, flushAudio, streamRef, audioCtxRef]);

  return { status, error, loadProgress, lastTranscript };
}
