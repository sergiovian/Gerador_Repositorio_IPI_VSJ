const { databaseReady, getDatabase } = require('./database');

const apply = process.argv.includes('--apply');
const rules = [
  ['Adoração', /\bador(a|ar|ai|e|emos|acao)|exaltar|exaltado|majestade\b/],
  ['Louvor', /\blouvor|louvai|louva(r|do|mos)|cantai|cante(mos)?\b/],
  ['Celebração', /celebra(r|i|cao)|festa\b/],
  ['Entrega', /entrega(r|mos)?|render|rendido|rendo\b/],
  ['Graça', /graca|misericordia|perd(ao|oar)|compaixao/],
  ['Cruz', /cruz|calvário/],
  ['Salvação', /salva(cao|dor|ste|nos)|redentor|redencao/],
  ['Espírito Santo', /espirito santo|espirito de deus|teu espirito/],
  ['Santidade', /santidade|\bsanto(s)?\b/],
  ['Comunhão', /comunhao|\bcomungar|corpo de cristo/],
  ['Missões', /miss(ao|oes)|nacoes|povos\b/],
  ['Evangelismo', /evangelho|proclama(r|i)|testemunh/],
  ['Natal', /natal|nasceu jesus|menino jesus/],
  ['Páscoa', /pascoa|ressurreicao|ressuscitou/],
  ['Santa Ceia', /santa ceia|\bceia\b|pão e vinho/],
  ['Esperança', /esperanca|esperar em deus|\bespera\b/],
  ['Fé', /\bfe\b|\bcre\b|\bcrer\b|confia(r|nca)/],
  ['Consagração', /consagra(cao|r)|dedica(cao|r)/],
  ['Oração', /oracao|\borar\b|clam(a|or)|suplic/],
  ['Gratidão', /gratidao|\bgracas\b|agrade(c|c)/],
  ['Família', /família|lar\b|pais\b|filhos\b/],
  ['Céu', /\bceu\b|celestial|paraiso/],
  ['Segunda Vinda', /segunda vinda|voltará|tua volta|vem senhor|maranata/]
];
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function all(sql, values = []) { return new Promise((resolve, reject) => getDatabase().all(sql, values, (error, rows) => error ? reject(error) : resolve(rows))); }
async function run(sql, values = []) { return new Promise((resolve, reject) => getDatabase().run(sql, values, function (error) { error ? reject(error) : resolve(this); })); }

async function main() {
  await databaseReady;
  const tags = await all('SELECT id, name FROM tags');
  const tagIds = new Map(tags.map(tag => [tag.name, tag.id]));
  const songs = await all(`SELECT m.id, m.title, m.lyrics, GROUP_CONCAT(mt.tag_id) AS current_tags
    FROM music m LEFT JOIN music_tags mt ON mt.music_id=m.id GROUP BY m.id ORDER BY m.id`);
  const additions = [];
  for (const song of songs) {
    const searchable = normalize(`${song.title}\n${song.lyrics || ''}`);
    const existing = new Set(String(song.current_tags || '').split(',').filter(Boolean).map(Number));
    for (const [tagName, expression] of rules) {
      const tagId = tagIds.get(tagName);
      if (tagId && !existing.has(tagId) && expression.test(searchable)) additions.push({ musicId: song.id, tagId, tagName, title: song.title });
    }
  }
  const byTag = additions.reduce((summary, item) => ({ ...summary, [item.tagName]: (summary[item.tagName] || 0) + 1 }), {});
  if (apply) for (const item of additions) await run('INSERT OR IGNORE INTO music_tags(music_id,tag_id) VALUES(?,?)', [item.musicId, item.tagId]);
  console.log(JSON.stringify({ mode: apply ? 'applied' : 'preview', songs: songs.length, additions: additions.length, byTag }, null, 2));
  getDatabase().close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
