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
const churchService = require('../backend/services/church.service');
const authService = require('../backend/services/auth.service');
const app = require('../app');
const { runChurchContext } = require('../backend/constants/church-context');
const inDefaultChurch = (work) => runChurchContext(1, work);
let httpServer;
let baseUrl;

test.before(async () => {
  await databaseReady;
  await authService.ensureIpiUser();
  await new Promise(resolve => {
    httpServer = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise(resolve => httpServer.close(resolve));
  getDatabase().close();
  fs.rmSync(testDatabase, { force: true });
});

test('sessão autenticada expõe permissão e permite atualizar a própria igreja', async () => {
  const login = await fetch(`${baseUrl}/api/auth/user-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ipivsj', password: '852456' })
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const session = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } }).then(response => response.json());
  assert.equal(session.data.role, 'SUPER_ADMIN');
  const updated = await fetch(`${baseUrl}/api/church/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ name: 'Igreja via API', city: 'Osasco', state: 'SP' })
  }).then(response => response.json());
  assert.equal(updated.data.name, 'Igreja via API');
});

test('banco de teste inicializa com igreja, tags e tipos de culto', async () => {
  assert.equal((await db.get('SELECT COUNT(*) total FROM churches')).total, 1);
  assert.equal((await db.get('SELECT COUNT(*) total FROM service_types')).total, 10);
  assert.ok((await db.get('SELECT COUNT(*) total FROM tags')).total >= 10);
});

test('perfil da igreja guarda identidade e reconhece administrador geral', async () => {
  const profile = await inDefaultChurch(() => churchService.updateProfile({
    name: 'Igreja de Teste',
    city: 'Osasco',
    state: 'SP'
  }));
  assert.equal(profile.name, 'Igreja de Teste');
  assert.equal(profile.city, 'Osasco');
  const administrator = await db.get('SELECT id FROM users WHERE username=?', ['ipivsj']);
  const session = await authService.currentUser(administrator.id);
  assert.equal(session.role, 'SUPER_ADMIN');
  assert.equal(session.churchName, 'Igreja de Teste');
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
