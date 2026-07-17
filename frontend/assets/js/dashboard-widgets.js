if (document.documentElement.dataset.page === 'dashboard') {
  const observer = new MutationObserver(() => {
    const app = document.querySelector('#app');
    if (!app?.querySelector('.stat-card') || app.dataset.dashboardWidgets) return;
    app.dataset.dashboardWidgets = 'true';
    [...app.querySelectorAll('h2')].find(title => title.textContent.trim() === 'Músicas mais usadas')?.closest('.col-lg-7')?.remove();

    API.get('/dashboard/summary').then(async data => {
      const mostUsed = data.mostUsed || [];
      const maximum = Math.max(1, ...mostUsed.map(item => item.uses));
      const columns = mostUsed.length ? `<div class="d-flex align-items-end gap-3" style="height:220px">${mostUsed.map(item => `<div class="d-flex flex-column justify-content-end align-items-center h-100 flex-fill"><strong class="small mb-1">${item.uses}x</strong><div class="w-100 rounded-top" title="${UI.esc(item.title)}" style="height:${Math.max(12,Math.round(item.uses/maximum*170))}px;background:#7d1e39"></div><small class="text-center text-truncate w-100 mt-2" title="${UI.esc(item.title)}">${UI.esc(item.title)}</small></div>`).join('')}</div>` : '<p class="text-secondary mb-0">Ainda não há músicas executadas.</p>';
      app.insertAdjacentHTML('beforeend', `<div class="row g-4 mt-1"><div class="col-lg-7"><div class="card panel p-4 h-100"><h2 class="h5 mb-4"><i class="bi bi-bar-chart-fill me-2"></i>Músicas mais tocadas</h2>${columns}</div></div><div class="col-lg-5"><div class="card panel p-4 h-100"><h2 class="h5">Sugestão rápida</h2><p class="text-secondary small">Sorteie uma música sem regras de repertório.</p><div class="d-grid gap-2"><button class="btn btn-outline-primary" data-quick-type="HINO"><i class="bi bi-book me-1"></i>Sugerir hino</button><button class="btn btn-primary" data-quick-type="LOUVOR"><i class="bi bi-music-note-beamed me-1"></i>Sugerir louvor</button></div><div id="quick-suggestion" class="mt-3"></div></div></div></div>`);
      app.querySelectorAll('[data-quick-type]').forEach(button => button.onclick = async () => {
        const type = button.dataset.quickType;
        const music = (await API.get('/music')).filter(item => item.type === type && item.active);
        const picked = music.length ? music[crypto.getRandomValues(new Uint32Array(1))[0] % music.length] : null;
        document.querySelector('#quick-suggestion').innerHTML = picked ? `<div class="alert alert-light border mb-0"><strong>${UI.esc(picked.title)}</strong><br><span class="small text-secondary">${UI.esc(picked.artist_name || 'Sem artista informado')}</span></div>` : '<div class="alert alert-warning mb-0">Não há músicas disponíveis.</div>';
      });
      try { await API.get('/admin/churches'); app.insertAdjacentHTML('beforeend','<div class="mt-4"><a class="btn btn-outline-secondary" href="/pages/churches.html"><i class="bi bi-buildings me-1"></i>Gerenciar igrejas cadastradas</a></div>'); } catch (_) {}
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
