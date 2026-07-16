/**
 * Configuração central do Express.
 * Entrega a interface estática e registra os recursos da API REST.
 */
const express = require('express');
const path = require('path');
const artistRoutes = require('./backend/routes/artist.routes');
const musicRoutes = require('./backend/routes/music.routes');
const mvpRoutes = require('./backend/routes/mvp.routes');
const { errorHandler, notFoundHandler } = require('./backend/middlewares/error.middleware');

const app = express();
const frontendPath = path.join(__dirname, 'frontend');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendPath));

// Recursos da API são registrados antes dos handlers globais de erro.
app.use('/api/artists', artistRoutes);
app.use('/api/music', musicRoutes);
app.use('/api', mvpRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
