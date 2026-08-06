const express = require('express');
const multer = require('multer');
const asyncHandler = require('../utils/async-handler');
const AppError = require('../utils/app-error');
const Church = require('../services/church.service');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const requireChurchAdmin = (req, res, next) => ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)
  ? next()
  : next(new AppError('Somente administradores podem alterar os dados da igreja.', 403));

router.get('/profile', asyncHandler(async (req, res) => res.json({ data: await Church.getProfile() })));
router.put('/profile', requireChurchAdmin, asyncHandler(async (req, res) => res.json({ data: await Church.updateProfile(req.body) })));
router.put('/profile/logo', requireChurchAdmin, upload.single('logo'), asyncHandler(async (req, res) => res.json({ data: await Church.saveLogo(req.file) })));
router.get('/profile/logo', asyncHandler(async (req, res) => res.sendFile(await Church.getLogoPath())));

module.exports = router;
