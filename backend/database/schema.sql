-- LOUVOR INTELIGENTE
-- Schema SQLite da versão 1.0.
-- Todas as chaves estrangeiras dependem de PRAGMA foreign_keys = ON na conexão.

CREATE TABLE IF NOT EXISTS churches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  church_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES churches (id) ON DELETE RESTRICT,
  UNIQUE (church_id, email)
);

CREATE TABLE IF NOT EXISTS artists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS music (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  church_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  artist_id INTEGER,
  type TEXT NOT NULL CHECK (type IN ('HINO', 'LOUVOR')),
  hymn_number INTEGER,
  energy INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  "key" TEXT,
  bpm INTEGER CHECK (bpm IS NULL OR bpm > 0),
  duration INTEGER CHECK (duration IS NULL OR duration > 0),
  source TEXT,
  congregation_score INTEGER CHECK (congregation_score IS NULL OR congregation_score BETWEEN 0 AND 100),
  recommended_opening INTEGER CHECK (recommended_opening IN (0, 1)),
  recommended_offertory INTEGER CHECK (recommended_offertory IN (0, 1)),
  recommended_communion INTEGER CHECK (recommended_communion IN (0, 1)),
  recommended_preaching INTEGER CHECK (recommended_preaching IN (0, 1)),
  recommended_closing INTEGER CHECK (recommended_closing IN (0, 1)),
  preferred_service_types TEXT,
  difficulty_band INTEGER CHECK (difficulty_band IS NULL OR difficulty_band BETWEEN 1 AND 5),
  difficulty_vocal INTEGER CHECK (difficulty_vocal IS NULL OR difficulty_vocal BETWEEN 1 AND 5),
  lyrics TEXT,
  youtube_url TEXT,
  cifra_url TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES churches (id) ON DELETE RESTRICT,
  FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6F42C1',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS music_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  music_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (music_id) REFERENCES music (id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE RESTRICT,
  UNIQUE (music_id, tag_id)
);

CREATE TABLE IF NOT EXISTS service_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  church_id INTEGER NOT NULL,
  service_type_id INTEGER NOT NULL,
  service_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES churches (id) ON DELETE RESTRICT,
  FOREIGN KEY (service_type_id) REFERENCES service_types (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sermons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL UNIQUE,
  title TEXT,
  theme TEXT,
  book TEXT,
  chapter INTEGER CHECK (chapter IS NULL OR chapter > 0),
  verse_start INTEGER CHECK (verse_start IS NULL OR verse_start > 0),
  verse_end INTEGER CHECK (verse_end IS NULL OR verse_end > 0),
  preacher TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE,
  CHECK (verse_end IS NULL OR verse_start IS NULL OR verse_end >= verse_start)
);

CREATE TABLE IF NOT EXISTS music_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  church_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  music_id INTEGER NOT NULL,
  performed_at TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT 'MANUAL' CHECK (origin IN ('MANUAL', 'AUTOMATIC')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES churches (id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE RESTRICT,
  FOREIGN KEY (music_id) REFERENCES music (id) ON DELETE RESTRICT,
  UNIQUE (service_id, music_id)
);

CREATE TABLE IF NOT EXISTS church_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  church_id INTEGER NOT NULL UNIQUE,
  dias_sem_repetir INTEGER NOT NULL DEFAULT 30 CHECK (dias_sem_repetir >= 0),
  quantidade_hinos INTEGER NOT NULL DEFAULT 1 CHECK (quantidade_hinos >= 0),
  quantidade_louvores INTEGER NOT NULL DEFAULT 3 CHECK (quantidade_louvores >= 0),
  energia_minima INTEGER NOT NULL DEFAULT 1 CHECK (energia_minima BETWEEN 1 AND 5),
  energia_maxima INTEGER NOT NULL DEFAULT 5 CHECK (energia_maxima BETWEEN 1 AND 5),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES churches (id) ON DELETE CASCADE,
  CHECK (energia_minima <= energia_maxima)
);

CREATE TABLE IF NOT EXISTS decision_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  church_id INTEGER NOT NULL,
  user_id INTEGER,
  service_id INTEGER,
  music_id INTEGER,
  source TEXT NOT NULL CHECK (source IN ('ALGORITHM', 'USER')),
  action TEXT NOT NULL,
  reason TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES churches (id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL,
  FOREIGN KEY (music_id) REFERENCES music (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS repertoires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  church_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'EXECUTED', 'CANCELLED')),
  quality_score INTEGER NOT NULL DEFAULT 0,
  generation_context_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (church_id) REFERENCES churches (id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repertoire_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repertoire_id INTEGER NOT NULL,
  music_id INTEGER NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  role TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  reasons_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repertoire_id) REFERENCES repertoires (id) ON DELETE CASCADE,
  FOREIGN KEY (music_id) REFERENCES music (id) ON DELETE RESTRICT,
  UNIQUE (repertoire_id, music_id),
  UNIQUE (repertoire_id, position)
);

-- Índices alinhados aos filtros do catálogo e do algoritmo de repertório.
CREATE INDEX IF NOT EXISTS idx_users_church_id ON users (church_id);
CREATE INDEX IF NOT EXISTS idx_music_church_active_type ON music (church_id, active, type);
CREATE INDEX IF NOT EXISTS idx_music_artist_id ON music (artist_id);
CREATE INDEX IF NOT EXISTS idx_music_tags_tag_id ON music_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_services_church_date ON services (church_id, service_date);
CREATE INDEX IF NOT EXISTS idx_services_type_id ON services (service_type_id);
CREATE INDEX IF NOT EXISTS idx_music_history_lookup ON music_history (church_id, music_id, performed_at);
CREATE INDEX IF NOT EXISTS idx_decision_logs_service_id ON decision_logs (service_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_music_id ON decision_logs (music_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_church_created_at ON decision_logs (church_id, created_at);
CREATE INDEX IF NOT EXISTS idx_repertoires_church_status ON repertoires (church_id, status);
CREATE INDEX IF NOT EXISTS idx_repertoire_items_repertoire ON repertoire_items (repertoire_id, position);

-- Mantém a data de atualização sincronizada sem exigir que cada consulta a informe.
CREATE TRIGGER IF NOT EXISTS trg_churches_updated_at
AFTER UPDATE ON churches FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE churches SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_artists_updated_at
AFTER UPDATE ON artists FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE artists SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_music_updated_at
AFTER UPDATE ON music FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE music SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_tags_updated_at
AFTER UPDATE ON tags FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_music_tags_updated_at
AFTER UPDATE ON music_tags FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE music_tags SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_service_types_updated_at
AFTER UPDATE ON service_types FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE service_types SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_services_updated_at
AFTER UPDATE ON services FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_sermons_updated_at
AFTER UPDATE ON sermons FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE sermons SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_music_history_updated_at
AFTER UPDATE ON music_history FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE music_history SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_church_preferences_updated_at
AFTER UPDATE ON church_preferences FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE church_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_decision_logs_updated_at
AFTER UPDATE ON decision_logs FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE decision_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
