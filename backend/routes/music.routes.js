const express = require('express');
const MusicController = require('../controllers/music.controller');
const asyncHandler = require('../utils/async-handler');
const MusicImportController = require('../controllers/music-import.controller');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 150 * 1024 * 1024 } });

router.post('/import/preview', upload.array('file', 2000), asyncHandler(MusicImportController.preview));
router.post('/import/confirm', asyncHandler(MusicImportController.confirm));
router.get('/', asyncHandler(MusicController.list));
router.get('/activity', asyncHandler(MusicController.activity));
router.delete('/activity', asyncHandler(MusicController.clearActivity));
router.get('/:id', asyncHandler(MusicController.getById));
router.post('/', asyncHandler(MusicController.create));
router.put('/:id', asyncHandler(MusicController.update));
router.delete('/:id', asyncHandler(MusicController.remove));

module.exports = router;
