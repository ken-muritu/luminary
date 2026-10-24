#!/usr/bin/env node
/**
 * Seed Luminary v3 schema + full Bible on Turso cloud.
 * Usage: node scripts/seed-turso.cjs [--reset]
 *
 * Credentials: LUMINARY_TURSO_URL + LUMINARY_TURSO_AUTH_TOKEN,
 * or auto-resolved via turso CLI for luminary-db.
 */

"use strict";

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DB_NAME = process.env.LUMINARY_TURSO_DB_NAME || "luminary-db";
const TRANSLATIONS = ["KJV", "NKJV", "NLT", "AMP"];
const FULL_BIBLE_MIN_VERSES = 28_000;
const ROWS_PER_INSERT = 100;
const RESET = process.argv.includes("--reset");

const LEGACY_TABLES = [
  "bible_verses_fts",
  "bible_verses_fts_config",
  "bible_verses_fts_data",
  "bible_verses_fts_docsize",
  "bible_verses_fts_idx",
  "songs_fts",
  "songs_fts_config",
  "songs_fts_data",
  "songs_fts_docsize",
  "songs_fts_idx",
  "setlist_items",
  "song_sections",
  "song_usage_log",
  "bible_verses",
  "bible_books",
  "bible_translations",
  "songs",
  "setlists",
  "media_assets",
  "settings",
];

function loadMigrationSql() {
  const schemaPath = path.join(__dirname, "../src/db/schema.ts");
  const source = fs.readFileSync(schemaPath, "utf8");
  const match = source.match(/export const MIGRATION_SQL = `([\s\S]*?)`;/);
  if (!match) throw new Error("Could not read MIGRATION_SQL from src/db/schema.ts");
  return match[1];
}

function loadSchemaVersion() {
  const schemaPath = path.join(__dirname, "../src/db/schema.ts");
  const source = fs.readFileSync(schemaPath, "utf8");
  const match = source.match(/export const SCHEMA_VERSION = (\d+);/);
  if (!match) throw new Error("Could not read SCHEMA_VERSION");
  return Number(match[1]);
}

function getCredentials() {
  let url = process.env.LUMINARY_TURSO_URL?.trim();
  let token = process.env.LUMINARY_TURSO_AUTH_TOKEN?.trim();

  if (!url || !token) {
    if (!commandExists("turso")) {
      throw new Error(
        "Set LUMINARY_TURSO_URL and LUMINARY_TURSO_AUTH_TOKEN, or install turso CLI",
      );
    }
    url = execSync(`turso db show ${DB_NAME} --url`, { encoding: "utf8" }).trim();
    token = execSync(`turso db tokens create ${DB_NAME}`, { encoding: "utf8" }).trim();
  }

  return { url, token };
}

function commandExists(name) {
  try {
    execSync(`command -v ${name}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function parseSqlStatements(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function tableExists(client, name) {
  const result = await client.execute({
    sql: "SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name = ? LIMIT 1",
    args: [name],
  });
  return result.rows.length > 0;
}

async function ensureV3Schema(client) {
  const hasV3 = await tableExists(client, "schema_meta");
  const hasLegacyVerses =
    (await tableExists(client, "bible_verses")) &&
    !(await tableExists(client, "schema_meta"));

  if (hasV3 && !RESET) {
    console.log("v3 schema already present");
    return;
  }

  if (hasLegacyVerses || RESET) {
    console.log(RESET ? "Resetting database…" : "Migrating legacy schema to v3…");
    await client.execute("PRAGMA foreign_keys = OFF");
    for (const table of LEGACY_TABLES) {
      await client.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    await client.execute("PRAGMA foreign_keys = ON");
  }

  const migrationSql = loadMigrationSql();
  for (const statement of parseSqlStatements(migrationSql)) {
    await client.execute(statement);
  }

  const version = loadSchemaVersion();
  await client.execute({
    sql: "INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)",
    args: ["version", String(version)],
  });
  await client.execute({
    sql: "INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)",
    args: ["storage", "turso-cloud"],
  });
  console.log(`v3 schema applied (version ${version})`);
}

async function getTranslationId(client, code) {
  const existing = await client.execute({
    sql: "SELECT id FROM bible_translations WHERE abbreviation = ?",
    args: [code],
  });
  if (existing.rows[0]?.id != null) return Number(existing.rows[0].id);

  await client.execute({
    sql: "INSERT INTO bible_translations (name, abbreviation) VALUES (?, ?)",
    args: [code, code],
  });
  const created = await client.execute({
    sql: "SELECT id FROM bible_translations WHERE abbreviation = ?",
    args: [code],
  });
  return Number(created.rows[0].id);
}

async function verseCount(client, translationId) {
  const result = await client.execute({
    sql: "SELECT COUNT(*) AS count FROM bible_verses WHERE translation_id = ?",
    args: [translationId],
  });
  return Number(result.rows[0]?.count ?? 0);
}

async function importTranslation(client, code, translationId) {
  const sqlPath = path.join(__dirname, `../public/bible-data/${code.toLowerCase()}.import.sql`);
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Missing ${sqlPath} — run: npm run bible:sql`);
  }

  const raw = fs.readFileSync(sqlPath, "utf8").replaceAll("__TID__", String(translationId));
  const statements = parseSqlStatements(raw);
  console.log(`  importing ${code} (${statements.length} statements)…`);

  for (let i = 0; i < statements.length; i++) {
    await client.execute(statements[i]);
    if ((i + 1) % 25 === 0 || i === statements.length - 1) {
      process.stdout.write(`\r  ${code}: ${i + 1}/${statements.length} batches`);
    }
  }
  process.stdout.write("\n");

  const count = await verseCount(client, translationId);
  if (count < FULL_BIBLE_MIN_VERSES) {
    throw new Error(`${code} incomplete after import (${count} verses)`);
  }
  console.log(`  ✓ ${code}: ${count.toLocaleString()} verses`);
}

async function main() {
  const { createClient } = await import("@libsql/client");
  const { url, token } = getCredentials();
  const client = createClient({ url, authToken: token });

  console.log(`Connected to ${url}`);
  await ensureV3Schema(client);

  for (const code of TRANSLATIONS) {
    const translationId = await getTranslationId(client, code);
    const existing = await verseCount(client, translationId);
    if (existing >= FULL_BIBLE_MIN_VERSES && !RESET) {
      console.log(`${code} already complete (${existing.toLocaleString()} verses)`);
      continue;
    }

    if (existing > 0 && existing < FULL_BIBLE_MIN_VERSES) {
      await client.execute({
        sql: "DELETE FROM bible_verses WHERE translation_id = ?",
        args: [translationId],
      });
    }

    await importTranslation(client, code, translationId);
  }

  console.log("\nTurso seed complete.");
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
