import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppSettings {
  defaultTranslation: string;
  theme: "dark" | "light" | "auto";
  audioDeviceId: string;
  audioGain: number;
  projectionFontFamily: string;
  projectionFontSize: number;
  aiModel: "tiny" | "base" | "small";
  aiConfidence: number;
  aiAutoMode: boolean;
  onboarded: boolean;
}

interface SettingsState extends AppSettings {
  update: (patch: Partial<AppSettings>) => void;
  completeOnboarding: () => void;
}

const defaults: AppSettings = {
  defaultTranslation: "KJV",
  theme: "dark",
  audioDeviceId: "",
  audioGain: 1,
  projectionFontFamily: "Inter",
  projectionFontSize: 48,
  aiModel: "tiny",
  aiConfidence: 0.85,
  aiAutoMode: false,
  onboarded: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      update: (patch) => set((s) => ({ ...s, ...patch })),
      completeOnboarding: () => set({ onboarded: true }),
    }),
    { name: "luminary-settings-v3" },
  ),
);
