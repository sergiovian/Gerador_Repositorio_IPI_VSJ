const { databaseReady, getDatabase } = require('../backend/database/database');

function get(database, sql, parameters = []) {
  return new Promise((resolve, reject) => database.get(sql, parameters, (error, row) => error ? reject(error) : resolve(row)));
}

function run(database, sql, parameters = []) {
  return new Promise((resolve, reject) => database.run(sql, parameters, function callback(error) {
    if (error) return reject(error);
    resolve(this);
  }));
}

async function main() {
  await databaseReady;
  const database = getDatabase();
  try {
    let artist = await get(database, 'SELECT id FROM artists WHERE church_id = 1 AND name = ?', ['Cantor Cristão']);
    if (!artist) artist = { id: (await run(database, 'INSERT INTO artists(church_id,name) VALUES(?,?)', [1, 'Cantor Cristão'])).lastID };
    const result = await run(database, `UPDATE music SET artist_id = ? WHERE church_id = 1 AND title LIKE 'CTP %' AND artist_id IS NULL`, [artist.id]);
    console.log(`${result.changes} hino(s) CTP associado(s) a Cantor Cristão.`);
  } finally {
    database.close();
  }
}

main().catch(error => { console.error(error); process.exit(1); });
