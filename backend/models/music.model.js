/**
 * Camada de persistência de Music com SQL puro.
 * O churchId é recebido do Service, nunca do contrato HTTP na versão 1.0.
 */
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

const musicSelect = `
  SELECT
    music.id,
    music.title,
    music.artist_id,
    artists.name AS artist_name,
    music.type,
    music.energy,
    music."key" AS key,
    music.bpm,
    music.duration,
    music.lyrics,
    music.youtube_url,
    music.cifra_url,
    music.notes,
    music.active,
    music.created_at,
    music.updated_at
  FROM music
  LEFT JOIN artists ON artists.id = music.artist_id
`;

function findAllByChurchId(churchId) {
  return new Promise((resolve, reject) => {
    getDatabase().all(
      `${musicSelect} WHERE music.church_id = ? ORDER BY music.title COLLATE NOCASE ASC`,
      [churchId],
      (error, rows) => {
        if (error) return reject(error);
        return resolve(rows);
      }
    );
  });
}

function findByIdAndChurchId(id, churchId) {
  return get(`${musicSelect} WHERE music.id = ? AND music.church_id = ?`, [id, churchId]);
}

async function tagsForMusic(id) {
  return new Promise((resolve, reject) => getDatabase().all('SELECT t.id,t.name,t.color FROM tags t JOIN music_tags mt ON mt.tag_id=t.id WHERE mt.music_id=? ORDER BY t.name',[id],(e,x)=>e?reject(e):resolve(x)));
}

async function replaceTags(id, tagIds) {
  await run('DELETE FROM music_tags WHERE music_id=?',[id]);
  for (const tagId of tagIds) await run('INSERT INTO music_tags(music_id,tag_id) VALUES(?,?)',[id,tagId]);
}

async function create(music) {
  const result = await run(`
    INSERT INTO music (
      church_id, title, artist_id, type, energy, "key", bpm, duration, lyrics,
      youtube_url, cifra_url, notes, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    music.churchId, music.title, music.artistId, music.type, music.energy,
    music.key, music.bpm, music.duration, music.lyrics, music.youtubeUrl, music.cifraUrl,
    music.notes, music.active ? 1 : 0
  ]);

  return findByIdAndChurchId(result.id, music.churchId);
}

async function update(id, music) {
  const result = await run(`
    UPDATE music SET
      church_id = ?, title = ?, artist_id = ?, type = ?, energy = ?, "key" = ?,
      bpm = ?, duration = ?, lyrics = ?, youtube_url = ?, cifra_url = ?, notes = ?, active = ?
    WHERE id = ? AND church_id = ?
  `, [
    music.churchId, music.title, music.artistId, music.type, music.energy,
    music.key, music.bpm, music.duration, music.lyrics, music.youtubeUrl, music.cifraUrl,
    music.notes, music.active ? 1 : 0, id, music.churchId
  ]);

  return result.changes;
}

async function remove(id, churchId) {
  const result = await run('DELETE FROM music WHERE id = ? AND church_id = ?', [id, churchId]);
  return result.changes;
}

module.exports = { create, findAllByChurchId, findByIdAndChurchId, remove, update, replaceTags, tagsForMusic };
