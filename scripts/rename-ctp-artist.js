const { databaseReady, getDatabase } = require('../backend/database/database');

async function main() {
  await databaseReady;
  const database = getDatabase();
  database.get('SELECT id FROM artists WHERE church_id=? AND name=?', [1, 'Cantai Todos os Povos'], (targetError, target) => {
    if (targetError) throw targetError;
    database.get('SELECT id FROM artists WHERE church_id=? AND name=?', [1, 'Cantor Cristão'], (sourceError, source) => {
      if (sourceError) throw sourceError;
      if (!source) { console.log('Nenhum artista Cantor Cristão para atualizar.'); database.close(); return; }
      const targetId = target?.id;
      if (!targetId) { database.run('UPDATE artists SET name=? WHERE id=?', ['Cantai Todos os Povos', source.id], finish); return; }
      database.run('UPDATE music SET artist_id=? WHERE artist_id=?', [targetId, source.id], moveError => {
        if (moveError) throw moveError;
        database.run('DELETE FROM artists WHERE id=?', [source.id], finish);
      });
    });
  });
  function finish(error) { if (error) throw error; console.log('Hinos CTP associados a Cantai Todos os Povos.'); database.close(); }
}

main().catch(error => { console.error(error); process.exit(1); });
