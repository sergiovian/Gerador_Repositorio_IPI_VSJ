const express = require('express');
const Admin = require('../services/admin.service');
const AppError = require('../utils/app-error');
const Church = require('../services/church.service');
const router = express.Router();

router.use((req, res, next) => req.user?.role === 'SUPER_ADMIN' ? next() : next(new AppError('Acesso restrito ao administrador geral.', 403)));
router.get('/churches', async (req, res, next) => { try { res.json({ data: await Admin.listChurches() }); } catch (error) { next(error); } });
router.get('/churches/:id/users', async (req, res, next) => { try { res.json({ data: await Admin.listUsers(req.params.id) }); } catch (error) { next(error); } });
router.get('/churches/:id/logo', async (req, res, next) => { try { res.sendFile(await Church.getLogoPath(req.params.id)); } catch (error) { next(error); } });
router.get('/notifications', async (req, res, next) => { try { res.json({ data: await Admin.notifications() }); } catch (error) { next(error); } });
router.post('/notifications/read', async (req, res, next) => { try { await Admin.readNotifications(); res.status(204).send(); } catch (error) { next(error); } });
router.put('/churches/:id', async (req, res, next) => { try { res.json({ data: await Admin.setChurchActive(req.params.id, req.body.active) }); } catch (error) { next(error); } });
router.put('/churches/:id/profile', async (req, res, next) => { try { res.json({ data: await Admin.updateChurch(req.params.id, req.body) }); } catch (error) { next(error); } });
router.put('/users/:id', async (req, res, next) => { try { res.json({ data: await Admin.updateUser(req.params.id, req.body) }); } catch (error) { next(error); } });
module.exports = router;
