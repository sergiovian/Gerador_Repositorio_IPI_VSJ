document.addEventListener('DOMContentLoaded', () => {
  if (document.documentElement.dataset.page !== 'music') return;
  let selectedTerms = '';
  const openPlatform = platform => window.open(platform === 'spotify' ? `https://open.spotify.com/search/${encodeURIComponent(selectedTerms)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTerms)}`, '_blank', 'noopener');
  const details = music => ({ title: music.title, artist_id: music.artist_id, type: music.type, energy: music.energy, key: music.key, bpm: music.bpm, duration: music.duration, lyrics: music.lyrics || '', chords: music.chords || '', youtube_url: music.youtube_url, cifra_url: music.cifra_url, notes: music.notes, active: !!music.active, tag_ids: (music.tags || []).map(tag => tag.id) });
  const esc = UI.esc;
  function showOwnLyrics(music) {
    const box = document.createElement('div'); box.className = 'modal fade'; box.tabIndex = -1;
    box.innerHTML = `<div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5">Letra própria — ${esc(music.title)}</h2><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><pre class="mb-0" style="white-space:pre-wrap;font:inherit;line-height:1.65">${esc(music.lyrics || 'Esta música ainda não possui letra própria cadastrada.')}</pre></div></div></div>`;
    document.body.append(box); const modal = new bootstrap.Modal(box); box.addEventListener('hidden.bs.modal', () => box.remove(), { once: true }); modal.show();
  }
  function editChords(music) {
    const box = document.createElement('div'); box.className = 'modal fade'; box.tabIndex = -1;
    const notes = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B','Cm','Dm','Em','Fm','Gm','Am','Bm','C7','D7','E7','F7','G7','A7','B7'];
    box.innerHTML = `<div class="modal-dialog modal-xl modal-dialog-scrollable"><form class="modal-content"><div class="modal-header"><div><h2 class="modal-title fs-5">Cifra própria — ${esc(music.title)}</h2><small class="text-secondary">Escreva os acordes na linha acima da letra. Clique em uma nota para inseri-la onde está o cursor.</small></div><button class="btn-close" data-bs-dismiss="modal" type="button"></button></div><div class="modal-body"><div class="chord-palette mb-3">${notes.map(note => `<button class="btn btn-sm btn-outline-success chord-note" type="button" data-note="${note}">${note}</button>`).join('')}</div><textarea class="form-control font-monospace" name="chords" rows="14" spellcheck="false" placeholder="Exemplo:\nG                 C\nMinha letra começa aqui\n\nD                 G\nOutra linha da música">${esc(music.chords || music.lyrics || '')}</textarea><div class="form-text">Dica: use espaços para alinhar o acorde sobre a palavra desejada.</div><pre class="border rounded-3 bg-light p-3 mt-3 mb-0 font-monospace" id="chord-preview" style="white-space:pre-wrap"></pre></div><div class="modal-footer"><button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button><button class="btn btn-success" type="submit"><i class="bi bi-save me-1"></i>Salvar cifra própria</button></div></form></div>`;
    document.body.append(box); const modal = new bootstrap.Modal(box), form = box.querySelector('form'), area = form.chords, preview = box.querySelector('#chord-preview');
    const draw = () => { preview.textContent = area.value || 'A cifra aparecerá aqui.'; };
    draw(); area.oninput = draw;
    box.querySelectorAll('.chord-note').forEach(button => button.onclick = () => { const start = area.selectionStart, end = area.selectionEnd, note = `${button.dataset.note} `; area.setRangeText(note, start, end, 'end'); area.focus(); draw(); });
    form.onsubmit = async event => { event.preventDefault(); const save = form.querySelector('[type="submit"]'); save.disabled = true; try { await API.put(`/music/${music.id}`, { ...details(music), chords: area.value }); modal.hide(); UI.alert('Cifra própria salva.'); await addLinks(); } catch (error) { UI.alert(error.message, 'danger'); save.disabled = false; } };
    box.addEventListener('hidden.bs.modal', () => box.remove(), { once: true }); modal.show();
  }
  document.body.insertAdjacentHTML('beforeend', `<div class="modal fade" id="listen-modal" tabindex="-1"><div class="modal-dialog modal-sm modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="fs-5 modal-title"><i class="bi bi-headphones me-2"></i>Ouvir música</h2><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><p class="text-secondary small">Onde você quer pesquisar esta música?</p><div class="d-grid gap-2"><button class="btn btn-success" data-listen="spotify"><i class="bi bi-spotify me-2"></i>Spotify</button><button class="btn btn-danger" data-listen="youtube"><i class="bi bi-youtube me-2"></i>YouTube</button></div></div></div></div></div>`);
  const listenModal = new bootstrap.Modal(document.querySelector('#listen-modal'));
  document.querySelectorAll('[data-listen]').forEach(button => button.onclick = () => { listenModal.hide(); openPlatform(button.dataset.listen); });
  const addLinks = async () => {
    const table = [...document.querySelectorAll('#app table')].find(item => item.querySelector('th')?.textContent.trim() === 'Título'); if (!table) return;
    const songs = await API.get('/music'), byId = new Map(songs.map(item => [String(item.id), item]));
    table.querySelectorAll('.del[data-id]').forEach(removeButton => {
      const actions = removeButton.parentElement; actions.querySelectorAll('.view-lyrics,.music-search-links').forEach(element => element.remove());
      const song = byId.get(removeButton.dataset.id); if (!song) return; const terms = `${song.title} ${song.artist_name || ''}`.trim(), encoded = encodeURIComponent(terms);
      removeButton.insertAdjacentHTML('beforebegin', `<span class="music-search-links"><span class="btn-group me-1"><button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-card-text me-1"></i>Letra</button><ul class="dropdown-menu"><li><button class="dropdown-item own-lyrics" data-id="${song.id}"><i class="bi bi-pencil-square me-2"></i>Letra própria</button></li><li><a class="dropdown-item" href="https://www.letras.mus.br/?q=${encoded}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-2"></i>Letras.com.br</a></li></ul></span><span class="btn-group me-1"><button class="btn btn-sm btn-outline-success dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-music-note-list me-1"></i>Cifra</button><ul class="dropdown-menu"><li><button class="dropdown-item own-chords" data-id="${song.id}"><i class="bi bi-pencil-square me-2"></i>Cifra própria</button></li><li><a class="dropdown-item" href="https://www.cifraclub.com.br/?q=${encoded}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-2"></i>Cifra Club</a></li></ul></span><button class="btn btn-sm btn-outline-danger me-1 listen-music" data-terms="${esc(terms)}"><i class="bi bi-headphones me-1"></i>Ouvir</button></span>`);
    });
    document.querySelectorAll('.listen-music').forEach(button => button.onclick = () => { selectedTerms = button.dataset.terms; listenModal.show(); });
    document.querySelectorAll('.own-lyrics').forEach(button => button.onclick = () => showOwnLyrics(byId.get(button.dataset.id)));
    document.querySelectorAll('.own-chords').forEach(button => button.onclick = () => editChords(byId.get(button.dataset.id)));
  };
  new MutationObserver(() => addLinks().catch(() => {})).observe(document.body, { childList: true, subtree: true }); addLinks().catch(() => {});
});
