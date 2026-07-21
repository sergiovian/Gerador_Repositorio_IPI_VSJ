const ENERGY = require('../constants/energy');
const MUSIC_TYPES = require('../constants/music-types');
const {
  booleanValue,
  enumValue,
  integerInRange,
  optionalString,
  optionalUrl,
  positiveInteger,
  requiredString
} = require('./common.validator');

function validateMusicId(id) {
  return positiveInteger(id, 'id', { required: true });
}

function validateMusicPayload(payload) {
  const body = payload || {};

  return {
    title: requiredString(body.title, 'title'),
    artistId: positiveInteger(body.artist_id, 'artist_id'),
    type: enumValue(body.type, 'type', MUSIC_TYPES),
    energy: integerInRange(body.energy, 'energy', ENERGY.MIN, ENERGY.MAX),
    key: optionalString(body.key, 'key'),
    bpm: positiveInteger(body.bpm, 'bpm'),
    duration: positiveInteger(body.duration, 'duration'),
    lyrics: optionalString(body.lyrics, 'lyrics'),
    chords: optionalString(body.chords, 'chords'),
    youtubeUrl: optionalUrl(body.youtube_url, 'youtube_url'),
    cifraUrl: optionalUrl(body.cifra_url, 'cifra_url'),
    notes: optionalString(body.notes, 'notes'),
    active: booleanValue(body.active, 'active', true),
    tagIds: Array.isArray(body.tag_ids) ? [...new Set(body.tag_ids.map((id) => positiveInteger(id, 'tag_ids')))] : []
  };
}

module.exports = { validateMusicId, validateMusicPayload };
