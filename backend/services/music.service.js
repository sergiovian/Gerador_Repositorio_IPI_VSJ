const MusicModel = require('../models/music.model');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');

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
    return getMusicById(music.id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new AppError('Não foi possível cadastrar a música: artista informado é inválido.', 409);
    }
    throw error;
  }
}

async function updateMusic(id, musicData) {
  await getMusicById(id);
  try {
    await MusicModel.update(id, { ...musicData, churchId: getCurrentChurchId() });
    await MusicModel.replaceTags(id, musicData.tagIds);
    return getMusicById(id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new AppError('Não foi possível atualizar a música: artista informado é inválido.', 409);
    }
    throw error;
  }
}

async function deleteMusic(id) {
  await getMusicById(id);
  try {
    await MusicModel.remove(id, getCurrentChurchId());
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new AppError('A música não pode ser removida porque possui histórico vinculado.', 409);
    }
    throw error;
  }
}

module.exports = { createMusic, deleteMusic, getMusicById, listMusic, updateMusic };
