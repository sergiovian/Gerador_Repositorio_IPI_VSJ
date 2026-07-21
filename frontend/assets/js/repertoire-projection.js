if (document.documentElement.dataset.page === 'repertoires') {
  async function openProjector(url) {
    const popup = window.open('about:blank', 'projection', `popup=yes,width=${screen.availWidth},height=${screen.availHeight},left=${screen.availLeft || 0},top=${screen.availTop || 0}`);
    if (!popup) throw Error('O navegador bloqueou a janela de projeção. Permita pop-ups para este site.');
    try {
      if ('getScreenDetails' in window) {
        const details = await window.getScreenDetails();
        const secondScreen = details.screens.find(item => !item.isPrimary) || details.currentScreen;
        popup.moveTo(secondScreen.availLeft, secondScreen.availTop);
        popup.resizeTo(secondScreen.availWidth, secondScreen.availHeight);
      }
    } catch (_) { /* Sem permissão de múltiplas telas, a janela abre no monitor atual. */ }
    popup.location.replace(url); popup.focus();
  }
  new MutationObserver(async () => {
    const table = [...document.querySelectorAll('#app table')].find(item => item.querySelector('th')?.textContent.trim() === 'Culto');
    if (!table || table.dataset.projection) return;
    table.dataset.projection = '1'; const records = await API.get('/repertoires');
    [...table.querySelectorAll('tbody tr')].forEach((row, index) => { const record = records[index], cell = row.lastElementChild; if (record && !cell.querySelector('.start-projection')) cell.insertAdjacentHTML('beforeend', ` <button class="btn btn-sm btn-dark start-projection" data-id="${record.id}"><i class="bi bi-projector"></i> Projetar</button>`); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('click', async event => {
    const button = event.target.closest('.start-projection'); if (!button) return;
    const base = location.origin, projector = `${base}/pages/projection.html?repertoire=${button.dataset.id}&v=4`, controlPath = `/pages/projection-control.html?repertoire=${button.dataset.id}`, login = `${base}/login?next=${encodeURIComponent(controlPath)}`, qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(login)}`;
    try { await openProjector(projector); } catch (error) { UI.alert(error.message, 'warning'); }
    const box = document.createElement('div'); box.className = 'modal fade'; box.tabIndex = -1;
    box.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content text-center"><div class="modal-header"><h2 class="modal-title fs-5">Controle pelo celular</h2><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><p>A projeção abriu em uma janela separada. No projetor, toque em <strong>“Iniciar em tela cheia”</strong> para remover todas as bordas.</p><p>Aponte a câmera para o QR Code para controlar pelo celular.</p><img src="${qr}" width="240" height="240" alt="QR Code para controle da projeção"><p class="small text-break mt-3"><a href="${login}" target="_blank">Abrir controle manualmente</a></p></div></div></div>`;
    document.body.append(box); const modal = new bootstrap.Modal(box); box.addEventListener('hidden.bs.modal', () => box.remove(), { once: true }); modal.show();
  });
}
