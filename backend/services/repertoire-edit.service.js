const db = require('../models/db.model');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');

const validId = value => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Identificador inválido.', 400);
  return id;
};

async function replaceItems(repertoireId, items) {
  const churchId = getCurrentChurchId();
  const id = validId(repertoireId);
  if (!Array.isArray(items) || !items.length) throw new AppError('Informe as músicas do repertório.', 400);
  const repertoire = await db.get('SELECT * FROM repertoires WHERE id=? AND church_id=?', [id, churchId]);
  if (!repertoire) throw new AppError('Repertório não encontrado.', 404);
  if (!['DRAFT', 'CONFIRMED'].includes(repertoire.status)) throw new AppError('Repertórios já executados não podem ser alterados.', 409);

  const used = new Set();
  const positions = new Set();
  for (const item of items) {
    const musicId = validId(item.music_id);
    const position = validId(item.position);
    if (used.has(musicId) || positions.has(position)) throw new AppError('Não repita músicas ou posições.', 409);
    used.add(musicId); positions.add(position);
    const music = await db.get('SELECT id FROM music WHERE id=? AND church_id=? AND active=1', [musicId, churchId]);
    if (!music) throw new AppError('Uma das músicas não está disponível na biblioteca.', 400);
  }

  await db.transaction(async () => {
    await db.run('DELETE FROM repertoire_items WHERE repertoire_id=?', [id]);
    for (const item of items) await db.run(
      'INSERT INTO repertoire_items(repertoire_id,music_id,position,role,score,reasons_json,warnings_json) VALUES(?,?,?,?,?,?,?)',
      [id, validId(item.music_id), validId(item.position), item.role || 'LOUVOR', item.score || 0, JSON.stringify(item.reasons || []), JSON.stringify(item.warnings || [])]
    );
  });
  return { id, changed: true };
}

async function reopen(repertoireId) {
  const churchId = getCurrentChurchId();
  const id = validId(repertoireId);
  const repertoire = await db.get('SELECT * FROM repertoires WHERE id=? AND church_id=?', [id, churchId]);
  if (!repertoire) throw new AppError('Repertório não encontrado.', 404);
  if (repertoire.status !== 'EXECUTED') throw new AppError('Somente repertórios executados precisam ser reabertos.', 409);
  await db.transaction(async () => {
    await db.run("DELETE FROM music_history WHERE church_id=? AND service_id=? AND origin='AUTOMATIC'", [churchId, repertoire.service_id]);
    await db.run("UPDATE repertoires SET status='DRAFT' WHERE id=?", [id]);
    await db.run("UPDATE services SET status='PLANNED' WHERE id=? AND church_id=?", [repertoire.service_id, churchId]);
  });
  return { id, reopened: true };
}

module.exports = { replaceItems, reopen };
