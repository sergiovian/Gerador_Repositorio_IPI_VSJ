const db = require('../models/db.model');
const { getCurrentChurchId } = require('../constants/church-context');

async function clearHistory() {
  await db.run('DELETE FROM music_history WHERE church_id=?', [getCurrentChurchId()]);
}

module.exports = { clearHistory };
