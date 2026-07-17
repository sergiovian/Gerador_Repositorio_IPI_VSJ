function pickRandom(items) {
  return items.length ? items[crypto.getRandomValues(new Uint32Array(1))[0] % items.length] : null;
}

function updateRepertoireCard(card, music) {
  card.dataset.musicId = music.id;
  card.querySelector('strong').textContent = `${card.dataset.position}. ${card.dataset.type} — ${music.title}`;
  card.querySelector('.music-artist').textContent = music.artist_name || 'Sem artista informado';
}

function manualPicker(items) {
  return new Promise(resolve => {
    const element = document.createElement('div');
    element.className = 'modal fade'; element.tabIndex = -1;
    element.innerHTML = `<div class="modal-dialog modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5">Escolher música</h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><input class="form-control mb-3" placeholder="Pesquisar por título ou artista"><div class="list-group"></div></div></div></div>`;
    document.body.append(element);
    const modal = new bootstrap.Modal(element), input = element.querySelector('input'), list = element.querySelector('.list-group');
    const render = () => {
      const term = input.value.trim().toLowerCase();
      const filtered = items.filter(item => `${item.title} ${item.artist_name || ''}`.toLowerCase().includes(term));
      list.innerHTML = filtered.length ? filtered.map(item => `<button type="button" class="list-group-item list-group-item-action" data-id="${item.id}"><strong>${UI.esc(item.title)}</strong><br><small class="text-secondary">${UI.esc(item.artist_name || 'Sem artista informado')}</small></button>`).join('') : '<p class="text-secondary mb-0">Nenhuma música encontrada.</p>';
      list.querySelectorAll('[data-id]').forEach(button => button.onclick = () => { modal.hide(); resolve(items.find(item => item.id === Number(button.dataset.id))); });
    };
    input.oninput = render; element.addEventListener('hidden.bs.modal', () => { element.remove(); resolve(null); }, { once: true });
    render(); modal.show(); input.focus();
  });
}

document.addEventListener('click', async event => {
  const button = event.target.closest('.replace-music');
  if (!button) return;
  event.preventDefault(); event.stopImmediatePropagation();
  const card = button.closest('.repertoire-item'), expectedType = card.dataset.type === 'HINO' ? 'HINO' : 'LOUVOR';
  const catalog = await API.get('/music');
  const used = new Set([...document.querySelectorAll('.repertoire-item')].filter(item => item !== card).map(item => Number(item.dataset.musicId)));
  const choices = catalog.filter(item => item.type === expectedType && item.active && !used.has(item.id));
  if (!choices.length) return UI.alert('Não há outra música disponível para esta posição.', 'warning');
  const chooseManually = confirm('OK: escolher manualmente. Cancelar: sortear música aleatória.');
  const picked = chooseManually ? await manualPicker(choices) : pickRandom(choices);
  if (picked) updateRepertoireCard(card, picked);
}, true);
