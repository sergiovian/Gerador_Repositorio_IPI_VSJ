const { databaseReady, getDatabase } = require('../backend/database/database');

async function main() {
  await databaseReady;
  const database = getDatabase();
  database.run('UPDATE artists SET name=? WHERE church_id=? AND name=?', ['Cantai Todos os Povos', 1, 'Cantor Cristão'], function done(error) {
    if (error) throw error;
    console.log(`${this.changes} artista atualizado.`);
    database.close();
  });
}

main().catch(error => { console.error(error); process.exit(1); });
