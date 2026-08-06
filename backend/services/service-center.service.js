const crypto = require('crypto');
const db = require('../models/db.model');
const AppError = require('../utils/app-error');
const { getCurrentChurchId } = require('../constants/church-context');

const checklistKeys = ['sound', 'projection', 'instruments', 'microphones', 'cables', 'team', 'prayer'];

function validId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Culto inválido.', 400);
  return id;
}

function parse(value, fallback) {
  try { return JSON.parse(value || '') ?? fallback; } catch (_) { return fallback; }
}

function text(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

async function base(repertoireId) {
  const id = validId(repertoireId);
  const repertoire = await db.get(`SELECT r.*,s.service_date,s.notes service_notes,st.name service_type,
    se.title sermon_title,se.theme sermon_theme,se.preacher
    FROM repertoires r JOIN services s ON s.id=r.service_id
    JOIN service_types st ON st.id=s.service_type_id
    LEFT JOIN sermons se ON se.service_id=s.id
    WHERE r.id=? AND r.church_id=?`, [id, getCurrentChurchId()]);
  if (!repertoire) throw new AppError('Culto não encontrado.', 404);
  repertoire.items = await db.all(`SELECT ri.id,ri.music_id,ri.position,ri.role,m.title,m."key",m.bpm,
    a.name artist_name FROM repertoire_items ri JOIN music m ON m.id=ri.music_id
    LEFT JOIN artists a ON a.id=m.artist_id WHERE ri.repertoire_id=? ORDER BY ri.position`, [id]);
  repertoire.liturgy = parse(repertoire.liturgy_json, []);
  if (!repertoire.liturgy.length) {
    const saved = await db.get(`SELECT r2.liturgy_json FROM repertoires r2 JOIN services s2 ON s2.id=r2.service_id
      WHERE r2.church_id=? AND s2.service_date=? AND r2.liturgy_json IS NOT NULL AND r2.liturgy_json<>'[]'
      ORDER BY r2.id DESC LIMIT 1`, [getCurrentChurchId(), repertoire.service_date]);
    repertoire.liturgy = parse(saved?.liturgy_json, []);
  }
  return repertoire;
}

function defaultTimeline(repertoire) {
  const liturgy = repertoire.liturgy.map((page, index) => ({
    uid: `liturgy-${index}`,
    type: 'LITURGY',
    title: text(page.title || page.content?.split('\n')[0] || `Liturgia ${index + 1}`, 120),
    liturgyIndex: index,
    durationMinutes: 2,
    notes: ''
  }));
  const songs = repertoire.items.map(item => ({
    uid: `music-${item.music_id}-${item.id}`,
    type: 'MUSIC',
    title: item.title,
    musicId: item.music_id,
    durationMinutes: 5,
    notes: ''
  }));
  return [...liturgy, ...songs];
}

function normalizedRehearsal(repertoire) {
  const saved = parse(repertoire.rehearsal_json, {});
  const checklist = Object.fromEntries(checklistKeys.map(key => [key, Boolean(saved.checklist?.[key])]));
  const songs = {};
  for (const item of repertoire.items) {
    const current = saved.songs?.[item.music_id] || {};
    songs[item.music_id] = {
      key: text(current.key || item.key, 10),
      bpm: Number(current.bpm || item.bpm) || null,
      repetitions: Math.min(20, Math.max(1, Number(current.repetitions) || 1)),
      intro: text(current.intro, 500),
      ending: text(current.ending, 500),
      notes: text(current.notes, 3000),
      rehearsed: Boolean(current.rehearsed)
    };
  }
  return { checklist, generalNotes: text(saved.generalNotes, 5000), songs };
}

async function getCenter(repertoireId) {
  const repertoire = await base(repertoireId);
  const savedTimeline = parse(repertoire.timeline_json, []);
  const timeline = Array.isArray(savedTimeline) && savedTimeline.length ? savedTimeline : defaultTimeline(repertoire);
  const live = await db.get('SELECT current_index,running,started_at,item_started_at,updated_at FROM service_live_states WHERE repertoire_id=?', [repertoire.id]);
  return {
    id: repertoire.id,
    serviceId: repertoire.service_id,
    serviceDate: repertoire.service_date,
    serviceType: repertoire.service_type,
    status: repertoire.status,
    theme: repertoire.sermon_theme || repertoire.sermon_title || '',
    preacher: repertoire.preacher || '',
    items: repertoire.items,
    liturgy: repertoire.liturgy,
    rehearsal: normalizedRehearsal(repertoire),
    timeline,
    live: {
      currentIndex: Math.min(Math.max(0, live?.current_index || 0), Math.max(0, timeline.length - 1)),
      running: Boolean(live?.running),
      startedAt: live?.started_at || null,
      itemStartedAt: live?.item_started_at || null,
      updatedAt: live?.updated_at || null
    }
  };
}

async function saveRehearsal(repertoireId, input = {}) {
  const repertoire = await base(repertoireId);
  const allowedMusic = new Set(repertoire.items.map(item => item.music_id));
  const checklist = Object.fromEntries(checklistKeys.map(key => [key, Boolean(input.checklist?.[key])]));
  const songs = {};
  for (const [musicIdValue, value] of Object.entries(input.songs || {})) {
    const musicId = Number(musicIdValue);
    if (!allowedMusic.has(musicId)) continue;
    const bpm = value.bpm === null || value.bpm === '' ? null : Number(value.bpm);
    if (bpm !== null && (!Number.isFinite(bpm) || bpm < 20 || bpm > 400)) throw new AppError('O BPM deve ficar entre 20 e 400.', 400);
    songs[musicId] = {
      key: text(value.key, 10),
      bpm,
      repetitions: Math.min(20, Math.max(1, Number(value.repetitions) || 1)),
      intro: text(value.intro, 500),
      ending: text(value.ending, 500),
      notes: text(value.notes, 3000),
      rehearsed: Boolean(value.rehearsed)
    };
  }
  const rehearsal = { checklist, generalNotes: text(input.generalNotes, 5000), songs };
  await db.run('UPDATE repertoires SET rehearsal_json=? WHERE id=? AND church_id=?', [JSON.stringify(rehearsal), repertoire.id, getCurrentChurchId()]);
  return (await getCenter(repertoire.id)).rehearsal;
}

async function saveTimeline(repertoireId, input) {
  const repertoire = await base(repertoireId);
  if (!Array.isArray(input) || !input.length) throw new AppError('A linha do tempo precisa ter ao menos um momento.', 400);
  if (input.length > 200) throw new AppError('A linha do tempo pode ter no máximo 200 momentos.', 400);
  const musicIds = new Set(repertoire.items.map(item => item.music_id));
  const timeline = input.map((entry, index) => {
    const type = String(entry.type || '').toUpperCase();
    if (!['MUSIC', 'LITURGY', 'CUSTOM'].includes(type)) throw new AppError(`Tipo inválido no momento ${index + 1}.`, 400);
    const normalized = {
      uid: text(entry.uid, 100) || crypto.randomUUID(),
      type,
      title: text(entry.title, 120) || `Momento ${index + 1}`,
      durationMinutes: Math.min(240, Math.max(0, Number(entry.durationMinutes) || 0)),
      notes: text(entry.notes, 1000)
    };
    if (type === 'MUSIC') {
      normalized.musicId = Number(entry.musicId);
      if (!musicIds.has(normalized.musicId)) throw new AppError(`Música inválida no momento ${index + 1}.`, 400);
    }
    if (type === 'LITURGY') {
      normalized.liturgyIndex = Number(entry.liturgyIndex);
      if (!Number.isInteger(normalized.liturgyIndex) || !repertoire.liturgy[normalized.liturgyIndex]) throw new AppError(`Página de liturgia inválida no momento ${index + 1}.`, 400);
    }
    return normalized;
  });
  await db.run('UPDATE repertoires SET timeline_json=? WHERE id=? AND church_id=?', [JSON.stringify(timeline), repertoire.id, getCurrentChurchId()]);
  await db.run('UPDATE service_live_states SET current_index=MIN(current_index,?),updated_at=CURRENT_TIMESTAMP WHERE repertoire_id=?', [timeline.length - 1, repertoire.id]);
  return timeline;
}

async function saveLive(repertoireId, input = {}) {
  const center = await getCenter(repertoireId);
  const maxIndex = Math.max(0, center.timeline.length - 1);
  const currentIndex = Math.min(maxIndex, Math.max(0, Number(input.currentIndex) || 0));
  const running = Boolean(input.running);
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const old = center.live;
  let startedAt = old.startedAt;
  let itemStartedAt = old.itemStartedAt;
  if (input.reset) {
    startedAt = null;
    itemStartedAt = null;
  } else if (running && !old.running) {
    if (old.startedAt && old.updatedAt) {
      const pausedMilliseconds = Math.max(0, nowDate.getTime() - new Date(old.updatedAt).getTime());
      startedAt = new Date(new Date(old.startedAt).getTime() + pausedMilliseconds).toISOString();
      itemStartedAt = currentIndex === old.currentIndex && old.itemStartedAt
        ? new Date(new Date(old.itemStartedAt).getTime() + pausedMilliseconds).toISOString()
        : now;
    } else {
      startedAt = now;
      itemStartedAt = now;
    }
  } else if (currentIndex !== old.currentIndex) {
    itemStartedAt = now;
  }
  await db.run(`INSERT INTO service_live_states(repertoire_id,current_index,running,started_at,item_started_at,updated_at)
    VALUES(?,?,?,?,?,?) ON CONFLICT(repertoire_id) DO UPDATE SET current_index=excluded.current_index,
    running=excluded.running,started_at=excluded.started_at,item_started_at=excluded.item_started_at,updated_at=excluded.updated_at`,
  [center.id, currentIndex, running ? 1 : 0, startedAt, itemStartedAt, now]);
  return (await getCenter(center.id)).live;
}

module.exports = { getCenter, saveLive, saveRehearsal, saveTimeline };
