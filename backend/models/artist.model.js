const { getDatabase } = require('../database/database');

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
  return all('SELECT id, name, created_at, updated_at FROM artists ORDER BY name COLLATE NOCASE ASC');
}

function findById(id) {
  return get('SELECT id, name, created_at, updated_at FROM artists WHERE id = ?', [id]);
}

async function create({ name }) {
  const result = await run('INSERT INTO artists (name) VALUES (?)', [name]);
  return findById(result.id);
}

async function update(id, { name }) {
  const result = await run('UPDATE artists SET name = ? WHERE id = ?', [name, id]);
  return result.changes;
}

async function remove(id) {
  const result = await run('DELETE FROM artists WHERE id = ?', [id]);
  return result.changes;
}

module.exports = { create, findAll, findById, remove, update };
