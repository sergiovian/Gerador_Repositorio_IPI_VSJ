const MusicModel = require('../models/music.model');
const ArtistModel = require('../models/artist.model');
const MusicService = require('./music.service');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');

// Sugestões amplamente conhecidas; o link abre a busca atual do YouTube para cada música.
const tracks = [
  ['a-casa-e-sua', 'A Casa É Sua', 'Casa Worship'],
  ['ninguem-explica-deus', 'Ninguém Explica Deus', 'Preto no Branco'],
  ['lugar-secreto', 'Lugar Secreto', 'Gabriela Rocha'],
  ['todavia-me-alegrarei', 'Todavia Me Alegrarei', 'Samuel Messias'],
  ['bondade-de-deus', 'Bondade de Deus', 'Isaías Saad'],
  ['raridade', 'Raridade', 'Anderson Freire'],
  ['me-atraiu', 'Me Atraiu', 'Gabriela Rocha'],
  ['ousado-amor', 'Ousado Amor', 'Isaías Saad'],
  ['aquieta-minhalma', "Aquieta Minh'alma", 'Ministério Zoe'],
  ['yeshua', 'Yeshua', 'Fernandinho']
].map(([id, title, artist], position) => ({
  id, position: position + 1, title, artist,
  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`
}));

function list() { return tracks; }

async function addTrack(trackId) {
  const track = tracks.find(item => item.id === trackId);
  if (!track) throw new AppError('Sugestão de música inválida.', 404);
  const existing = (await MusicModel.findAllByChurchId(getCurrentChurchId())).find(item =>
    item.title.localeCompare(track.title, 'pt-BR', { sensitivity: 'accent' }) === 0 &&
    (item.artist_name || '').localeCompare(track.artist, 'pt-BR', { sensitivity: 'accent' }) === 0
  );
  if (existing) return { music: existing, duplicate: true };
  let artist = await ArtistModel.findByName(track.artist);
  if (!artist) artist = await ArtistModel.create({ name: track.artist });
  const music = await MusicService.createMusic({
    title: track.title, artistId: artist.id, type: 'LOUVOR', energy: 3,
    key: undefined, bpm: undefined, duration: undefined, lyrics: undefined,
    youtubeUrl: track.url, cifraUrl: undefined,
    notes: `Sugestão gospel do YouTube: ${track.url}`,
    active: true, tagIds: []
  });
  return { music, duplicate: false };
}

module.exports = { addTrack, list };
