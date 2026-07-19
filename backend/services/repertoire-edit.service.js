const db = require('../models/db.model');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

async function saveLiturgy(repertoireId, pages) {
  const churchId = getCurrentChurchId(), id = validId(repertoireId);
  if (!Array.isArray(pages) || !pages.length) throw new AppError('Informe ao menos uma página da liturgia.', 400);
  if (pages.length > 300) throw new AppError('A liturgia pode ter no máximo 300 páginas.', 400);
  const normalized = pages.map((page, index) => {
    const content = String(page?.content || '').replace(/\r\n/g, '\n').trim();
    if (!content) throw new AppError(`A página ${index + 1} está vazia.`, 400);
    if (content.length > 12000) throw new AppError(`A página ${index + 1} é muito extensa.`, 400);
    return { position: index + 1, title: String(page?.title || content.split('\n')[0]).trim().slice(0, 100), content };
  });
  const repertoire = await db.get('SELECT id,status FROM repertoires WHERE id=? AND church_id=?', [id, churchId]);
  if (!repertoire) throw new AppError('Culto não encontrado.', 404);
  await db.run('UPDATE repertoires SET liturgy_json=? WHERE id=? AND church_id=?', [JSON.stringify(normalized), id, churchId]);
  return { id, pages: normalized };
}

async function savePresentation(repertoireId, file) {
  const churchId = getCurrentChurchId(), id = validId(repertoireId);
  if (!file) throw new AppError('Selecione a apresentação PowerPoint.', 400);
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!['.ppt', '.pptx'].includes(ext)) throw new AppError('Envie um arquivo PowerPoint (.ppt ou .pptx).', 400);
  const repertoire = await db.get('SELECT id,presentation_file FROM repertoires WHERE id=? AND church_id=?', [id, churchId]);
  if (!repertoire) throw new AppError('Culto não encontrado.', 404);
  const dir = path.resolve(process.cwd(), 'backend/uploads/presentations');
  fs.mkdirSync(dir, { recursive: true });
  const stored = `${id}-${crypto.randomUUID()}${ext}`, target = path.join(dir, stored);
  fs.writeFileSync(target, file.buffer);
  if (repertoire.presentation_file) { const old = path.join(dir, path.basename(repertoire.presentation_file)); if (fs.existsSync(old)) fs.unlinkSync(old); }
  await db.run('UPDATE repertoires SET presentation_file=? WHERE id=? AND church_id=?', [stored, id, churchId]);
  return { id, fileName: file.originalname, downloadUrl: `/api/repertoires/${id}/presentation` };
}

async function getPresentation(repertoireId) {
  const churchId = getCurrentChurchId(), id = validId(repertoireId);
  const repertoire = await db.get('SELECT presentation_file FROM repertoires WHERE id=? AND church_id=?', [id, churchId]);
  if (!repertoire?.presentation_file) throw new AppError('Não há apresentação anexada a este culto.', 404);
  const stored = path.basename(repertoire.presentation_file), filePath = path.resolve(process.cwd(), 'backend/uploads/presentations', stored);
  if (!fs.existsSync(filePath)) throw new AppError('O arquivo da apresentação não foi encontrado.', 404);
  return { path: filePath, name: stored.replace(/^\d+-[\w-]+/, 'apresentacao') };
}

module.exports = { replaceItems, saveLiturgy, savePresentation, getPresentation, reopen };
