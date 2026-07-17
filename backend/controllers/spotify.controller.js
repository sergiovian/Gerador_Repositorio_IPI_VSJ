const Spotify = require('../services/spotify.service');
const Library = require('../services/spotify-library.service');
const AppError = require('../utils/app-error');

async function top10(req, res) { res.json({ data: { configured: Spotify.configured(), tracks: await Spotify.topTracks() } }); }
async function add(req, res) {
  if (!/^[A-Za-z0-9]{22}$/.test(req.params.trackId)) throw new AppError('Identificador de música inválido.', 400);
  res.status(201).json({ data: await Library.addTrack(req.params.trackId) });
}
module.exports = { add, top10 };
