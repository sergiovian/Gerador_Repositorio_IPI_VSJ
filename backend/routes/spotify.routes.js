const express = require('express');
const asyncHandler = require('../utils/async-handler');
const Controller = require('../controllers/spotify.controller');
const router = express.Router();
router.get('/top10', asyncHandler(Controller.top10));
router.post('/top10/:trackId/add', asyncHandler(Controller.add));
module.exports = router;
