const express = require('express');
const asyncHandler = require('../utils/async-handler');
const Controller = require('../controllers/youtube.controller');
const router = express.Router();
router.get('/gospel', asyncHandler(Controller.gospel));
router.post('/gospel/:trackId/add', asyncHandler(Controller.add));
module.exports = router;
