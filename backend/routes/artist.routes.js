/** Rotas REST do recurso Artists. */
const express = require('express');
const ArtistController = require('../controllers/artist.controller');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

router.get('/', asyncHandler(ArtistController.list));
router.get('/:id', asyncHandler(ArtistController.getById));
router.post('/', asyncHandler(ArtistController.create));
router.put('/:id', asyncHandler(ArtistController.update));
router.delete('/:id', asyncHandler(ArtistController.remove));

module.exports = router;
