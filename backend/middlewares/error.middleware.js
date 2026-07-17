const AppError = require('../utils/app-error');

function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Rota não encontrada.', status: 404 } });
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: { message: 'JSON inválido no corpo da requisição.', status: 400 } });
  }

  const status = error instanceof AppError ? error.statusCode : 500;
  const message = status === 500 ? 'Erro interno do servidor.' : error.message;
  if (status === 500) console.error('Erro não tratado na API.', error);

  return res.status(status).json({ error: { message, status } });
}

module.exports = { errorHandler, notFoundHandler };
