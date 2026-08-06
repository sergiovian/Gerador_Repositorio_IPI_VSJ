const express = require('express');
const asyncHandler = require('../utils/async-handler');
const ServiceCenter = require('../services/service-center.service');

const router = express.Router();
router.get('/:id', asyncHandler(async (req, res) => res.json({ data: await ServiceCenter.getCenter(req.params.id) })));
router.put('/:id/rehearsal', asyncHandler(async (req, res) => res.json({ data: await ServiceCenter.saveRehearsal(req.params.id, req.body) })));
router.put('/:id/timeline', asyncHandler(async (req, res) => res.json({ data: await ServiceCenter.saveTimeline(req.params.id, req.body.timeline || req.body) })));
router.put('/:id/live', asyncHandler(async (req, res) => res.json({ data: await ServiceCenter.saveLive(req.params.id, req.body) })));

module.exports = router;
