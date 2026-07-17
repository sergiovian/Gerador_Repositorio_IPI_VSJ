const { getDatabase } = require('../database/database');
const { getCurrentChurchId } = require('../constants/church-context');

function run(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, parameters, function onRun(error) {
      if (error) return reject(error);
      return resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, parameters, (error, row) => {
      if (error) return reject(error);
      return resolve(row);
    });
  });
}

function all(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, parameters, (error, rows) => {
      if (error) return reject(error);
      return resolve(rows);
    });
  });
}

function findAll() {
  return all('SELECT id, name, created_at, updated_at FROM artists WHERE church_id=? ORDER BY name COLLATE NOCASE ASC', [getCurrentChurchId()]);
}

function findById(id) {
  return get('SELECT id, name, created_at, updated_at FROM artists WHERE id = ? AND church_id=?', [id, getCurrentChurchId()]);
}

function findByName(name) {
  return get('SELECT id, name, created_at, updated_at FROM artists WHERE church_id=? AND name = ? COLLATE NOCASE', [getCurrentChurchId(), name]);
}

async function create({ name }) {
  const result = await run('INSERT INTO artists (church_id,name) VALUES (?,?)', [getCurrentChurchId(), name]);
  return findById(result.id);
}

async function update(id, { name }) {
  const result = await run('UPDATE artists SET name = ? WHERE id = ? AND church_id=?', [name, id, getCurrentChurchId()]);
  return result.changes;
}

async function remove(id) {
  const result = await run('DELETE FROM artists WHERE id = ? AND church_id=?', [id, getCurrentChurchId()]);
  return result.changes;
}

module.exports = { create, findAll, findById, findByName, remove, update };
