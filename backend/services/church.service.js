const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../models/db.model');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');

const uploadDirectory = path.resolve(process.cwd(), 'backend/uploads/churches');
const imageExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);

function normalizeText(value, field, maxLength, required = false) {
  const text = String(value || '').trim();
  if (required && !text) throw new AppError(`Informe ${field}.`, 400);
  if (text.length > maxLength) throw new AppError(`${field} deve ter no máximo ${maxLength} caracteres.`, 400);
  return text || null;
}

function publicProfile(church) {
  const hasLogo = Boolean(church.logo_file);
  return {
    id: church.id,
    name: church.name,
    city: church.city,
    state: church.state,
    active: Boolean(church.active),
    hasLogo,
    logoUrl: hasLogo
      ? `/api/church/profile/logo?v=${encodeURIComponent(church.updated_at || '')}`
      : church.id === 1 ? '/assets/img/logo-ipi.jpg' : '/assets/img/app-mark.svg'
  };
}

async function getProfile() {
  const church = await db.get('SELECT id,name,city,state,logo_file,active,updated_at FROM churches WHERE id=?', [getCurrentChurchId()]);
  if (!church) throw new AppError('Igreja não encontrada.', 404);
  return publicProfile(church);
}

async function updateProfile(data) {
  const churchId = getCurrentChurchId();
  const name = normalizeText(data.name, 'o nome da igreja', 140, true);
  const city = normalizeText(data.city, 'a cidade', 100);
  const state = normalizeText(data.state, 'o estado', 40);
  await db.run('UPDATE churches SET name=?,city=?,state=? WHERE id=?', [name, city, state, churchId]);
  return getProfile();
}

async function saveLogo(file) {
  if (!file) throw new AppError('Selecione uma foto para a igreja.', 400);
  const extension = imageExtensions.get(file.mimetype);
  if (!extension) throw new AppError('Envie uma imagem JPG, PNG ou WEBP.', 400);

  const churchId = getCurrentChurchId();
  const church = await db.get('SELECT logo_file FROM churches WHERE id=?', [churchId]);
  if (!church) throw new AppError('Igreja não encontrada.', 404);

  fs.mkdirSync(uploadDirectory, { recursive: true });
  const storedName = `${churchId}-${crypto.randomUUID()}${extension}`;
  const storedPath = path.join(uploadDirectory, storedName);
  fs.writeFileSync(storedPath, file.buffer);

  try {
    await db.run('UPDATE churches SET logo_file=? WHERE id=?', [storedName, churchId]);
  } catch (error) {
    fs.rmSync(storedPath, { force: true });
    throw error;
  }

  if (church.logo_file) {
    const oldPath = path.join(uploadDirectory, path.basename(church.logo_file));
    if (oldPath !== storedPath) fs.rmSync(oldPath, { force: true });
  }
  return getProfile();
}

async function getLogoPath(churchId = getCurrentChurchId()) {
  const church = await db.get('SELECT logo_file FROM churches WHERE id=?', [Number(churchId)]);
  if (!church?.logo_file) throw new AppError('Esta igreja ainda não possui uma foto cadastrada.', 404);
  const logoPath = path.join(uploadDirectory, path.basename(church.logo_file));
  if (!fs.existsSync(logoPath)) throw new AppError('A foto da igreja não foi encontrada.', 404);
  return logoPath;
}

module.exports = { getLogoPath, getProfile, publicProfile, saveLogo, updateProfile };
