/**
 * Ponto de entrada da aplicação.
 * O servidor só aceita conexões depois que o banco estiver pronto.
 */
require('dotenv').config();

const app = require('./app');
const { databaseReady } = require('./backend/database/database');

const PORT = process.env.PORT || 3000;

databaseReady
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Louvor Inteligente disponível em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Não foi possível iniciar o servidor.', error);
    process.exit(1);
  });
