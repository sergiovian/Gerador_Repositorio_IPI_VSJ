const Gospel = require('../services/youtube-gospel.service');
const AppError = require('../utils/app-error');
async function gospel(req, res) { res.json({ data: Gospel.list() }); }
async function add(req, res) {
  if (!/^[a-z0-9-]+$/.test(req.params.trackId)) throw new AppError('Identificador de música inválido.', 400);
  res.status(201).json({ data: await Gospel.addTrack(req.params.trackId) });
}
module.exports = { add, gospel };
