const express = require('express');
const path = require('path');
const Auth = require('./backend/services/auth.service');
const { runChurchContext } = require('./backend/constants/church-context');
const artistRoutes = require('./backend/routes/artist.routes');
const musicRoutes = require('./backend/routes/music.routes');
const mvpRoutes = require('./backend/routes/mvp.routes');
const adminRoutes = require('./backend/routes/admin.routes');
const youtubeRoutes = require('./backend/routes/youtube.routes');
const { errorHandler, notFoundHandler } = require('./backend/middlewares/error.middleware');

const app = express();
const frontendPath = path.join(__dirname, 'frontend');
const sessionSecret = process.env.SESSION_SECRET || 'troque-esta-chave-em-producao';
const crypto = require('crypto');
const sessionToken = user => crypto.createHmac('sha256', sessionSecret).update(JSON.stringify(user)).digest('hex')+'.'+Buffer.from(JSON.stringify(user)).toString('base64url');
const sessionUser = req => { const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('louvor_session='))?.slice(15); if(!value)return null; const [sig,data]=value.split('.'); const raw=Buffer.from(data||'','base64url').toString(); return sig===crypto.createHmac('sha256',sessionSecret).update(raw).digest('hex')?JSON.parse(raw):null; };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/api/auth/user-login', async (req,res,next)=>{try{const user=await Auth.login(req.body.username,req.body.password);res.setHeader('Set-Cookie',`louvor_session=${sessionToken(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);res.json({data:user});}catch(error){next(error)}});
app.post('/api/auth/register', async (req,res,next)=>{try{const user=await Auth.register(req.body);res.setHeader('Set-Cookie',`louvor_session=${sessionToken(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);res.status(201).json({data:user});}catch(error){next(error)}});
app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'louvor_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.status(204).send();
});
app.get('/login', (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));
app.use((req, res, next) => {
  const user = sessionUser(req);
  if (user) { req.user = user; return runChurchContext(user.churchId, next); }
  if (req.path === '/login' || req.path.startsWith('/assets/') || req.path === '/api/auth/user-login' || req.path === '/api/auth/register') return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ message: 'Acesso não autorizado.' });
  return res.redirect('/login');
});
app.use(express.static(frontendPath));
app.use('/api/artists', artistRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api', mvpRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
