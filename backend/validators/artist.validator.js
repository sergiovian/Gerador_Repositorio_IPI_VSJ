/** Validação e normalização específicas do recurso Artist. */
const { positiveInteger, requiredString } = require('./common.validator');

function validateArtistId(id) {
  return positiveInteger(id, 'id', { required: true });
}

function validateArtistPayload(payload) {
  return { name: requiredString(payload?.name, 'name') };
}

module.exports = { validateArtistId, validateArtistPayload };
