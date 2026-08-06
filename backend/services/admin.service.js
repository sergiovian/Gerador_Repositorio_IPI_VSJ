const db = require('../models/db.model');
const AppError = require('../utils/app-error');

async function listChurches() {
  return db.all(`SELECT c.id,c.name,c.city,c.state,c.logo_file IS NOT NULL AS has_logo,c.active,c.created_at,
    COUNT(DISTINCT u.id) AS users_count, COUNT(DISTINCT m.id) AS music_count
    FROM churches c LEFT JOIN users u ON u.church_id=c.id LEFT JOIN music m ON m.church_id=c.id
    GROUP BY c.id ORDER BY c.name COLLATE NOCASE`);
}

async function updateChurch(id, data) {
  const churchId = Number(id);
  if (!Number.isInteger(churchId) || churchId < 1) throw new AppError('Igreja inválida.', 400);
  const name = String(data.name || '').trim();
  const city = String(data.city || '').trim();
  const state = String(data.state || '').trim();
  if (!name) throw new AppError('Informe o nome da igreja.', 400);
  if (name.length > 140 || city.length > 100 || state.length > 40) throw new AppError('Os dados da igreja excedem o tamanho permitido.', 400);
  const result = await db.run('UPDATE churches SET name=?,city=?,state=? WHERE id=?', [name, city || null, state || null, churchId]);
  if (!result.changes) throw new AppError('Igreja não encontrada.', 404);
  return db.get('SELECT id,name,city,state,active FROM churches WHERE id=?', [churchId]);
}

async function listUsers(churchIdValue) {
  const churchId = Number(churchIdValue);
  if (!Number.isInteger(churchId) || churchId < 1) throw new AppError('Igreja inválida.', 400);
  return db.all('SELECT id,name,email,username,role,active,created_at FROM users WHERE church_id=? ORDER BY name COLLATE NOCASE', [churchId]);
}

async function updateUser(id, data) {
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId < 1) throw new AppError('Usuário inválido.', 400);
  const user = await db.get('SELECT id,church_id,role FROM users WHERE id=?', [userId]);
  if (!user) throw new AppError('Usuário não encontrado.', 404);
  if (user.role === 'SUPER_ADMIN') throw new AppError('O administrador geral não pode ser alterado por esta tela.', 409);
  const role = String(data.role || user.role).toUpperCase();
  if (!['ADMIN', 'MEMBER'].includes(role)) throw new AppError('Permissão inválida.', 400);
  const active = data.active === undefined ? 1 : data.active ? 1 : 0;
  await db.run('UPDATE users SET role=?,active=? WHERE id=?', [role, active, userId]);
  return db.get('SELECT id,name,email,username,role,active FROM users WHERE id=?', [userId]);
}

async function setChurchActive(id, active) {
  const churchId = Number(id);
  if (!Number.isInteger(churchId) || churchId < 1) throw new AppError('Igreja inválida.', 400);
  if (churchId === 1 && !active) throw new AppError('A igreja administradora não pode ser desativada.', 409);
  const result = await db.run('UPDATE churches SET active=? WHERE id=?', [active ? 1 : 0, churchId]);
  if (!result.changes) throw new AppError('Igreja não encontrada.', 404);
  return db.get('SELECT id,name,active FROM churches WHERE id=?', [churchId]);
}

async function notifications() { return db.all('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 20'); }
async function readNotifications() { await db.run('UPDATE admin_notifications SET read_at=CURRENT_TIMESTAMP WHERE read_at IS NULL'); }

module.exports = { listChurches, listUsers, notifications, readNotifications, setChurchActive, updateChurch, updateUser };
