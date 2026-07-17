document.addEventListener('DOMContentLoaded', () => {
  if (document.documentElement.dataset.page !== 'music') return;
  let selectedTerms = '';
  const openPlatform = platform => window.open(platform === 'spotify' ? `https://open.spotify.com/search/${encodeURIComponent(selectedTerms)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTerms)}`, '_blank', 'noopener');
  document.body.insertAdjacentHTML('beforeend', `<div class="modal fade" id="listen-modal" tabindex="-1"><div class="modal-dialog modal-sm modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="fs-5 modal-title"><i class="bi bi-headphones me-2"></i>Ouvir música</h2><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><p class="text-secondary small">Onde você quer pesquisar esta música?</p><div class="d-grid gap-2"><button class="btn btn-success" data-listen="spotify"><i class="bi bi-spotify me-2"></i>Spotify</button><button class="btn btn-danger" data-listen="youtube"><i class="bi bi-youtube me-2"></i>YouTube</button></div></div></div></div></div>`);
  const listenModal = new bootstrap.Modal(document.querySelector('#listen-modal'));
  document.querySelectorAll('[data-listen]').forEach(button => button.onclick = () => { listenModal.hide(); openPlatform(button.dataset.listen); });
  const addLinks = async () => {
    const table = [...document.querySelectorAll('#app table')].find(item => item.querySelector('th')?.textContent.trim() === 'Título');
    if (!table) return;
    const music = await API.get('/music'); const byId = new Map(music.map(item => [String(item.id), item]));
    table.querySelectorAll('.del[data-id]').forEach(removeButton => {
      const actions = removeButton.parentElement;
      actions.querySelectorAll('a[href*="letras.mus.br"],a[href*="cifraclub.com.br"]').forEach(link => { if (!link.closest('.music-search-links')) link.remove(); });
      if (actions.querySelector('.music-search-links')) return;
      const item = byId.get(removeButton.dataset.id); if (!item) return;
      const terms = `${item.title} ${item.artist_name || ''}`.trim(), encoded = encodeURIComponent(terms);
      removeButton.insertAdjacentHTML('beforebegin', `<span class="music-search-links"><a class="btn btn-sm btn-outline-primary me-1" href="https://www.letras.mus.br/?q=${encoded}" target="_blank" rel="noopener"><i class="bi bi-card-text me-1"></i>Letra</a><a class="btn btn-sm btn-outline-success me-1" href="https://www.cifraclub.com.br/?q=${encoded}" target="_blank" rel="noopener"><i class="bi bi-music-note-list me-1"></i>Cifra</a><button class="btn btn-sm btn-outline-danger me-1 listen-music" data-terms="${UI.esc(terms)}"><i class="bi bi-headphones me-1"></i>Ouvir</button></span>`);
    });
    document.querySelectorAll('.listen-music').forEach(button => button.onclick = () => { selectedTerms = button.dataset.terms; listenModal.show(); });
  };
  new MutationObserver(() => addLinks().catch(() => {})).observe(document.body, { childList: true, subtree: true }); addLinks().catch(() => {});
});
