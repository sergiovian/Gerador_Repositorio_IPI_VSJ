const { databaseReady, getDatabase } = require('../backend/database/database');

function all(sql, parameters = []) {
  return new Promise((resolve, reject) => getDatabase().all(sql, parameters, (error, rows) => error ? reject(error) : resolve(rows)));
}

function run(sql, parameters = []) {
  return new Promise((resolve, reject) => getDatabase().run(sql, parameters, function (error) {
    if (error) return reject(error);
    resolve(this.changes);
  }));
}

async function main() {
  await databaseReady;
  const music = await all(`SELECT m.id, m.title, COALESCE(a.name, '') AS artist
    FROM music m LEFT JOIN artists a ON a.id = m.artist_id
    WHERE m.church_id = 1 AND (m.lyrics_url IS NULL OR trim(m.lyrics_url) = '')`);

  for (const item of music) {
    const terms = `${item.title} ${item.artist}`.trim();
    await run('UPDATE music SET lyrics_url = ? WHERE id = ? AND church_id = 1', [`https://www.letras.mus.br/?q=${encodeURIComponent(terms)}`, item.id]);
  }

  console.log(`${music.length} links de letras salvos para a IPIVSJ.`);
  getDatabase().close();
}

main().catch((error) => { console.error(error); process.exit(1); });
