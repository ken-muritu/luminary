#!/usr/bin/env node
/**
 * Pre-build Bible import SQL from legacy JSON assets.
 * Run: node scripts/generate-bible-sql.cjs
 */

"use strict";

const fs = require("fs");
const path = require("path");

const SOURCE_DIR = path.join(__dirname, "../legacy/v2/main/assets/bible");
const OUT_DIR = path.join(__dirname, "../public/bible-data");
const TRANSLATIONS = ["kjv", "nkjv", "nlt", "amp"];
const ROWS_PER_CHUNK = 100;

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const code of TRANSLATIONS) {
  const jsonPath = path.join(SOURCE_DIR, `${code}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.warn(`  skip ${code}: missing ${jsonPath}`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(data.verses)) {
    console.warn(`  skip ${code}: invalid format`);
    continue;
  }

  const books = new Map();
  for (const v of data.verses) {
    if (!books.has(v.book_id)) books.set(v.book_id, v.book);
  }

  const lines = [
    `-- Luminary prebuilt import: ${code.toUpperCase()}`,
    `-- translation_id substituted at runtime as __TID__`,
    "",
  ];

  for (const [bookId, name] of books) {
    lines.push(
      `INSERT INTO bible_books (translation_id, name, number) SELECT __TID__, '${escapeSql(name)}', ${bookId} WHERE NOT EXISTS (SELECT 1 FROM bible_books WHERE translation_id = __TID__ AND number = ${bookId});`,
    );
  }

  lines.push("");

  for (let i = 0; i < data.verses.length; i += ROWS_PER_CHUNK) {
    const chunk = data.verses.slice(i, i + ROWS_PER_CHUNK);
    const values = chunk
      .map(
        (v) =>
          `(__TID__,${v.book_id},${v.chapter},${v.verse},'${escapeSql(v.text)}')`,
      )
      .join(",");
    lines.push(
      `INSERT OR IGNORE INTO bible_verses (translation_id, book_id, chapter, verse, text) VALUES ${values};`,
    );
  }

  const sql = `${lines.join("\n")}\n`;
  const outPath = path.join(OUT_DIR, `${code}.import.sql`);
  fs.writeFileSync(outPath, sql);
  const mb = (Buffer.byteLength(sql) / 1024 / 1024).toFixed(2);
  console.log(`  ✓  ${outPath} (${data.verses.length} verses, ${mb} MB)`);
}

console.log("\nDone. Bible SQL written to public/bible-data/");
