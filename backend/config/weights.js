/**
 * Pesos centralizados para o futuro Motor de Decisão.
 * O algoritmo deve importar estes valores, nunca declarar pesos numéricos localmente.
 */
const DECISION_WEIGHTS = Object.freeze({
  CONTEXT_MATCH: 30,
  TIME_SINCE_LAST_PERFORMANCE: 25,
  ARTIST_DIVERSITY: 15,
  TAG_DIVERSITY: 15,
  ENERGY_FIT: 15,
  RECENT_REPEAT_PENALTY: 30
});

module.exports = DECISION_WEIGHTS;
