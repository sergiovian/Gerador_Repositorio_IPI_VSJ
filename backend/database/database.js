const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const databasePath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH || 'backend/database/louvor-inteligente.db'
);
const schemaPath = path.join(__dirname, 'schema.sql');
const seedPath = path.join(__dirname, 'seed.sql');

let database;
let initializationPromise;

function executeSql(sql, context) {
  return new Promise((resolve, reject) => {
    database.exec(sql, (error) => {
      if (error) {
        reject(new Error(`Erro ao executar ${context}: ${error.message}`));
        return;
      }

      resolve();
    });
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });

    database = new sqlite3.Database(databasePath, (error) => {
      if (error) {
        reject(new Error(`Não foi possível abrir o banco de dados: ${error.message}`));
        return;
      }

      resolve();
    });
  });
}

async function initializeDatabase() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await openDatabase();
      await executeSql('PRAGMA foreign_keys = ON;', 'a configuração de chaves estrangeiras');

      const schema = fs.readFileSync(schemaPath, 'utf8');
      const seed = fs.readFileSync(seedPath, 'utf8');

      await executeSql(schema, 'o schema do banco de dados');
      const columns = await new Promise((resolve, reject) => database.all('PRAGMA table_info(music_history)', (error, rows) => error ? reject(error) : resolve(rows)));
      if (!columns.some((column) => column.name === 'origin')) {
        await executeSql("ALTER TABLE music_history ADD COLUMN origin TEXT NOT NULL DEFAULT 'MANUAL'", 'a migração do histórico');
      }
      const musicColumns = await new Promise((resolve, reject) => database.all('PRAGMA table_info(music)', (error, rows) => error ? reject(error) : resolve(rows)));
      const musicMigrations = [['hymn_number', 'INTEGER'], ['source', 'TEXT'], ['congregation_score', 'INTEGER'], ['recommended_opening', 'INTEGER'], ['recommended_offertory', 'INTEGER'], ['recommended_communion', 'INTEGER'], ['recommended_preaching', 'INTEGER'], ['recommended_closing', 'INTEGER'], ['preferred_service_types', 'TEXT'], ['difficulty_band', 'INTEGER'], ['difficulty_vocal', 'INTEGER']];
      for (const [name, definition] of musicMigrations) if (!musicColumns.some((column) => column.name === name)) await executeSql(`ALTER TABLE music ADD COLUMN ${name} ${definition}`, `a migração do campo music.${name}`);
      const userColumns = await new Promise((resolve, reject) => database.all('PRAGMA table_info(users)', (error, rows) => error ? reject(error) : resolve(rows)));
      if (!userColumns.some((column) => column.name === 'username')) await executeSql('ALTER TABLE users ADD COLUMN username TEXT', 'a migração de login');
      await executeSql('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)', 'o índice de login');
      const artistColumns = await new Promise((resolve, reject) => database.all('PRAGMA table_info(artists)', (error, rows) => error ? reject(error) : resolve(rows)));
      if (!artistColumns.some((column) => column.name === 'church_id')) await executeSql('ALTER TABLE artists ADD COLUMN church_id INTEGER NOT NULL DEFAULT 1', 'artist church migration');
      const lyricColumns = await new Promise((resolve, reject) => database.all('PRAGMA table_info(music)', (error, rows) => error ? reject(error) : resolve(rows)));
      if (!lyricColumns.some((column) => column.name === 'lyrics_url')) await executeSql('ALTER TABLE music ADD COLUMN lyrics_url TEXT', 'lyrics link migration');
      await executeSql('CREATE TABLE IF NOT EXISTS projection_states (repertoire_id INTEGER PRIMARY KEY, current_position INTEGER NOT NULL DEFAULT 1, blackout INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(repertoire_id) REFERENCES repertoires(id) ON DELETE CASCADE)', 'a tabela de projeção');
      const projectionColumns = await new Promise((resolve, reject) => database.all('PRAGMA table_info(projection_states)', (error, rows) => error ? reject(error) : resolve(rows)));
      if (!projectionColumns.some((column) => column.name === 'slide_index')) await executeSql('ALTER TABLE projection_states ADD COLUMN slide_index INTEGER NOT NULL DEFAULT 0', 'a paginação da projeção');
      await executeSql(seed, 'os dados iniciais do banco de dados');

      console.log(`Banco de dados inicializado em: ${databasePath}`);
      return database;
    } catch (error) {
      console.error('Falha na inicialização do banco de dados.', error);

      if (database) {
        database.close();
        database = undefined;
      }

      initializationPromise = undefined;
      throw error;
    }
  })();

  return initializationPromise;
}

function getDatabase() {
  if (!database) {
    throw new Error('Banco de dados ainda não foi inicializado. Aguarde databaseReady.');
  }

  return database;
}
const databaseReady = initializeDatabase();

module.exports = {
  databaseReady,
  getDatabase,
  initializeDatabase
};
