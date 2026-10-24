import type { Database } from "@tursodatabase/database-wasm/vite";

export async function sqlRun(db: Database, sql: string, params: unknown[] = []) {
  const stmt = await db.prepare(sql);
  try {
    return await stmt.run(params);
  } finally {
    await stmt.close();
  }
}

export async function sqlGet<T = Record<string, unknown>>(
  db: Database,
  sql: string,
  params: unknown[] = [],
): Promise<T | undefined> {
  const stmt = await db.prepare(sql);
  try {
    return (await stmt.get(params)) as T | undefined;
  } finally {
    await stmt.close();
  }
}

export async function sqlAll<T = Record<string, unknown>>(
  db: Database,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const stmt = await db.prepare(sql);
  try {
    return (await stmt.all(params)) as T[];
  } finally {
    await stmt.close();
  }
}
