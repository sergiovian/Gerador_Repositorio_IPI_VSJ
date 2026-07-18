const express = require('express');
const asyncHandler = require('../utils/async-handler');
const Service = require('../services/repertoire-edit.service');
const router = express.Router();
router.put('/:id/items', asyncHandler(async (req, res) => res.json({ data: await Service.replaceItems(req.params.id, req.body.items) })));
router.post('/:id/reopen', asyncHandler(async (req, res) => res.json({ data: await Service.reopen(req.params.id) })));
module.exports = router;
