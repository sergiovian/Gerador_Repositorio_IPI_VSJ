const MusicModel = require('../models/music.model');
const ArtistModel = require('../models/artist.model');
const MusicService = require('./music.service');
const Spotify = require('./spotify.service');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');

async function addTrack(trackId) {
  const track = (await Spotify.topTracks()).find(item => item.id === trackId);
  if (!track) throw new AppError('Esta música não está mais entre as 10 da playlist selecionada.', 404);

  const existing = (await MusicModel.findAllByChurchId(getCurrentChurchId())).find(item =>
    item.title.localeCompare(track.title, 'pt-BR', { sensitivity: 'accent' }) === 0 &&
    (item.artist_name || '').localeCompare(track.artist, 'pt-BR', { sensitivity: 'accent' }) === 0
  );
  if (existing) return { music: existing, duplicate: true };

  let artist = await ArtistModel.findByName(track.artist);
  if (!artist) artist = await ArtistModel.create({ name: track.artist });
  const music = await MusicService.createMusic({
    title: track.title,
    artistId: artist.id,
    type: 'LOUVOR',
    energy: 3,
    key: undefined,
    bpm: undefined,
    duration: undefined,
    lyrics: undefined,
    youtubeUrl: undefined,
    cifraUrl: undefined,
    notes: `Importada do Spotify: ${track.url}`,
    active: true,
    tagIds: []
  });
  return { music, duplicate: false };
}

module.exports = { addTrack };
