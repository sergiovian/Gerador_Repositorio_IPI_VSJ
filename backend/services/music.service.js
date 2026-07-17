const MusicModel = require('../models/music.model');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');
const db = require('../models/db.model');

const logActivity = (title, action) => db.run('INSERT INTO music_activity_logs(church_id,music_title,action) VALUES(?,?,?)', [getCurrentChurchId(), title, action]);

async function listMusic() {
  const items = await MusicModel.findAllByChurchId(getCurrentChurchId());
  return Promise.all(items.map(async (item) => ({ ...item, tags: await MusicModel.tagsForMusic(item.id) })));
}

async function getMusicById(id) {
  const music = await MusicModel.findByIdAndChurchId(id, getCurrentChurchId());
  if (!music) throw new AppError('Música não encontrada.', 404);
  music.tags = await MusicModel.tagsForMusic(id);
  return music;
}

async function createMusic(musicData) {
  try {
    const music = await MusicModel.create({ ...musicData, churchId: getCurrentChurchId() });
    await MusicModel.replaceTags(music.id, musicData.tagIds);
    await logActivity(music.title, 'ADDED');
    return getMusicById(music.id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new AppError('Não foi possível cadastrar a música: artista informado é inválido.', 409);
    }
    throw error;
  }
}

async function updateMusic(id, musicData) {
  const previous = await getMusicById(id);
  try {
    await MusicModel.update(id, { ...musicData, churchId: getCurrentChurchId() });
    await MusicModel.replaceTags(id, musicData.tagIds);
    await logActivity(musicData.title || previous.title, 'UPDATED');
    return getMusicById(id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new AppError('Não foi possível atualizar a música: artista informado é inválido.', 409);
    }
    throw error;
  }
}

async function deleteMusic(id) {
  const music = await getMusicById(id);
  try {
    await MusicModel.remove(id, getCurrentChurchId());
    await logActivity(music.title, 'REMOVED');
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new AppError('A música não pode ser removida porque possui histórico vinculado.', 409);
    }
    throw error;
  }
}

async function listActivity() { return db.all('SELECT * FROM music_activity_logs WHERE church_id=? ORDER BY created_at DESC LIMIT 10', [getCurrentChurchId()]); }
async function clearActivity() { await db.run('DELETE FROM music_activity_logs WHERE church_id=?', [getCurrentChurchId()]); }
module.exports = { clearActivity, createMusic, deleteMusic, getMusicById, listActivity, listMusic, updateMusic };
