import AudioMeter from "@/components/AudioMeter";
import { useAudioStream } from "@/hooks/useAudioStream";
import { useSettingsStore } from "@/stores/settingsStore";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function Onboarding() {
  const { defaultTranslation, update, completeOnboarding } = useSettingsStore();
  const { level, devices } = useAudioStream(true);
  const [params] = useSearchParams();
  const fromSignup = params.get("welcome") === "1";
  const name = params.get("name");

  useEffect(() => {
    if (fromSignup) {
      document.title = "Welcome — Luminary";
    }
  }, [fromSignup]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13131a] p-6">
      <div className="max-w-lg w-full space-y-6 rounded-2xl border border-[#2A2931] bg-[#1B1B22] p-8">
        <div>
          <h1 className="text-2xl font-bold text-[#6c5ce7]">
            {fromSignup && name ? `Welcome, ${name}` : "Welcome to Luminary v3"}
          </h1>
          <p className="text-[#C8C4D7] mt-2">
            Luminary projects Bible verses and lyrics during worship services — offline-first, in
            your browser or on any display.
          </p>
          {fromSignup && (
            <p className="text-xs text-[#8a8699] mt-2">
              Your account is ready. Complete setup below to start projecting.
            </p>
          )}
        </div>

        <section>
          <h2 className="font-medium mb-2">Audio setup</h2>
          <select
            className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm mb-2"
            onChange={(e) => update({ audioDeviceId: e.target.value })}
          >
            <option value="">Default microphone</option>
            {devices.map((d: MediaDeviceInfo) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Microphone"}
              </option>
            ))}
          </select>
          <AudioMeter level={level} />
        </section>

        <section>
          <h2 className="font-medium mb-2">Default Bible translation</h2>
          <select
            value={defaultTranslation}
            onChange={(e) => update({ defaultTranslation: e.target.value })}
            className="w-full rounded-lg bg-[#2A2931] px-3 py-2 text-sm"
          >
            {["KJV", "NKJV", "NLT", "AMP"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </section>

        <button type="button" onClick={completeOnboarding} className="btn-primary w-full">
          Get started
        </button>
      </div>
    </div>
  );
}
