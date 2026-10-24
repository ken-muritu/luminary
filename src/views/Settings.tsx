import AudioMeter from "@/components/AudioMeter";
import { ensureBibleTranslation } from "@/db/client";
import { useAudioStream } from "@/hooks/useAudioStream";
import type { BibleTranslation } from "@/lib/constants";
import { useSettingsStore } from "@/stores/settingsStore";

export default function Settings() {
  const settings = useSettingsStore();
  const { level, devices, error: micError } = useAudioStream(true);

  function handleTranslationChange(value: string) {
    settings.update({ defaultTranslation: value });
    void ensureBibleTranslation(value as BibleTranslation);
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-4">General</h2>
        <p className="block text-sm text-[#C8C4D7] mb-1">Default translation</p>
        <select
          value={settings.defaultTranslation}
          onChange={(e) => handleTranslationChange(e.target.value)}
          className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm mb-4"
        >
          {["KJV", "NKJV", "NLT", "AMP"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="block text-sm text-[#C8C4D7] mb-1">Theme</p>
        <select
          value={settings.theme}
          onChange={(e) => settings.update({ theme: e.target.value as "dark" | "light" | "auto" })}
          className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">System</option>
        </select>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Audio</h2>
        <p className="block text-sm text-[#C8C4D7] mb-1">Input device</p>
        <select
          value={settings.audioDeviceId}
          onChange={(e) => settings.update({ audioDeviceId: e.target.value })}
          className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm mb-4"
        >
          <option value="">Default</option>
          {devices.map((d: MediaDeviceInfo) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || "Microphone"}
            </option>
          ))}
        </select>
        <p className="block text-sm text-[#C8C4D7] mb-1">Input gain</p>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={settings.audioGain}
          onChange={(e) => settings.update({ audioGain: Number(e.target.value) })}
          className="w-full mb-4"
        />
        <p className="block text-sm text-[#C8C4D7] mb-1">Input level</p>
        <AudioMeter level={level} />
        {micError && <p className="text-xs text-red-400 mt-2">{micError}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Display</h2>
        <p className="block text-sm text-[#C8C4D7] mb-1">Projection font size</p>
        <input
          type="range"
          min={32}
          max={96}
          value={settings.projectionFontSize}
          onChange={(e) => settings.update({ projectionFontSize: Number(e.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-[#8a8699] mt-1">{settings.projectionFontSize}px</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">AI — Whisper STT</h2>
        <p className="text-xs text-[#8a8699] mb-3">
          Models download on first Go Live (~75–500MB). Runs fully in your browser. When live,
          detected references appear on the Dashboard under{" "}
          <strong className="text-[#C8C4D7]">AI Detected</strong>.
        </p>
        <p className="block text-sm text-[#C8C4D7] mb-1">Whisper model</p>
        <select
          value={settings.aiModel}
          onChange={(e) =>
            settings.update({ aiModel: e.target.value as "tiny" | "base" | "small" })
          }
          className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm mb-4"
        >
          <option value="tiny">Tiny (~75MB) — fastest</option>
          <option value="base">Base (~150MB) — balanced</option>
          <option value="small">Small (~500MB) — most accurate</option>
        </select>
        <p className="block text-sm text-[#C8C4D7] mb-1">
          Detection confidence ({Math.round(settings.aiConfidence * 100)}%)
        </p>
        <input
          type="range"
          min={0.5}
          max={0.99}
          step={0.01}
          value={settings.aiConfidence}
          onChange={(e) => settings.update({ aiConfidence: Number(e.target.value) })}
          className="w-full mb-4"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.aiAutoMode}
            onChange={(e) => settings.update({ aiAutoMode: e.target.checked })}
          />
          Auto-project detected verses during Go Live
        </label>
      </section>
    </div>
  );
}
