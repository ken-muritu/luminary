import { type SongWithSections, getSong } from "@/db/queries/songs";
import { useServiceStore } from "@/stores/serviceStore";
import { useCallback } from "react";

export function useSongProjection() {
  const setProjection = useServiceStore((s) => s.setProjection);
  const projectCurrent = useServiceStore((s) => s.projectCurrent);
  const isLive = useServiceStore((s) => s.isLive);

  const projectSong = useCallback(
    (song: SongWithSections, sectionIndex: number, sendToOutput = isLive) => {
      const section = song.sections[sectionIndex];
      if (!section) return;
      const subtext = [song.title, section.label].filter(Boolean).join(" — ");
      setProjection(section.content || song.title, subtext);
      if (sendToOutput) projectCurrent();
    },
    [isLive, projectCurrent, setProjection],
  );

  const projectSetlistSong = useCallback(
    async (songId: number, sectionIndex: number, sendToOutput = isLive) => {
      const song = await getSong(songId);
      if (!song) return null;
      projectSong(song, sectionIndex, sendToOutput);
      return song;
    },
    [isLive, projectSong],
  );

  return { projectSong, projectSetlistSong };
}
