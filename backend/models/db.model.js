const { getDatabase } = require('../database/database');
const all = (sql, p = []) => new Promise((r, j) => getDatabase().all(sql, p, (e, x) => e ? j(e) : r(x)));
const get = (sql, p = []) => new Promise((r, j) => getDatabase().get(sql, p, (e, x) => e ? j(e) : r(x)));
const run = (sql, p = []) => new Promise((r, j) => getDatabase().run(sql, p, function(e) { e ? j(e) : r({ id: this.lastID, changes: this.changes }); }));
const transaction = async (work) => { await run('BEGIN IMMEDIATE'); try { const result = await work(); await run('COMMIT'); return result; } catch (error) { try { await run('ROLLBACK'); } catch (_) {} throw error; } };
module.exports = { all, get, run, transaction };
