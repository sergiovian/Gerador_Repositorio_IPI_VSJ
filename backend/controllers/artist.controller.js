const ArtistService = require('../services/artist.service');
const { validateArtistId, validateArtistPayload } = require('../validators/artist.validator');

async function list(req, res) {
  const artists = await ArtistService.listArtists();
  res.status(200).json({ data: artists });
}

async function getById(req, res) {
  const artist = await ArtistService.getArtistById(validateArtistId(req.params.id));
  res.status(200).json({ data: artist });
}

async function create(req, res) {
  const artist = await ArtistService.createArtist(validateArtistPayload(req.body));
  res.status(201).json({ data: artist });
}

async function update(req, res) {
  const artist = await ArtistService.updateArtist(
    validateArtistId(req.params.id),
    validateArtistPayload(req.body)
  );
  res.status(200).json({ data: artist });
}

async function remove(req, res) {
  await ArtistService.deleteArtist(validateArtistId(req.params.id));
  res.status(204).send();
}

module.exports = { create, getById, list, remove, update };
