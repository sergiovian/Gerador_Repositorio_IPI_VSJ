/** Funções reutilizáveis de validação e normalização de entrada HTTP. */
const AppError = require('../utils/app-error');

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`O campo "${field}" é obrigatório e deve ser um texto válido.`, 400);
  }

  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new AppError(`O campo "${field}" deve ser um texto.`, 400);
  }

  return value.trim() || null;
}

function positiveInteger(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError(`O campo "${field}" é obrigatório.`, 400);
    return null;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new AppError(`O campo "${field}" deve ser um inteiro positivo.`, 400);
  }

  return parsedValue;
}

function integerInRange(value, field, min, max) {
  const parsedValue = positiveInteger(value, field, { required: true });
  if (parsedValue < min || parsedValue > max) {
    throw new AppError(`O campo "${field}" deve estar entre ${min} e ${max}.`, 400);
  }

  return parsedValue;
}

function booleanValue(value, field, defaultValue) {
  if (value === undefined) return defaultValue;
  if (typeof value !== 'boolean') {
    throw new AppError(`O campo "${field}" deve ser verdadeiro ou falso.`, 400);
  }

  return value;
}

function enumValue(value, field, allowedValues) {
  if (!Object.values(allowedValues).includes(value)) {
    throw new AppError(`O campo "${field}" possui um valor inválido.`, 400);
  }

  return value;
}

function optionalUrl(value, field) {
  const normalizedValue = optionalString(value, field);
  if (!normalizedValue) return null;

  try {
    const url = new URL(normalizedValue);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Protocolo inválido');
    return url.toString();
  } catch (error) {
    throw new AppError(`O campo "${field}" deve ser uma URL HTTP ou HTTPS válida.`, 400);
  }
}

module.exports = {
  booleanValue,
  enumValue,
  integerInRange,
  optionalString,
  optionalUrl,
  positiveInteger,
  requiredString
};
