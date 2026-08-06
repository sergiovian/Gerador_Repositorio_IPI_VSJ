if (document.documentElement.dataset.page === 'repertoires') {
  const dateText = value => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const loadPdf = () => new Promise((resolve, reject) => {
    if (window.jspdf) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Não foi possível carregar o gerador de PDF.'));
    document.head.append(script);
  });

  async function loadLogo(profile) {
    try {
      const blob = await fetch(profile.logoUrl).then(response => {
        if (!response.ok) throw new Error();
        return response.blob();
      });
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) return null;
      return await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ data: reader.result, format: blob.type === 'image/png' ? 'PNG' : blob.type === 'image/webp' ? 'WEBP' : 'JPEG' });
        reader.readAsDataURL(blob);
      });
    } catch (_) {
      return null;
    }
  }

  async function download(id) {
    await loadPdf();
    const [repertoire, profile] = await Promise.all([API.get(`/repertoires/${id}`), API.get('/church/profile')]);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const margin = 18;
    const image = await loadLogo(profile);

    pdf.setFillColor(125, 0, 25);
    pdf.rect(0, 0, 210, 50, 'F');
    if (image) pdf.addImage(image.data, image.format, margin, 11, 28, 28);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    const churchName = pdf.splitTextToSize(profile.name, image ? 138 : 174);
    pdf.text(churchName.slice(0, 2), image ? 52 : margin, 20);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text('Ordem musical do culto', image ? 52 : margin, churchName.length > 1 ? 37 : 30);
    pdf.text(dateText(repertoire.service_date), image ? 52 : margin, churchName.length > 1 ? 44 : 38);

    let y = 65;
    pdf.setTextColor(45, 40, 45);
    repertoire.items.forEach((item, index) => {
      const lines = pdf.splitTextToSize(`${index + 1}. ${item.title}`, 160);
      const artist = pdf.splitTextToSize(`${item.artist_name || 'Artista não informado'}  •  ${item.role}`, 160);
      const height = lines.length * 8 + artist.length * 6 + 11;
      if (y + height > 280) { pdf.addPage(); y = 24; }
      pdf.setFillColor(255, 244, 246);
      pdf.roundedRect(margin, y - 6, 174, height, 3, 3, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.text(lines, margin + 7, y + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(105, 90, 95);
      pdf.setFontSize(11);
      pdf.text(artist, margin + 7, y + 4 + lines.length * 8);
      pdf.setTextColor(45, 40, 45);
      y += height + 7;
    });
    pdf.save(`culto-${repertoire.service_date}.pdf`);
  }

  new MutationObserver(async () => {
    const table = [...document.querySelectorAll('#app table')].find(item => item.querySelector('th')?.textContent.trim() === 'Culto');
    if (!table || table.dataset.shareReady) return;
    table.dataset.shareReady = '1';
    const records = await API.get('/repertoires');
    [...table.querySelectorAll('tbody tr')].forEach((row, index) => {
      const record = records[index];
      const cell = row.lastElementChild;
      if (record && !cell.querySelector('.print-repertoire')) cell.insertAdjacentHTML('beforeend', ` <button class="btn btn-sm btn-outline-danger print-repertoire" data-id="${record.id}"><i class="bi bi-file-earmark-pdf"></i> PDF</button>`);
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('click', async event => {
    const button = event.target.closest('.print-repertoire');
    if (!button) return;
    button.disabled = true;
    try { await download(button.dataset.id); }
    catch (error) { UI.alert(error.message, 'danger'); }
    finally { button.disabled = false; }
  });
}
