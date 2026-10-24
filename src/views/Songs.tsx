import {
  type Song,
  type SongWithSections,
  createSong,
  createSongSection,
  deleteSong,
  deleteSongSection,
  getSong,
  listSongs,
  updateSong,
  updateSongSection,
} from "@/db/queries/songs";
import { useSongProjection } from "@/hooks/useSongProjection";
import { useServiceStore } from "@/stores/serviceStore";
import { useCallback, useEffect, useState } from "react";

export default function Songs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [current, setCurrent] = useState<SongWithSections | null>(null);
  const [previewSection, setPreviewSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSongToSetlist = useServiceStore((s) => s.addSongToSetlist);
  const { projectSong } = useSongProjection();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const refresh = useCallback(async () => {
    try {
      setSongs(await listSongs(debouncedSearch));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load songs");
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (selectedId == null) {
      setCurrent(null);
      return;
    }
    void getSong(selectedId)
      .then((song) => {
        setCurrent(song);
        setPreviewSection(0);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load song");
      });
  }, [selectedId]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const id = await createSong({
        title: "Untitled Song",
        sections: [{ label: "Verse 1", content: "" }],
      });
      await refresh();
      setSelectedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create song");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      await updateSong(current.id, {
        title: current.title,
        artist: current.artist,
        ccli_number: current.ccli_number,
        copyright: current.copyright,
      });
      for (const section of current.sections) {
        await updateSongSection(section.id, { label: section.label, content: section.content });
      }
      const updated = await getSong(current.id);
      setCurrent(updated);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save song");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!current || !confirm("Delete this song?")) return;
    try {
      setError(null);
      await deleteSong(current.id);
      setSelectedId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete song");
    }
  }

  async function handleAddSection() {
    if (!current) return;
    const label = `Section ${current.sections.length + 1}`;
    try {
      setError(null);
      const sectionId = await createSongSection(current.id, { label, content: "" });
      const updated = await getSong(current.id);
      setCurrent(updated);
      setPreviewSection(updated?.sections.findIndex((s) => s.id === sectionId) ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add section");
    }
  }

  async function handleRemoveSection(sectionId: number) {
    if (!current || current.sections.length <= 1) return;
    if (!confirm("Remove this section?")) return;
    try {
      setError(null);
      await deleteSongSection(sectionId);
      const updated = await getSong(current.id);
      setCurrent(updated);
      setPreviewSection(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove section");
    }
  }

  function handleAddToSetlist() {
    if (!current) return;
    addSongToSetlist(current.id, current.title, current.artist || undefined);
  }

  function handleProject() {
    if (!current) return;
    projectSong(current, previewSection, true);
  }

  const preview = current?.sections[previewSection];

  return (
    <div className="h-full grid grid-cols-[280px_1fr_320px]">
      <aside className="border-r border-[#2A2931] p-4 flex flex-col gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs…"
          className="w-full rounded-lg bg-[#2A2931] border border-[#3a3844] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={creating}
          className="btn-primary"
        >
          {creating ? "Creating…" : "New Song"}
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {songs.map((song) => (
            <button
              key={song.id}
              type="button"
              onClick={() => setSelectedId(song.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                selectedId === song.id ? "bg-[#6c5ce7]" : "bg-[#2A2931] hover:bg-[#3a3844]"
              }`}
            >
              <div className="font-medium">{song.title}</div>
              {song.artist && <div className="text-xs text-[#C8C4D7]">{song.artist}</div>}
            </button>
          ))}
        </div>
      </aside>

      <section className="p-6 overflow-y-auto">
        {error && (
          <p className="mb-4 text-sm text-red-400 rounded-lg bg-red-400/10 px-3 py-2">{error}</p>
        )}
        {!current ? (
          <div className="text-[#8a8699] space-y-2">
            <p>Select a song from the list, or click <strong className="text-[#C8C4D7]">New Song</strong> to open the editor.</p>
            <p className="text-xs">Add title, artist, and lyrics by section — then Save, Project, or add to your setlist.</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            <input
              value={current.title}
              onChange={(e) => setCurrent({ ...current, title: e.target.value })}
              className="w-full text-2xl font-semibold bg-transparent border-b border-[#2A2931] pb-2 outline-none"
            />
            <input
              value={current.artist ?? ""}
              onChange={(e) => setCurrent({ ...current, artist: e.target.value })}
              placeholder="Artist"
              className="w-full bg-[#2A2931] rounded-lg px-3 py-2 text-sm"
            />
            {current.sections.map((section, index) => (
              <div key={section.id} className="rounded-lg border border-[#2A2931] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={section.label}
                    onChange={(e) =>
                      setCurrent({
                        ...current,
                        sections: current.sections.map((s) =>
                          s.id === section.id ? { ...s, label: e.target.value } : s,
                        ),
                      })
                    }
                    className="text-xs uppercase tracking-widest text-[#6c5ce7] bg-transparent outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewSection(index)}
                    className={`text-xs px-2 py-0.5 rounded ${
                      previewSection === index ? "bg-[#6c5ce7]" : "bg-[#2A2931]"
                    }`}
                  >
                    Preview
                  </button>
                  {current.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveSection(section.id)}
                      className="text-xs text-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  value={section.content}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      sections: current.sections.map((s) =>
                        s.id === section.id ? { ...s, content: e.target.value } : s,
                      ),
                    })
                  }
                  rows={4}
                  placeholder="Lyrics for this section…"
                  className="w-full rounded-lg bg-[#2A2931] border border-[#3a3844] px-3 py-2 text-sm"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => void handleAddSection()}
              className="text-sm text-[#6c5ce7]"
            >
              + Add section
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => void handleDelete()} className="btn-danger">
                Delete
              </button>
              <button type="button" onClick={handleAddToSetlist} className="ctrl-btn">
                Add to setlist
              </button>
              <button type="button" onClick={handleProject} className="ctrl-btn">
                Project section
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="border-l border-[#2A2931] p-4">
        <h3 className="text-xs uppercase tracking-widest text-[#C8C4D7] mb-3">Preview</h3>
        {preview ? (
          <div className="rounded-xl bg-black border border-[#2A2931] p-6 text-center min-h-[200px] flex flex-col items-center justify-center gap-2">
            <p className="text-xs text-[#8a8699]">{preview.label}</p>
            <p className="text-lg whitespace-pre-wrap">{preview.content || "…"}</p>
          </div>
        ) : (
          <p className="text-sm text-[#8a8699]">Add lyrics to preview.</p>
        )}
      </aside>
    </div>
  );
}
