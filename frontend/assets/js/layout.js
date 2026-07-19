window.Layout = {
  render(page, title) {
    const links = [['dashboard','Visão geral','/'],['repertoires','Cultos','/pages/repertoires.html'],['generate','Planejar culto','/pages/generate-repertoire.html'],['music','Biblioteca de músicas','/pages/music.html'],['bible','Bíblia e projeção','/pages/bible.html'],['tuner','Afinador de violão','/pages/tuner.html'],['tags','Categorias','/pages/tags.html'],['history','Histórico','/pages/history.html'],['settings','Configurações','/pages/settings.html']];
    document.body.innerHTML = `<div class="loading" id="loading"><div class="spinner-border text-primary"></div></div><button class="sidebar-reveal d-none d-md-inline-flex" id="sidebar-reveal" type="button" aria-label="Mostrar menu"><i class="bi bi-list"></i></button><div class="mobile-menu-backdrop" id="mobile-menu-backdrop"></div><div class="d-md-flex"><aside class="app-sidebar p-3" id="side"><div class="d-flex align-items-center gap-2 text-white mb-3"><img src="/assets/img/logo-ipi.jpg" alt="IPI" class="brand-logo"><div><small class="d-block">IPI Vila São José</small><strong>Gestor de Cultos</strong></div><button class="btn btn-sm text-white ms-auto d-md-none" id="mobile-menu-close" type="button" aria-label="Fechar menu"><i class="bi bi-x-lg"></i></button></div><nav class="nav flex-column gap-1">${links.map(x => `<a class="nav-link ${page === x[0] ? 'active' : ''}" href="${x[2]}"><i class="bi bi-circle-fill me-2 small"></i>${x[1]}</a>`).join('')}</nav></aside><main class="page-main flex-grow-1 p-4 p-lg-5"><header class="d-flex justify-content-between align-items-center mb-4"><div><p class="text-secondary mb-1">IPI Vila São José</p><h1 class="h3 mb-0">${title}</h1></div><div class="d-flex gap-2 align-items-center"><button class="btn btn-outline-primary d-md-none" id="mobile-menu-toggle" type="button" aria-label="Abrir menu"><i class="bi bi-list"></i></button><button class="btn btn-outline-secondary" type="button" onclick="API.logout()"><i class="bi bi-box-arrow-right me-1"></i>Sair</button><span class="bg-white rounded-circle p-3 shadow-sm"><i class="bi bi-calendar2-heart"></i></span></div></header><div id="alert"></div><section id="app"></section></main></div>`;
    const side = document.querySelector('#side'), reveal = document.querySelector('#sidebar-reveal');
    const openMobile = () => document.body.classList.add('mobile-menu-open');
    const closeMobile = () => document.body.classList.remove('mobile-menu-open');
    document.querySelector('#mobile-menu-toggle').onclick = openMobile;
    document.querySelector('#mobile-menu-close').onclick = closeMobile;
    document.querySelector('#mobile-menu-backdrop').onclick = closeMobile;
    let touchStart = null;
    window.addEventListener('touchstart', event => { const touch = event.changedTouches[0]; touchStart = { x: touch.clientX, y: touch.clientY }; }, { passive: true });
    window.addEventListener('touchend', event => {
      if (!touchStart || window.innerWidth >= 768) return;
      const touch = event.changedTouches[0], dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0 && touchStart.x < 42) openMobile();
        if (dx < 0 && document.body.classList.contains('mobile-menu-open')) closeMobile();
      }
      touchStart = null;
    }, { passive: true });
    let lastY = window.scrollY;
    const show = () => { document.body.classList.remove('sidebar-hidden'); reveal.classList.add('d-none'); };
    const hide = () => { document.body.classList.add('sidebar-hidden'); reveal.classList.remove('d-none'); };
    reveal.onclick = show; side.addEventListener('mouseenter', show);
    window.addEventListener('scroll', () => { if (window.innerWidth < 768) return; const y = window.scrollY; if (y > 140 && y > lastY + 8) hide(); else if (y < lastY - 12 || y < 50) show(); lastY = y; }, { passive: true });
  }
};
