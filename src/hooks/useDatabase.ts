import { initDatabase, onBibleImportState } from "@/db/client";
import type { BibleImportState } from "@/db/bible-store";
import { useEffect, useState } from "react";

const isE2E = import.meta.env.VITE_E2E === "1";

const emptyImport: BibleImportState = { active: null, completed: false, failed: [] };

export function useDatabase() {
  const [ready, setReady] = useState(isE2E);
  const [error, setError] = useState<string | null>(null);
  const [bibleImport, setBibleImport] = useState<BibleImportState>(emptyImport);

  useEffect(() => {
    if (isE2E) return;
    return onBibleImportState(setBibleImport);
  }, []);

  useEffect(() => {
    if (isE2E) return;
    initDatabase()
      .then(() => setReady(true))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Database init failed"),
      );
  }, []);

  return { ready, error, bibleImport, bibleSeed: bibleImport.active };
}
