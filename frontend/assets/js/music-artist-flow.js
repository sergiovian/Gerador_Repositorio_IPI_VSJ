window.MusicArtist = {
  async resolve(name) {
    const clean = String(name || '').trim();
    if (!clean) return null;
    const artists = await API.get('/artists');
    const found = artists.find(artist => artist.name.localeCompare(clean, 'pt-BR', { sensitivity: 'accent' }) === 0);
    return found || API.post('/artists', { name: clean });
  }
};
if (document.documentElement.dataset.page === 'music') new MutationObserver(() => {
  const form = document.querySelector('#mf');
  if (!form || form.dataset.artistFlow) return;
  const select = form.querySelector('[name="artist_id"]');
  if (!select) return;
  form.dataset.artistFlow = '1';
  select.closest('div').innerHTML = '<label class="form-label small fw-semibold">Artista</label><input class="form-control" name="artist_name" placeholder="Digite o artista"><small class="text-secondary">O artista será criado automaticamente, se necessário.</small>';
  form.onsubmit = async event => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(form));
    try {
      UI.load(); const artist = await MusicArtist.resolve(form.artist_name.value);
      values.artist_id = artist?.id || null; values.energy = Number(values.energy); values.active = true;
      values.tag_ids = [...form.querySelectorAll('[name="tag_ids"] option:checked')].map(option => Number(option.value));
      await API.post('/music', values); UI.alert('Música salva.'); await music();
    } catch (error) { UI.alert(error.message, 'danger'); } finally { UI.load(false); }
  };
}).observe(document.documentElement, { childList: true, subtree: true });
