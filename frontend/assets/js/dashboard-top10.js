if (document.documentElement.dataset.page === 'dashboard') {
  const closePopular = () => { document.querySelector('#top10-overlay')?.remove(); document.body.classList.remove('top10-open'); };
  async function openPopular() {
    closePopular();
    const overlay = document.createElement('div'); overlay.id = 'top10-overlay'; overlay.className = 'top10-overlay';
    overlay.innerHTML = `<section class="top10-sheet" role="dialog" aria-modal="true" aria-label="Louvores gospel populares"><header><div><h2><i class="bi bi-youtube"></i> Louvores gospel populares</h2><p>Sugestões para pesquisar e adicionar à biblioteca.</p></div><button type="button" class="top10-close" aria-label="Fechar">×</button></header><div class="top10-list"><div class="py-4 text-center text-secondary"><span class="spinner-border spinner-border-sm me-2"></span>Carregando sugestões…</div></div></section>`;
    document.body.append(overlay); document.body.classList.add('top10-open');
    const close = () => closePopular();
    overlay.querySelector('.top10-close').onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    try {
      const tracks = await API.get('/youtube/gospel'), list = overlay.querySelector('.top10-list');
      list.innerHTML = `<ol class="list-group list-group-numbered">${tracks.map(item => `<li class="list-group-item d-flex gap-3 align-items-center"><div class="flex-grow-1 min-w-0"><strong class="d-block text-truncate">${UI.esc(item.title)}</strong><span class="small text-secondary d-block text-truncate">${UI.esc(item.artist)}</span></div><div class="d-flex gap-2"><a class="btn btn-sm btn-outline-danger" href="${UI.esc(item.url)}" target="_blank" rel="noopener" title="Pesquisar no YouTube"><i class="bi bi-youtube"></i></a><button class="btn btn-sm btn-primary youtube-add" data-track-id="${item.id}"><i class="bi bi-plus-lg me-1"></i>Adicionar</button></div></li>`).join('')}</ol>`;
      list.querySelectorAll('.youtube-add').forEach(button => button.onclick = async () => { button.disabled = true; const original = button.innerHTML; button.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; try { const result = await API.post(`/youtube/gospel/${button.dataset.trackId}/add`, {}); button.className = 'btn btn-sm btn-success'; button.innerHTML = result.duplicate ? '<i class="bi bi-check2 me-1"></i>Já existe' : '<i class="bi bi-check2 me-1"></i>Adicionada'; } catch (error) { button.disabled = false; button.innerHTML = original; UI.alert(error.message, 'danger'); } });
    } catch (error) { overlay.querySelector('.top10-list').innerHTML = `<div class="alert alert-warning mb-0">${UI.esc(error.message)}</div>`; }
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePopular(); });
  new MutationObserver(() => {
    const app = document.querySelector('#app'); if (!app?.querySelector('.stat-card') || document.querySelector('#top10-toggle')) return;
    app.insertAdjacentHTML('afterbegin', '<div class="d-flex justify-content-end mb-3"><button class="btn btn-outline-primary" id="top10-toggle"><i class="bi bi-youtube me-1"></i>Louvores populares</button></div>');
    document.querySelector('#top10-toggle').onclick = openPopular;
  }).observe(document.documentElement, { childList: true, subtree: true });
}
