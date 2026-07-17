const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.DATABASE_PATH = 'test/louvor-inteligente.test.db';
const testDatabase = path.resolve(process.cwd(), process.env.DATABASE_PATH);
fs.rmSync(testDatabase, { force: true });

const { databaseReady, getDatabase } = require('../backend/database/database');
const db = require('../backend/models/db.model');
const service = require('../backend/services/mvp.service');
const { runChurchContext } = require('../backend/constants/church-context');
const inDefaultChurch = (work) => runChurchContext(1, work);

test.before(async () => {
  await databaseReady;
});

test.after(() => {
  getDatabase().close();
  fs.rmSync(testDatabase, { force: true });
});

test('banco de teste inicializa com igreja, tags e tipos de culto', async () => {
  assert.equal((await db.get('SELECT COUNT(*) total FROM churches')).total, 1);
  assert.equal((await db.get('SELECT COUNT(*) total FROM service_types')).total, 10);
  assert.ok((await db.get('SELECT COUNT(*) total FROM tags')).total >= 10);
});

test('tags possuem CRUD e bloqueiam duplicidade', async () => {
  const tag = await inDefaultChurch(() => service.tagSave({ name: 'Teste isolado', color: '#123456' }));
  assert.equal((await inDefaultChurch(() => service.tagGet(tag.id))).name, 'Teste isolado');
  await assert.rejects(() => service.tagSave({ name: 'Teste isolado' }));
  await inDefaultChurch(() => service.tagDelete(tag.id));
});

test('configurações são persistidas no banco isolado', async () => {
  const saved = await inDefaultChurch(() => service.savePreferences({ dias_sem_repetir: 30, quantidade_hinos: 1, quantidade_agitadas: 2, quantidade_calmas: 2 }));
  assert.equal(saved.dias_sem_repetir, 30);
  assert.equal(saved.quantidade_hinos, 1);
});

test('motor informa falta de candidatos em banco vazio', async () => {
  await inDefaultChurch(() => service.savePreferences({ quantidade_hinos: 1, quantidade_agitadas: 2, quantidade_calmas: 2 }));
  const generated = await inDefaultChurch(() => service.generate({ hymns: 1, upbeat: 2, calm: 2 }));
  assert.equal(generated.items.length, 0);
  assert.equal(generated.warnings.length, 0);
});
