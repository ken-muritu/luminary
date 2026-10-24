import {
  closeProjectionWindow,
  openProjectionWindow,
  projectBlank,
  projectFreeze,
  projectLogo,
  projectSlide,
} from "@/lib/projection";
import { resetVerseDetector } from "@/lib/verse-detector";
import type { VerseMatch } from "@/lib/verse-detector";
import { useSettingsStore } from "@/stores/settingsStore";
import { create } from "zustand";

function projectWithSettings(text: string, subtext?: string) {
  const { projectionFontFamily, projectionFontSize } = useSettingsStore.getState();
  projectSlide(text, subtext, projectionFontFamily, projectionFontSize);
}

export interface SetlistItem {
  id: string;
  type: "song" | "verse" | "blank" | "logo";
  title: string;
  subtitle?: string;
  songId?: number;
  verseRef?: string;
}

interface ServiceState {
  isLive: boolean;
  isBlackout: boolean;
  isFrozen: boolean;
  projectionText: string;
  projectionSubtext: string;
  setlist: SetlistItem[];
  activeItemId: string | null;
  activeSectionIndex: number;
  detectedVerses: VerseMatch[];
  goLive: () => Promise<void>;
  endLive: () => void;
  setProjection: (text: string, subtext?: string) => void;
  projectCurrent: () => void;
  blank: () => void;
  showLogo: () => void;
  toggleFreeze: () => void;
  addSetlistItem: (item: Omit<SetlistItem, "id">) => void;
  addSongToSetlist: (songId: number, title: string, artist?: string) => void;
  removeSetlistItem: (id: string) => void;
  setActiveItem: (id: string | null) => void;
  setActiveSectionIndex: (index: number) => void;
  addDetectedVerse: (verse: VerseMatch) => void;
  clearDetectedVerses: () => void;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  isLive: false,
  isBlackout: false,
  isFrozen: false,
  projectionText: "",
  projectionSubtext: "",
  setlist: [],
  activeItemId: null,
  activeSectionIndex: 0,
  detectedVerses: [],

  goLive: async () => {
    await openProjectionWindow();
    set({ isLive: true, isBlackout: false });
    const { projectionText, projectionSubtext } = get();
    if (projectionText.trim()) projectWithSettings(projectionText, projectionSubtext);
  },

  endLive: () => {
    closeProjectionWindow();
    resetVerseDetector();
    set({ isLive: false, isBlackout: false, isFrozen: false, detectedVerses: [] });
  },

  setProjection: (text, subtext = "") => set({ projectionText: text, projectionSubtext: subtext }),

  projectCurrent: () => {
    const { projectionText, projectionSubtext } = get();
    if (projectionText.trim()) {
      projectWithSettings(projectionText, projectionSubtext);
      set({ isBlackout: false });
    }
  },

  blank: () => {
    projectBlank();
    set({ isBlackout: true });
  },

  showLogo: () => {
    projectLogo();
    set({ isBlackout: false });
  },

  toggleFreeze: () => {
    projectFreeze();
    set((s) => ({ isFrozen: !s.isFrozen }));
  },

  addSetlistItem: (item) =>
    set((s) => ({
      setlist: [...s.setlist, { ...item, id: crypto.randomUUID() }],
    })),

  addSongToSetlist: (songId, title, artist) =>
    set((s) => ({
      setlist: [
        ...s.setlist,
        {
          id: crypto.randomUUID(),
          type: "song",
          title,
          subtitle: artist,
          songId,
        },
      ],
    })),

  removeSetlistItem: (id) =>
    set((s) => ({
      setlist: s.setlist.filter((item) => item.id !== id),
      activeItemId: s.activeItemId === id ? null : s.activeItemId,
    })),

  setActiveItem: (id) => set({ activeItemId: id, activeSectionIndex: 0 }),

  setActiveSectionIndex: (index) => set({ activeSectionIndex: index }),

  addDetectedVerse: (verse) =>
    set((s) => ({
      detectedVerses: [
        verse,
        ...s.detectedVerses.filter((v) => v.reference !== verse.reference),
      ].slice(0, 8),
    })),

  clearDetectedVerses: () => set({ detectedVerses: [] }),
}));
