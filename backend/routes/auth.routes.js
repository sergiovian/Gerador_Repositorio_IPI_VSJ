const express = require('express');
const controller = require('../controllers/auth.controller');
const asyncHandler = require('../utils/async-handler');
const router = express.Router();
router.post('/login', asyncHandler(controller.login));
router.post('/register', asyncHandler(controller.register));
router.post('/logout', controller.logout);
module.exports = router;
