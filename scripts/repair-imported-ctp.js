const { databaseReady, getDatabase } = require('../backend/database/database');

const all = (database, sql, params = []) => new Promise((resolve, reject) => database.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
const get = (database, sql, params = []) => new Promise((resolve, reject) => database.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));
const run = (database, sql, params = []) => new Promise((resolve, reject) => database.run(sql, params, function done(error) { error ? reject(error) : resolve(this); }));

async function main() {
  await databaseReady;
  const database = getDatabase();
  try {
    let cantor = await get(database, 'SELECT id FROM artists WHERE church_id=? AND name=?', [1, 'Cantor Cristão']);
    if (!cantor) cantor = { id: (await run(database, 'INSERT INTO artists(church_id,name) VALUES(?,?)', [1, 'Cantor Cristão'])).lastID };
    const rows = await all(database, `SELECT m.id,m.title,COALESCE(a.name,'') artist_name FROM music m LEFT JOIN artists a ON a.id=m.artist_id WHERE m.church_id=1 AND m.title NOT LIKE 'CTP %'`);
    let changed = 0;
    for (const row of rows) {
      const title = row.title.trim();
      if (!/^\d/.test(title)) continue;
      const artist = row.artist_name.trim();
      const repairedTitle = /^\d+$/.test(title) && artist ? `CTP ${title} - ${artist}` : `CTP ${title}`;
      await run(database, 'UPDATE music SET title=?, type=?, artist_id=? WHERE id=? AND church_id=?', [repairedTitle, 'HINO', cantor.id, row.id, 1]);
      changed++;
    }
    console.log(`${changed} música(s) numérica(s) corrigida(s) como CTP/HINO.`);
  } finally { database.close(); }
}

main().catch(error => { console.error(error); process.exit(1); });
