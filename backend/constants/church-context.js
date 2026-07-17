const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function runChurchContext(churchId, callback) {
  return storage.run({ churchId }, callback);
}

function getCurrentChurchId() {
  const context = storage.getStore();
  if (!context?.churchId) throw new Error('Contexto da igreja ausente.');
  return context.churchId;
}

module.exports = { getCurrentChurchId, runChurchContext };
