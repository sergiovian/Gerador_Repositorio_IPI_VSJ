/** Rotas REST do recurso Music. */
const express = require('express');
const MusicController = require('../controllers/music.controller');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

router.get('/', asyncHandler(MusicController.list));
router.get('/:id', asyncHandler(MusicController.getById));
router.post('/', asyncHandler(MusicController.create));
router.put('/:id', asyncHandler(MusicController.update));
router.delete('/:id', asyncHandler(MusicController.remove));

module.exports = router;
