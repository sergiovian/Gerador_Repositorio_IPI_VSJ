if (document.documentElement.dataset.page === 'generate') {
  new MutationObserver(() => {
    const liturgy = document.querySelector('#liturgy-import');
    const form = document.querySelector('#gf');
    if (!liturgy || !form || document.querySelector('#notices-import')) return;
    liturgy.insertAdjacentHTML('afterend', `<section class="card panel p-4 mt-4" id="notices-import"><div class="d-flex flex-wrap justify-content-between gap-3 align-items-center"><div><h2 class="h5 mb-1"><i class="bi bi-megaphone me-2"></i>Importar avisos e comunicados</h2><p class="text-secondary mb-0">Envie fotos e vídeos para aparecerem como páginas na projeção.</p></div><label class="btn btn-outline-primary mb-0"><i class="bi bi-images me-1"></i>Escolher mídias<input id="notice-files" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple hidden></label></div><div id="notice-list" class="mt-3"></div></section>`);
    const input = document.querySelector('#notice-files'), list = document.querySelector('#notice-list'); let files = [];
    const draw = () => { list.innerHTML = files.length ? `<div class="alert alert-info mb-2"><strong>${files.length}</strong> comunicado(s) pronto(s) para projeção.</div><div class="list-group mb-3">${files.map((file, index) => `<div class="list-group-item d-flex align-items-center justify-content-between gap-2"><span class="text-truncate"><i class="bi bi-${file.type.startsWith('video') ? 'play-btn' : 'image'} me-2"></i>${UI.esc(file.name)}</span><button class="btn btn-sm btn-outline-danger notice-remove" data-index="${index}"><i class="bi bi-trash"></i></button></div>`).join('')}</div><button class="btn btn-primary" id="notice-save"><i class="bi bi-save me-1"></i>Salvar avisos no culto</button>` : '<small class="text-secondary">Formatos aceitos: JPG, PNG, WEBP, GIF, MP4, WEBM e MOV. Máximo de 120 MB por arquivo.</small>'; list.querySelectorAll('.notice-remove').forEach(button => button.onclick = () => { files.splice(Number(button.dataset.index), 1); draw(); }); list.querySelector('#notice-save')?.addEventListener('click', save); };
    const generatedItems = () => [...document.querySelectorAll('#result .repertoire-item')].map((card, index) => ({ music_id: Number(card.dataset.musicId), position: index + 1, role: card.dataset.type || 'LOUVOR', score: 100, reasons: [], warnings: [] })).filter(item => item.music_id);
    async function ensureRepertoire() {
      if (window.liturgyRepertoireId) return window.liturgyRepertoireId;
      const date = form.service_date.value, typeId = Number(form.service_type_id.value);
      if (!date || !typeId) throw Error('Informe a data e o tipo do culto antes de salvar os avisos.');
      const service = await API.post('/services', { service_date: date, service_type_id: typeId, status: 'PLANNED', notes: form.theme.value || null });
      const repertoire = await API.post('/repertoires', { service_id: service.id, quality_score: 100, generation_context: { theme: form.theme.value || null }, items: generatedItems(), liturgy: [] });
      window.liturgyRepertoireId = repertoire.id; return repertoire.id;
    }
    async function save(event) {
      const button = event.currentTarget; button.disabled = true;
      try {
        UI.load(); const repertoireId = await ensureRepertoire();
        const mediaPages = [];
        for (const file of files) { const body = new FormData(); body.append('file', file); const response = await fetch(`/api/repertoires/${repertoireId}/media`, { method: 'POST', body }); const json = await response.json(); if (!response.ok) throw Error(json.error?.message || 'Não foi possível enviar ' + file.name); mediaPages.push({ type: 'media', mediaType: json.data.type, mediaUrl: json.data.url, title: file.name.replace(/\.[^.]+$/, ''), content: 'Comunicado: ' + file.name }); }
        const textPages = (window.importedLiturgy || []).filter(page => String(page.content || '').trim());
        const pages = [...textPages, ...mediaPages].map((page, index) => ({ ...page, position: index + 1 }));
        await API.put(`/repertoires/${repertoireId}/liturgy`, { pages }); files = []; draw(); UI.alert('Avisos salvos e prontos para projeção.', 'success');
      } catch (error) { UI.alert(error.message, 'danger'); } finally { UI.load(false); button.disabled = false; }
    }
    input.onchange = event => { files.push(...[...event.target.files]); input.value = ''; draw(); };
    draw();
  }).observe(document.documentElement, { childList: true, subtree: true });
}
