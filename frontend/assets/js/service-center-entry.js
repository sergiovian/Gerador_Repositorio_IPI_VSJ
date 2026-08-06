if (document.documentElement.dataset.page === 'repertoires') {
  new MutationObserver(async () => {
    const table = [...document.querySelectorAll('#app table')].find(item => item.querySelector('th')?.textContent.trim() === 'Culto');
    if (!table || table.dataset.centerReady) return;
    table.dataset.centerReady = '1';
    try {
      const records = await API.get('/repertoires');
      [...table.querySelectorAll('tbody tr')].forEach((row, index) => {
        const repertoire = records[index];
        const cell = row.lastElementChild;
        if (repertoire && !cell.querySelector('.service-center-link')) cell.insertAdjacentHTML('afterbegin', `<a class="btn btn-sm btn-primary service-center-link me-1" href="/pages/service-center.html?repertoire=${repertoire.id}"><i class="bi bi-broadcast-pin me-1"></i>Central</a>`);
      });
    } catch (_) {}
  }).observe(document.documentElement, { childList: true, subtree: true });
}
