const express = require('express');
const path = require('path');
const crypto = require('crypto');
const artistRoutes = require('./backend/routes/artist.routes');
const musicRoutes = require('./backend/routes/music.routes');
const mvpRoutes = require('./backend/routes/mvp.routes');
const { errorHandler, notFoundHandler } = require('./backend/middlewares/error.middleware');

const app = express();
const frontendPath = path.join(__dirname, 'frontend');
const accessPassword = process.env.SITE_PASSWORD || '852456';
const sessionSecret = process.env.SESSION_SECRET || 'troque-esta-chave-em-producao';
const token = () => crypto.createHmac('sha256', sessionSecret).update('louvor-acesso').digest('hex');
const hasAccess = req => (req.headers.cookie || '').split(';').some(item => item.trim() === `louvor_access=${token()}`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/login', (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));
app.post('/api/auth/login', (req, res) => {
  const password = String(req.body.password || '');
  if (password.length !== accessPassword.length || !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(accessPassword))) return res.status(401).json({ message: 'Senha incorreta.' });
  res.setHeader('Set-Cookie', `louvor_access=${token()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
  return res.json({ data: { authenticated: true } });
});
app.use((req, res, next) => {
  if (req.path === '/login' || req.path.startsWith('/assets/') || hasAccess(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ message: 'Acesso não autorizado.' });
  return res.redirect('/login');
});
app.use(express.static(frontendPath));
app.use('/api/artists', artistRoutes);
app.use('/api/music', musicRoutes);
app.use('/api', mvpRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
