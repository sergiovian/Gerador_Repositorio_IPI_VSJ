document.addEventListener('DOMContentLoaded', () => {
  if (document.documentElement.dataset.page !== 'music') return;
  const addLinks = async () => {
    const table = [...document.querySelectorAll('#app table')].find(item => item.querySelector('th')?.textContent.trim() === 'Título');
    if (!table) return;
    const music = await API.get('/music');
    const byId = new Map(music.map(item => [String(item.id), item]));
    table.querySelectorAll('.del[data-id]').forEach(removeButton => {
      const actions = removeButton.parentElement;
      actions.querySelectorAll('a[href*="letras.mus.br"],a[href*="cifraclub.com.br"]').forEach(link => { if (!link.closest('.music-search-links')) link.remove(); });
      if (actions.querySelector('.music-search-links')) return;
      const item = byId.get(removeButton.dataset.id);
      if (!item) return;
      const terms = encodeURIComponent(`${item.title} ${item.artist_name || ''}`.trim());
      removeButton.insertAdjacentHTML('beforebegin', `<span class="music-search-links"><a class="btn btn-sm btn-outline-primary me-1" href="https://www.letras.mus.br/?q=${terms}" target="_blank" rel="noopener">Letra</a><a class="btn btn-sm btn-outline-success me-1" href="https://www.cifraclub.com.br/?q=${terms}" target="_blank" rel="noopener">Cifra</a></span>`);
    });
  };
  new MutationObserver(() => addLinks().catch(() => {})).observe(document.body, { childList: true, subtree: true });
  addLinks().catch(() => {});
});
