if (document.documentElement.dataset.page === 'repertoires') {
  const musicPayload = (music, form) => ({
    title: music.title,
    artist_id: music.artist_id || null,
    type: music.type,
    energy: music.energy,
    key: music.key || '',
    bpm: music.bpm,
    duration: music.duration,
    lyrics: form.lyrics.value,
    chords: form.chords.value,
    youtube_url: music.youtube_url,
    cifra_url: music.cifra_url,
    notes: music.notes,
    active: !!music.active,
    tag_ids: (music.tags || []).map(tag => Number(tag.id))
  });

  function showList(box) {
    box.querySelector('.cult-music-list').classList.remove('d-none');
    box.querySelector('.cult-music-editor').classList.add('d-none');
    box.querySelector('.modal-title').textContent = 'Músicas do culto';
  }

  async function showEditor(box, musicId) {
    const list = box.querySelector('.cult-music-list');
    const editor = box.querySelector('.cult-music-editor');
    editor.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="text-secondary mt-3 mb-0">Carregando música…</p></div>';
    list.classList.add('d-none');
    editor.classList.remove('d-none');

    try {
      const music = await API.get(`/music/${musicId}`);
      box.querySelector('.modal-title').textContent = `Editar: ${music.title}`;
      editor.innerHTML = `
        <form class="cult-song-form">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
            <button type="button" class="btn btn-sm btn-outline-secondary back-to-cult-music">
              <i class="bi bi-arrow-left me-1"></i>Voltar às músicas
            </button>
            <span class="small text-secondary">${UI.esc(music.artist_name || 'Artista não informado')}</span>
          </div>
          <div class="alert alert-light border small">
            A letra é usada na projeção. Na cifra própria, mantenha os acordes alinhados acima das palavras.
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold" for="cult-song-lyrics">Letra</label>
            <textarea id="cult-song-lyrics" class="form-control" name="lyrics" rows="11" spellcheck="true" placeholder="Digite ou cole a letra da música">${UI.esc(music.lyrics || '')}</textarea>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold" for="cult-song-chords">Cifra própria</label>
            <textarea id="cult-song-chords" class="form-control font-monospace" name="chords" rows="11" spellcheck="false" placeholder="G                 C&#10;Minha letra começa aqui">${UI.esc(music.chords || '')}</textarea>
            <div class="form-text">Você pode editar, apagar ou reposicionar os acordes livremente.</div>
          </div>
          <div class="d-flex flex-column flex-sm-row justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary back-to-cult-music">Cancelar</button>
            <button type="submit" class="btn btn-primary">
              <i class="bi bi-save me-1"></i>Salvar letra e cifra
            </button>
          </div>
        </form>`;

      editor.querySelectorAll('.back-to-cult-music').forEach(button => {
        button.addEventListener('click', () => showList(box));
      });

      editor.querySelector('form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
          await API.put(`/music/${music.id}`, musicPayload(music, form));
          UI.alert('Letra e cifra atualizadas com sucesso.');
          showList(box);
        } catch (error) {
          UI.alert(error.message, 'danger');
          submit.disabled = false;
        }
      });
    } catch (error) {
      editor.innerHTML = `<div class="alert alert-danger mb-3">${UI.esc(error.message)}</div><button type="button" class="btn btn-outline-secondary back-to-cult-music"><i class="bi bi-arrow-left me-1"></i>Voltar</button>`;
      editor.querySelector('.back-to-cult-music').addEventListener('click', () => showList(box));
    }
  }

  document.addEventListener('click', async event => {
    const button = event.target.closest('.view-repertoire');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    try {
      const repertoire = await API.get(`/repertoires/${button.dataset.id}`);
      const box = document.createElement('div');
      box.className = 'modal fade';
      box.tabIndex = -1;
      box.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <div>
                <h2 class="modal-title fs-5">Músicas do culto</h2>
                <small class="text-secondary">Clique em uma música para editar sua letra e cifra.</small>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
              <div class="cult-music-list list-group">
                ${repertoire.items.length ? repertoire.items.map(item => `
                  <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-3 edit-cult-music" data-music-id="${item.music_id}">
                    <span class="text-start">
                      <strong>${UI.esc(item.title)}</strong><br>
                      <small class="text-secondary">${UI.esc(item.artist_name || 'Artista não informado')}</small>
                    </span>
                    <span class="btn btn-sm btn-outline-primary text-nowrap"><i class="bi bi-pencil-square me-1"></i>Editar</span>
                  </button>`).join('') : '<div class="text-secondary text-center py-4">Este culto não possui músicas.</div>'}
              </div>
              <div class="cult-music-editor d-none"></div>
            </div>
          </div>
        </div>`;

      document.body.append(box);
      const modal = new bootstrap.Modal(box);
      box.addEventListener('hidden.bs.modal', () => box.remove(), { once: true });
      box.querySelectorAll('.edit-cult-music').forEach(item => {
        item.addEventListener('click', () => showEditor(box, item.dataset.musicId));
      });
      modal.show();
    } catch (error) {
      UI.alert(error.message, 'danger');
    }
  }, true);
}
