#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

const [sourcePath, targetPath] = process.argv.slice(2);
if (!sourcePath || !targetPath) {
  console.error('Uso: node scripts/import-catalog-only.js <banco-origem> <banco-destino>');
  process.exit(1);
}

function open(path) {
  return new Promise((resolve, reject) => {
    const database = new sqlite3.Database(path, (error) => error ? reject(error) : resolve(database));
  });
}

function all(database, sql, params = []) {
  return new Promise((resolve, reject) => database.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
}

function get(database, sql, params = []) {
  return new Promise((resolve, reject) => database.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));
}

function run(database, sql, params = []) {
  return new Promise((resolve, reject) => database.run(sql, params, (error) => error ? reject(error) : resolve()));
}

function close(database) {
  return new Promise((resolve, reject) => database.close((error) => error ? reject(error) : resolve()));
}

async function copyRows(source, target, table) {
  const rows = await all(source, `SELECT * FROM ${table}`);
  if (rows.length === 0) return 0;

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => '?').join(', ');
  const statement = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  for (const row of rows) await run(target, statement, columns.map((column) => row[column]));
  return rows.length;
}

async function main() {
  const source = await open(sourcePath);
  const target = await open(targetPath);

  try {
    await run(target, 'PRAGMA foreign_keys = ON');
    const references = await get(target, `
      SELECT
        (SELECT COUNT(*) FROM music_history) +
        (SELECT COUNT(*) FROM repertoire_items) +
        (SELECT COUNT(*) FROM decision_logs WHERE music_id IS NOT NULL) AS total
    `);
    if (references.total > 0) {
      throw new Error('O banco de destino já possui histórico ou repertório vinculado a músicas. A importação foi cancelada para preservar esses dados.');
    }

    await run(target, 'BEGIN IMMEDIATE TRANSACTION');
    try {
      await run(target, 'DELETE FROM music_tags');
      await run(target, 'DELETE FROM music');
      await run(target, 'DELETE FROM artists');
      await run(target, 'DELETE FROM tags');

      const artists = await copyRows(source, target, 'artists');
      const tags = await copyRows(source, target, 'tags');
      const music = await copyRows(source, target, 'music');
      const musicTags = await copyRows(source, target, 'music_tags');

      await run(target, 'COMMIT');
      console.log(JSON.stringify({ artists, tags, music, musicTags }, null, 2));
    } catch (error) {
      await run(target, 'ROLLBACK');
      throw error;
    }
  } finally {
    await close(source);
    await close(target);
  }
}

main().catch((error) => {
  console.error(`Importação cancelada: ${error.message}`);
  process.exit(1);
});
