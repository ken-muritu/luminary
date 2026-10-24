import { useSettingsStore } from "@/stores/settingsStore";
import { useEffect, useRef, useState } from "react";

function audioConstraints(deviceId: string): MediaTrackConstraints {
  if (!deviceId) return { echoCancellation: true, noiseSuppression: true };
  return { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true };
}

export function useAudioStream(active: boolean) {
  const deviceId = useSettingsStore((s) => s.audioDeviceId);
  const gain = useSettingsStore((s) => s.audioGain);
  const [level, setLevel] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      setError(null);
      const stream = streamRef.current;
      if (stream) {
        for (const t of stream.getTracks()) t.stop();
      }
      streamRef.current = null;
      void ctxRef.current?.close();
      ctxRef.current = null;
      return;
    }

    let raf = 0;
    let cancelled = false;

    async function start() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setDevices(list.filter((d) => d.kind === "audioinput"));

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints(deviceId),
        });
        if (cancelled) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }

        streamRef.current = stream;
        const ctx = new AudioContext({ sampleRate: 16000 });
        ctxRef.current = ctx;
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        const gainNode = ctx.createGain();
        gainNode.gain.value = gain;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(gainNode);
        gainNode.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setLevel(Math.min(100, Math.round((avg / 255) * 100)));
          raf = requestAnimationFrame(tick);
        };
        tick();
        setError(null);
      } catch (err) {
        setLevel(0);
        setError(err instanceof Error ? err.message : "Microphone access denied");
      }
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      const stream = streamRef.current;
      if (stream) {
        for (const t of stream.getTracks()) t.stop();
      }
      streamRef.current = null;
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [active, deviceId, gain]);

  return { level, devices, error, streamRef, ctxRef };
}
