import AudioMeter from "@/components/AudioMeter";
import LiveControls from "@/components/LiveControls";
import VerseCard from "@/components/VerseCard";
import { type SongWithSections, getSong, listSongs } from "@/db/queries/songs";
import { ensureBibleTranslation } from "@/db/client";
import type { BibleTranslation } from "@/lib/constants";
import { useAudioStream } from "@/hooks/useAudioStream";
import { useSongProjection } from "@/hooks/useSongProjection";
import { useVerseDetection } from "@/hooks/useVerseDetection";
import { useLiveSTT } from "@/hooks/useLiveSTT";
import { cn } from "@/lib/utils";
import { useServiceStore } from "@/stores/serviceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCallback, useEffect, useState } from "react";

export default function Dashboard() {
  const {
    isLive,
    setlist,
    activeItemId,
    activeSectionIndex,
    projectionText,
    projectionSubtext,
    detectedVerses,
    setProjection,
    projectCurrent,
    blank,
    showLogo,
    toggleFreeze,
    setActiveItem,
    setActiveSectionIndex,
    addSetlistItem,
    removeSetlistItem,
  } = useServiceStore();

  const aiModel = useSettingsStore((s) => s.aiModel);
  const aiAutoMode = useSettingsStore((s) => s.aiAutoMode);
  const defaultTranslation = useSettingsStore((s) => s.defaultTranslation);
  const { level, error: micError, streamRef, ctxRef } = useAudioStream(isLive);
  const { handleTranscript } = useVerseDetection(isLive);
  const { projectSetlistSong, projectSong } = useSongProjection();
  const { statusLabel: sttStatusLabel, error: sttError, lastTranscript } = useLiveSTT({
    enabled: isLive,
    model: aiModel,
    streamRef,
    audioCtxRef: ctxRef,
    onTranscript: handleTranscript,
  });

  const [activeSong, setActiveSong] = useState<SongWithSections | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySongs, setLibrarySongs] = useState<Awaited<ReturnType<typeof listSongs>>>([]);
  const addSongToSetlist = useServiceStore((s) => s.addSongToSetlist);

  useEffect(() => {
    if (!isLive) return;
    void ensureBibleTranslation(defaultTranslation as BibleTranslation);
  }, [isLive, defaultTranslation]);

  const activeItem = setlist.find((item) => item.id === activeItemId) ?? null;

  const loadActiveSong = useCallback(async () => {
    if (!activeItem?.songId) {
      setActiveSong(null);
      return;
    }
    const song = await getSong(activeItem.songId);
    setActiveSong(song);
    if (song) {
      const section = song.sections[activeSectionIndex];
      if (section) {
        setProjection(section.content || song.title, [song.title, section.label].join(" — "));
      }
    }
  }, [activeItem?.songId, activeSectionIndex, setProjection]);

  useEffect(() => {
    void loadActiveSong();
  }, [loadActiveSong]);

  const stepSection = useCallback(
    async (delta: number) => {
      if (!activeItem?.songId || !activeSong) {
        projectCurrent();
        return;
      }
      const next = Math.max(
        0,
        Math.min(activeSong.sections.length - 1, activeSectionIndex + delta),
      );
      setActiveSectionIndex(next);
      projectSong(activeSong, next, isLive);
    },
    [
      activeItem?.songId,
      activeSong,
      activeSectionIndex,
      isLive,
      projectCurrent,
      projectSong,
      setActiveSectionIndex,
    ],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "b" || e.key === "B") blank();
      if (e.key === "l" || e.key === "L") showLogo();
      if (e.key === "f" || e.key === "F") toggleFreeze();
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        void stepSection(1);
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        void stepSection(-1);
      }
      if (e.key === " ") {
        e.preventDefault();
        projectCurrent();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blank, showLogo, toggleFreeze, projectCurrent, stepSection]);

  async function openLibrary() {
    setLibrarySongs(await listSongs());
    setLibraryOpen(true);
  }

  async function activateSetlistItem(itemId: string) {
    const item = setlist.find((i) => i.id === itemId);
    if (!item) return;
    setActiveItem(itemId);
    setActiveSectionIndex(0);

    if (item.songId) {
      const song = await projectSetlistSong(item.songId, 0, isLive);
      setActiveSong(song);
      return;
    }

    setActiveSong(null);
    setProjection(item.title, item.subtitle ?? "");
    if (isLive) projectCurrent();
  }

  return (
    <div className="h-full grid grid-cols-[240px_1fr_260px] gap-0">
      <section className="border-r border-[#2A2931] p-4 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-[#C8C4D7]">Setlist</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs text-[#6c5ce7]"
              onClick={() => void openLibrary()}
            >
              + Song
            </button>
            <button
              type="button"
              className="text-xs text-[#8a8699]"
              onClick={() =>
                addSetlistItem({ type: "blank", title: "Blank slide", subtitle: "Manual item" })
              }
            >
              + Item
            </button>
          </div>
        </div>
        <div className="space-y-1">
          {setlist.length === 0 && (
            <p className="text-sm text-[#8a8699]">Add songs from here or the Songs view.</p>
          )}
          {setlist.map((item) => (
            <div key={item.id} className="flex gap-1">
              <button
                type="button"
                onClick={() => void activateSetlistItem(item.id)}
                className={cn(
                  "flex-1 text-left px-3 py-2 rounded-lg text-sm",
                  activeItemId === item.id ? "bg-[#6c5ce7]" : "bg-[#2A2931] hover:bg-[#3a3844]",
                )}
              >
                <div>{item.title}</div>
                {item.subtitle && <div className="text-xs opacity-70">{item.subtitle}</div>}
                {activeItemId === item.id && activeSong && activeSong.sections.length > 1 && (
                  <div className="text-xs mt-1 opacity-80">
                    Section {activeSectionIndex + 1}/{activeSong.sections.length}
                  </div>
                )}
              </button>
              <button
                type="button"
                aria-label="Remove from setlist"
                onClick={() => removeSetlistItem(item.id)}
                className="px-2 text-[#8a8699] hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <LiveControls
          onBlank={blank}
          onLogo={showLogo}
          onFreeze={toggleFreeze}
          onPrev={() => void stepSection(-1)}
          onNext={() => void stepSection(1)}
        />
      </section>

      <section className="p-6 flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-2xl aspect-video rounded-xl bg-black border border-[#2A2931] flex flex-col items-center justify-center p-8 text-center">
          <p className="text-2xl md:text-4xl font-medium leading-snug whitespace-pre-wrap">
            {projectionText || "Preview"}
          </p>
          {projectionSubtext && (
            <p className="text-lg text-[#C8C4D7] mt-4 opacity-80">{projectionSubtext}</p>
          )}
        </div>
        {isLive && (
          <div className="w-full max-w-md space-y-2">
            <p className="text-xs text-[#8a8699]">
              Speech: {sttStatusLabel}
              {aiAutoMode && " · auto-project on"}
            </p>
            {lastTranscript && (
              <p className="text-xs text-[#8a8699] line-clamp-2">Heard: {lastTranscript}</p>
            )}
            <AudioMeter level={level} />
            {(micError || sttError) && (
              <p className="text-xs text-red-400">{micError ?? sttError}</p>
            )}
          </div>
        )}
      </section>

      <section className="border-l border-[#2A2931] p-4 overflow-y-auto">
        <h2 className="text-xs uppercase tracking-widest text-[#C8C4D7] mb-3">AI Detected</h2>
        <div className="space-y-2">
          {detectedVerses.length === 0 && (
            <p className="text-sm text-[#8a8699]">
              {isLive
                ? "Verses the preacher mentions appear here."
                : "Go Live to enable verse detection."}
            </p>
          )}
          {detectedVerses.map((v) => (
            <VerseCard
              key={v.reference}
              verse={v}
              onProject={() => {
                setProjection(v.text ?? v.reference, v.reference);
                projectCurrent();
              }}
            />
          ))}
        </div>
      </section>

      {libraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl bg-[#1B1B22] border border-[#3a3844] p-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Add song to setlist</h3>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="text-[#8a8699]"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto space-y-1 flex-1">
              {librarySongs.length === 0 && (
                <p className="text-sm text-[#8a8699]">No saved songs. Create one in Songs first.</p>
              )}
              {librarySongs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    addSongToSetlist(song.id, song.title, song.artist || undefined);
                    setLibraryOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#2A2931] hover:bg-[#3a3844] text-sm"
                >
                  {song.title}
                  {song.artist && (
                    <span className="text-xs text-[#8a8699] ml-2">{song.artist}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
