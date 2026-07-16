/** Encaminha erros de funções async para o middleware de erros do Express. */
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = asyncHandler;
