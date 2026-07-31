document.addEventListener('DOMContentLoaded', () => {
  if (document.documentElement.dataset.page !== 'music') return;
  let selectedTerms = '';
  const openPlatform = platform => window.open(platform === 'spotify' ? `https://open.spotify.com/search/${encodeURIComponent(selectedTerms)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTerms)}`, '_blank', 'noopener');
  const details = music => ({ title: music.title, artist_id: music.artist_id, type: music.type, energy: music.energy, key: music.key, bpm: music.bpm, duration: music.duration, lyrics: music.lyrics || '', chords: music.chords || '', youtube_url: music.youtube_url, cifra_url: music.cifra_url, notes: music.notes, active: !!music.active, tag_ids: (music.tags || []).map(tag => tag.id) });
  const esc = UI.esc;
  function openLyricsBrowser(music) {
    const terms = `${music.title} ${music.artist_name || ''}`.trim();
    const url = `https://www.letras.mus.br/?q=${encodeURIComponent(terms)}`;
    const browser = document.createElement('section'); browser.className = 'chord-browser';
    browser.innerHTML = `<div class="chord-browser-card chord-browser-blocked"><header><strong><i class="bi bi-search me-2"></i>Pesquisar letra: ${esc(music.title)}</strong><button type="button" class="btn-close chord-browser-close" aria-label="Voltar ao editor"></button></header><div class="chord-browser-message"><i class="bi bi-box-arrow-up-right"></i><h3>Abra a busca em uma nova guia</h3><p>O Letras.com.br não permite ser exibido dentro de aplicativos. O editor de cifra continuará aberto nesta guia, exatamente como está.</p><button type="button" class="btn btn-primary chord-open-external"><i class="bi bi-search me-1"></i>Abrir pesquisa de “${esc(music.title)}”</button><button type="button" class="btn btn-outline-secondary chord-browser-close">Voltar ao editor para colar</button><small>Após copiar a letra, volte para esta guia, cole no editor e posicione os acordes.</small></div></div>`;
    document.body.append(browser); browser.querySelectorAll('.chord-browser-close').forEach(button => button.onclick = () => browser.remove()); browser.querySelector('.chord-open-external').onclick = () => window.open(url, '_blank', 'noopener');
  }
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
    const search = document.createElement('button'); search.type = 'button'; search.className = 'btn btn-outline-primary mb-3'; search.innerHTML = '<i class="bi bi-search me-1"></i>Pesquisar letra online';
    form.querySelector('.modal-body').insertAdjacentElement('afterbegin', search); search.onclick = () => openLyricsBrowser(music);
    const draw = () => { preview.textContent = area.value || 'A cifra aparecerá aqui.'; };
    const grid = document.createElement('div'); grid.className = 'chord-grid mb-3';
    grid.innerHTML = '<div class="small fw-semibold text-secondary mb-2">Toque no quadradinho acima da palavra e digite ou escolha um acorde:</div>';
    form.querySelector('.chord-palette').insertAdjacentElement('afterend', grid);
    const lyricLines = String(music.lyrics || '').split(/\r?\n/).filter(line => line.trim()); let activeSlot = null;
    const palette = form.querySelector('.chord-palette'); palette.classList.add('d-none');
    const clearChord = document.createElement('button'); clearChord.type = 'button'; clearChord.className = 'btn btn-sm btn-outline-danger chord-clear'; clearChord.innerHTML = '<i class="bi bi-eraser me-1"></i>Limpar acorde'; palette.append(clearChord);
    const oldLines = String(music.chords || '').split(/\r?\n/);
    const previousChordLine = lyric => { const index = oldLines.findIndex(line => line.trim() === lyric.trim()); return index > 0 ? oldLines[index - 1] : ''; };
    const slots = [];
    function syncFromGrid() {
      const grouped = lyricLines.map((line, lineIndex) => {
        const chars = Array(Math.max(line.length + 20, 1)).fill(' ');
        slots.filter(slot => Number(slot.dataset.line) === lineIndex && String(slot.dataset.chord || '').trim()).forEach(slot => {
          const start = Number(slot.dataset.column), chord = String(slot.dataset.chord || '').trim();
          [...chord].forEach((character, index) => { chars[start + index] = character; });
        });
        return `${chars.join('').replace(/\s+$/, '')}\n${line}`;
      });
      area.value = grouped.join('\n\n'); draw();
    }
    lyricLines.forEach((line, lineIndex) => {
      const row = document.createElement('div'); row.className = 'chord-grid-line';
      const slotRow = document.createElement('div'); slotRow.className = 'chord-slot-row';
      const lyric = document.createElement('div'); lyric.className = 'chord-lyric-line'; lyric.textContent = line;
      const chordLine = previousChordLine(line), step = 4, count = Math.ceil(Math.max(line.length, 20) / step);
      for (let index = 0; index < count; index++) {
        const column = index * step, saved = chordLine.slice(column).match(/^\s*([A-G][#b]?(?:m|M|maj7|sus4|sus2|add9|7|9|6|dim|aug)?)/)?.[1] || '';
        const slot = document.createElement('button'); slot.type = 'button'; slot.className = 'chord-slot'; slot.dataset.line = lineIndex; slot.dataset.column = column; slot.dataset.chord = saved; slot.textContent = saved; slot.setAttribute('aria-label', `Acorde na posição ${index + 1} da linha ${lineIndex + 1}`);
        slot.onfocus = () => { activeSlot = slot; palette.classList.remove('d-none'); };
        slot.onclick = () => { activeSlot = slot; palette.classList.remove('d-none'); };
        slotRow.append(slot); slots.push(slot);
      }
      row.append(slotRow, lyric); grid.append(row);
    });
    if (!lyricLines.length) {
      grid.insertAdjacentHTML('beforeend', '<div class="alert alert-warning mb-0"><strong>Esta música ainda não possui letra própria.</strong><br>Cole a letra na caixa abaixo e clique em <em>Criar campos de acordes</em>.</div><button type="button" class="btn btn-outline-success mt-3" id="create-chord-slots"><i class="bi bi-grid-3x3-gap me-1"></i>Criar campos de acordes com a letra colada</button>');
      grid.querySelector('#create-chord-slots').onclick = () => {
        const lyrics = area.value.trim();
        if (!lyrics) { UI.alert('Cole a letra da música na caixa abaixo antes de criar os campos.', 'warning'); area.focus(); return; }
        music.lyrics = lyrics; music.chords = ''; modal.hide(); setTimeout(() => editChords(music), 250);
      };
    }
    draw(); area.oninput = draw;
    clearChord.onclick = () => { if (!activeSlot) return; activeSlot.dataset.chord = ''; activeSlot.textContent = ''; syncFromGrid(); activeSlot.focus(); };
    box.querySelectorAll('.chord-note').forEach(button => button.onclick = () => { if (activeSlot) { activeSlot.dataset.chord = button.dataset.note; activeSlot.textContent = button.dataset.note; syncFromGrid(); activeSlot.focus(); return; } const start = area.selectionStart, end = area.selectionEnd, note = `${button.dataset.note} `; area.setRangeText(note, start, end, 'end'); area.focus(); draw(); });
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
      const actions = removeButton.parentElement;
      // Abrir um dropdown do Bootstrap também altera o DOM. Não recrie os botões
      // nesse momento, pois a recriação fecha o menu antes do clique do usuário.
      if (actions.querySelector('.music-search-links')) return;
      actions.querySelectorAll('.view-lyrics').forEach(element => element.remove());
      const song = byId.get(removeButton.dataset.id); if (!song) return; const terms = `${song.title} ${song.artist_name || ''}`.trim(), encoded = encodeURIComponent(terms);
      removeButton.insertAdjacentHTML('beforebegin', `<span class="music-search-links"><span class="btn-group me-1"><button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-card-text me-1"></i>Letra</button><ul class="dropdown-menu"><li><button class="dropdown-item own-lyrics" data-id="${song.id}"><i class="bi bi-pencil-square me-2"></i>Letra própria</button></li><li><a class="dropdown-item" href="https://www.letras.mus.br/?q=${encoded}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-2"></i>Letras.com.br</a></li></ul></span><span class="btn-group me-1"><button class="btn btn-sm btn-outline-success dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-music-note-list me-1"></i>Cifra</button><ul class="dropdown-menu"><li><button class="dropdown-item own-chords" data-id="${song.id}"><i class="bi bi-pencil-square me-2"></i>Cifra própria</button></li><li><a class="dropdown-item" href="https://www.cifraclub.com.br/?q=${encoded}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-2"></i>Cifra Club</a></li></ul></span><button class="btn btn-sm btn-outline-danger me-1 listen-music" data-terms="${esc(terms)}"><i class="bi bi-headphones me-1"></i>Ouvir</button></span>`);
    });
    document.querySelectorAll('.listen-music').forEach(button => button.onclick = () => { selectedTerms = button.dataset.terms; listenModal.show(); });
    document.querySelectorAll('.own-lyrics').forEach(button => button.onclick = () => showOwnLyrics(byId.get(button.dataset.id)));
    document.querySelectorAll('.own-chords').forEach(button => button.onclick = () => editChords(byId.get(button.dataset.id)));
  };
  new MutationObserver(() => addLinks().catch(() => {})).observe(document.body, { childList: true, subtree: true }); addLinks().catch(() => {});
});
