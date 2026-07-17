const { databaseReady, getDatabase } = require('../backend/database/database');

async function main() {
  await databaseReady;
  const database = getDatabase();
  database.run(
    `UPDATE music
     SET title = 'CTP ' || title, type = 'HINO'
     WHERE church_id = 1
       AND title GLOB '[0-9]*-*'
       AND title NOT LIKE 'CTP %'`,
    function done(error) {
      if (error) throw error;
      console.log(`${this.changes} hino(s) CTP padronizado(s).`);
      database.close();
    }
  );
}

main().catch(error => { console.error(error); process.exit(1); });
