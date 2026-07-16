/** Regras de negócio do módulo Artists. */
const ArtistModel = require('../models/artist.model');
const AppError = require('../utils/app-error');

async function listArtists() {
  return ArtistModel.findAll();
}

async function getArtistById(id) {
  const artist = await ArtistModel.findById(id);
  if (!artist) throw new AppError('Artista não encontrado.', 404);
  return artist;
}

async function createArtist(payload) {
  try {
    return await ArtistModel.create(payload);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') throw new AppError('Já existe um artista com este nome.', 409);
    throw error;
  }
}

async function updateArtist(id, payload) {
  await getArtistById(id);
  try {
    await ArtistModel.update(id, payload);
    return await ArtistModel.findById(id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') throw new AppError('Já existe um artista com este nome.', 409);
    throw error;
  }
}

async function deleteArtist(id) {
  await getArtistById(id);
  try {
    await ArtistModel.remove(id);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new AppError('O artista não pode ser removido porque está vinculado a músicas.', 409);
    }
    throw error;
  }
}

module.exports = { createArtist, deleteArtist, getArtistById, listArtists, updateArtist };
