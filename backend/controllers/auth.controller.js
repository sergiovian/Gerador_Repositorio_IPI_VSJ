const Auth = require('../services/auth.service');

async function login(req, res) { const user = await Auth.login(req.body.username, req.body.password); req.session = user; res.json({ data: user }); }
async function register(req, res) { const user = await Auth.register(req.body); req.session = user; res.status(201).json({ data: user }); }
function logout(req, res) { res.setHeader('Set-Cookie', 'louvor_session=; Path=/; Max-Age=0'); res.status(204).send(); }
module.exports = { login, logout, register };
