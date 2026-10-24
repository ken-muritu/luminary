import type { BibleTranslation } from "@/lib/constants";
import type { Database } from "@tursodatabase/database-wasm/vite";
import {
  type BibleImportState,
  type BibleSeedProgress,
  isTranslationLoaded,
  loadBibleTranslation,
  seedMinimalInMemory,
} from "./bible-store";
import { MIGRATION_SQL, SCHEMA_VERSION } from "./schema";
import { sqlRun } from "./sql";

export type { BibleImportState, BibleSeedProgress } from "./bible-store";

type TursoModule = typeof import("@tursodatabase/database-wasm/bundle");

async function loadTurso(): Promise<TursoModule> {
  return import("@tursodatabase/database-wasm/bundle");
}

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

const defaultImportState: BibleImportState = {
  active: null,
  completed: false,
  failed: [],
};

let importState: BibleImportState = { ...defaultImportState };
const importListeners = new Set<(s: BibleImportState) => void>();
const inFlightLoads = new Map<BibleTranslation, Promise<void>>();

function isCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
}

function dbCandidates(): string[] {
  if (import.meta.env.VITE_E2E === "1") return [":memory:"];
  if (isCrossOriginIsolated()) return ["luminary-songs.db", ":memory:"];
  return [":memory:"];
}

function notifyImport(patch: Partial<BibleImportState>) {
  importState = { ...importState, ...patch };
  for (const listener of importListeners) listener(importState);
}

function trackLoadProgress(failed: string[]) {
  return (p: BibleSeedProgress) => {
    if (p.phase === "error") {
      failed.push(`${p.translation}: ${p.message ?? "failed"}`);
      notifyImport({ active: p, failed: [...failed] });
      return;
    }
    notifyImport({ active: p, failed: [...failed], completed: false });
  };
}

export function onBibleImportState(listener: (s: BibleImportState) => void): () => void {
  importListeners.add(listener);
  listener(importState);
  return () => importListeners.delete(listener);
}

/** @deprecated Use onBibleImportState */
export function onBibleSeedProgress(listener: (p: BibleSeedProgress | null) => void): () => void {
  return onBibleImportState((s) => listener(s.active));
}

async function openDatabase(path: string): Promise<Database> {
  const { connect } = await loadTurso();
  const database = await connect(path);
  await database.exec(MIGRATION_SQL);
  await database.exec("PRAGMA foreign_keys = ON");
  await database.exec("PRAGMA busy_timeout = 5000");
  await sqlRun(database, "INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)", [
    "version",
    String(SCHEMA_VERSION),
  ]);
  await sqlRun(database, "INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)", [
    "storage",
    path === ":memory:" ? "memory" : "opfs",
  ]);
  seedMinimalInMemory();
  return database;
}

/** Load Bible JSON into memory (no SQLite import). Safe to call repeatedly. */
export async function ensureBibleTranslation(code: BibleTranslation): Promise<void> {
  await initDatabase();
  if (isTranslationLoaded(code)) return;

  const existing = inFlightLoads.get(code);
  if (existing) return existing;

  const failed: string[] = [...importState.failed];
  const promise = loadBibleTranslation(code, trackLoadProgress(failed))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Load failed";
      failed.push(`${code}: ${message}`);
    })
    .finally(() => {
      inFlightLoads.delete(code);
      notifyImport({ active: null, completed: true, failed: [...failed] });
    });

  inFlightLoads.set(code, promise);
  return promise;
}

export async function initDatabase(): Promise<Database> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let lastError: unknown;
    for (const path of dbCandidates()) {
      try {
        const database = await openDatabase(path);
        db = database;
        return database;
      } catch (error) {
        lastError = error;
        console.warn(`[DB] Failed to open ${path}`, error);
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Database init failed");
  })();

  return initPromise;
}

export function getDatabase(): Database {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}

export async function resetDatabaseForTests(): Promise<void> {
  db = null;
  initPromise = null;
  importState = { ...defaultImportState };
  inFlightLoads.clear();
  const { resetBibleStoreForTests } = await import("./bible-store");
  resetBibleStoreForTests();
}
