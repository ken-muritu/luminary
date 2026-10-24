import { ensureBibleTranslation } from "@/db/client";
import { getVerse as getVerseFromStore } from "@/db/bible-store";
import type { BibleTranslation } from "@/lib/constants";
import { detectVerse } from "@/lib/verse-detector";
import { useServiceStore } from "@/stores/serviceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCallback } from "react";

export function useVerseDetection(enabled: boolean) {
  const addDetectedVerse = useServiceStore((s) => s.addDetectedVerse);
  const setProjection = useServiceStore((s) => s.setProjection);
  const projectCurrent = useServiceStore((s) => s.projectCurrent);
  const defaultTranslation = useSettingsStore((s) => s.defaultTranslation);
  const aiConfidence = useSettingsStore((s) => s.aiConfidence);
  const aiAutoMode = useSettingsStore((s) => s.aiAutoMode);

  const handleTranscript = useCallback(
    async (text: string) => {
      if (!enabled || !text.trim()) return;

      const code = defaultTranslation as BibleTranslation;
      let match = detectVerse(text, code);

      if (!match || match.confidence < aiConfidence) return;

      try {
        await ensureBibleTranslation(code);
        const verse = getVerseFromStore(code, match.bookId, match.chapter, match.verse);
        if (verse) {
          match = { ...match, text: verse.text };
        }
      } catch {
        // Bible still loading — show reference from transcript
      }

      addDetectedVerse(match);

      if (aiAutoMode && match.text) {
        setProjection(match.text, match.reference);
        projectCurrent();
      }
    },
    [
      enabled,
      defaultTranslation,
      aiConfidence,
      aiAutoMode,
      addDetectedVerse,
      setProjection,
      projectCurrent,
    ],
  );

  return { handleTranscript };
}
