/** Controller HTTP: aplica validators antes de delegar ao serviço. */
const MusicService = require('../services/music.service');
const { validateMusicId, validateMusicPayload } = require('../validators/music.validator');

async function list(req, res) {
  const music = await MusicService.listMusic();
  res.status(200).json({ data: music });
}

async function getById(req, res) {
  const musicId = validateMusicId(req.params.id);
  const music = await MusicService.getMusicById(musicId);
  res.status(200).json({ data: music });
}

async function create(req, res) {
  const musicData = validateMusicPayload(req.body);
  const music = await MusicService.createMusic(musicData);
  res.status(201).json({ data: music });
}

async function update(req, res) {
  const musicId = validateMusicId(req.params.id);
  const musicData = validateMusicPayload(req.body);
  const music = await MusicService.updateMusic(musicId, musicData);
  res.status(200).json({ data: music });
}

async function remove(req, res) {
  const musicId = validateMusicId(req.params.id);
  await MusicService.deleteMusic(musicId);
  res.status(204).send();
}

module.exports = { create, getById, list, remove, update };
