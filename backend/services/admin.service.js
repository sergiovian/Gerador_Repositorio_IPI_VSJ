const db = require('../models/db.model');
const AppError = require('../utils/app-error');

async function listChurches() {
  return db.all(`SELECT c.id,c.name,c.city,c.state,c.active,c.created_at,
    COUNT(DISTINCT u.id) AS users_count, COUNT(DISTINCT m.id) AS music_count
    FROM churches c LEFT JOIN users u ON u.church_id=c.id LEFT JOIN music m ON m.church_id=c.id
    GROUP BY c.id ORDER BY c.name COLLATE NOCASE`);
}

async function setChurchActive(id, active) {
  const churchId = Number(id);
  if (!Number.isInteger(churchId) || churchId < 1) throw new AppError('Igreja inválida.', 400);
  if (churchId === 1 && !active) throw new AppError('A igreja administradora não pode ser desativada.', 409);
  const result = await db.run('UPDATE churches SET active=? WHERE id=?', [active ? 1 : 0, churchId]);
  if (!result.changes) throw new AppError('Igreja não encontrada.', 404);
  return db.get('SELECT id,name,active FROM churches WHERE id=?', [churchId]);
}

module.exports = { listChurches, setChurchActive };
