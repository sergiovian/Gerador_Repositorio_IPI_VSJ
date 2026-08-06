const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.DATABASE_PATH = 'test/louvor-inteligente.test.db';
const testAdminPassword = crypto.randomBytes(24).toString('hex');
process.env.BOOTSTRAP_ADMIN_PASSWORD = testAdminPassword;
const testDatabase = path.resolve(process.cwd(), process.env.DATABASE_PATH);
fs.rmSync(testDatabase, { force: true });

const { databaseReady, getDatabase } = require('../backend/database/database');
const db = require('../backend/models/db.model');
const service = require('../backend/services/mvp.service');
const churchService = require('../backend/services/church.service');
const authService = require('../backend/services/auth.service');
const serviceCenter = require('../backend/services/service-center.service');
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
  await new Promise((resolve, reject) => getDatabase().close(error => error ? reject(error) : resolve()));
  fs.rmSync(testDatabase, { force: true });
});

test('sessão autenticada expõe permissão e permite atualizar a própria igreja', async () => {
  const login = await fetch(`${baseUrl}/api/auth/user-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ipivsj', password: testAdminPassword })
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

test('central do culto salva ensaio, ordem e andamento ao vivo', async () => {
  await inDefaultChurch(async () => {
    const artist = await db.run('INSERT INTO artists(church_id,name) VALUES(?,?)', [1, 'Equipe Teste']);
    const music = await db.run('INSERT INTO music(church_id,title,artist_id,type,energy,active) VALUES(?,?,?,?,?,1)', [1, 'Música do Ensaio', artist.id, 'LOUVOR', 3]);
    const serviceRow = await db.run("INSERT INTO services(church_id,service_type_id,service_date,status) VALUES(1,1,'2026-08-09','PLANNED')");
    const repertoire = await db.run("INSERT INTO repertoires(church_id,service_id,status,quality_score,generation_context_json,liturgy_json) VALUES(1,?,'DRAFT',100,'{}','[]')", [serviceRow.id]);
    await db.run("INSERT INTO repertoire_items(repertoire_id,music_id,position,role,score,reasons_json,warnings_json) VALUES(?,?,1,'LOUVOR',100,'[]','[]')", [repertoire.id, music.id]);
    const center = await serviceCenter.getCenter(repertoire.id);
    assert.equal(center.items.length, 1);
    assert.equal(center.timeline[0].type, 'MUSIC');
    const rehearsal = await serviceCenter.saveRehearsal(repertoire.id, { checklist: { sound: true }, songs: { [music.id]: { key: 'G', bpm: 96, repetitions: 2, rehearsed: true } } });
    assert.equal(rehearsal.checklist.sound, true);
    assert.equal(rehearsal.songs[music.id].bpm, 96);
    const timeline = await serviceCenter.saveTimeline(repertoire.id, center.timeline);
    assert.equal(timeline.length, 1);
    const live = await serviceCenter.saveLive(repertoire.id, { currentIndex: 0, running: true });
    assert.equal(live.running, true);
    assert.ok(live.startedAt);
  });
});
