document.addEventListener('DOMContentLoaded', () => {
  Layout.render('bible', 'Bíblia e projeção');

  // Nome, capítulos. A API aceita os nomes em português para a Almeida.
  const books = [
    ['Gênesis',50],['Êxodo',40],['Levítico',27],['Números',36],['Deuteronômio',34],['Josué',24],['Juízes',21],['Rute',4],['1 Samuel',31],['2 Samuel',24],['1 Reis',22],['2 Reis',25],['1 Crônicas',29],['2 Crônicas',36],['Esdras',10],['Neemias',13],['Ester',10],['Jó',42],['Salmos',150],['Provérbios',31],['Eclesiastes',12],['Cantares',8],['Isaías',66],['Jeremias',52],['Lamentações',5],['Ezequiel',48],['Daniel',12],['Oséias',14],['Joel',3],['Amós',9],['Obadias',1],['Jonas',4],['Miqueias',7],['Naum',3],['Habacuque',3],['Sofonias',3],['Ageu',2],['Zacarias',14],['Malaquias',4],['Mateus',28],['Marcos',16],['Lucas',24],['João',21],['Atos',28],['Romanos',16],['1 Coríntios',16],['2 Coríntios',13],['Gálatas',6],['Efésios',6],['Filipenses',4],['Colossenses',4],['1 Tessalonicenses',5],['2 Tessalonicenses',3],['1 Timóteo',6],['2 Timóteo',4],['Tito',3],['Filemom',1],['Hebreus',13],['Tiago',5],['1 Pedro',5],['2 Pedro',3],['1 João',5],['2 João',1],['3 João',1],['Judas',1],['Apocalipse',22]
  ];
  const app = document.querySelector('#app');
  const bookOptions = books.map(([name]) => `<option value="${name}">${name}</option>`).join('');
  app.innerHTML = `
    <div class="card panel p-4 p-lg-5">
      <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
        <div><h2 class="h4 mb-1">Bíblia para projeção</h2><p class="text-muted mb-0">Escolha o texto em poucos cliques ou busque uma referência rapidamente.</p></div>
        <span class="badge text-bg-light border">João Ferreira de Almeida</span>
      </div>
      <div class="row g-4">
        <div class="col-lg-5 border-end-lg">
          <h3 class="h6 text-uppercase text-muted">Pesquisa rápida</h3>
          <form id="bible-quick-form" class="row g-2">
            <div class="col-12"><input id="quick-reference" class="form-control form-control-lg" placeholder="Ex.: João 3 16 ou João 3:16" autocomplete="off" required></div>
            <div class="col-12 d-grid"><button class="btn btn-primary">Buscar na Almeida</button></div>
          </form>
          <small class="text-muted d-block mt-2">A pontuação é opcional: <strong>Joao 3 16</strong> vira <strong>João 3:16</strong>.</small>
        </div>
        <div class="col-lg-7">
          <h3 class="h6 text-uppercase text-muted">Escolha guiada</h3>
          <form id="bible-picker-form" class="row g-2">
            <div class="col-md-6"><label class="form-label">Livro</label><select id="bible-book" class="form-select">${bookOptions}</select></div>
            <div class="col-md-3"><label class="form-label">Capítulo</label><select id="bible-chapter" class="form-select"></select></div>
            <div class="col-md-3"><label class="form-label">Versículo</label><select id="bible-verse" class="form-select"></select></div>
            <div class="col-12 d-grid d-sm-flex justify-content-sm-end mt-2"><button class="btn btn-outline-primary">Abrir versículo</button></div>
          </form>
          <small class="text-muted">Você pode escolher um versículo ou pesquisar um capítulo inteiro pela caixa rápida.</small>
        </div>
      </div>
      <div id="bible-result" class="mt-4"></div>
    </div>`;

  const book = document.querySelector('#bible-book');
  const chapter = document.querySelector('#bible-chapter');
  const verse = document.querySelector('#bible-verse');
  const result = document.querySelector('#bible-result');
  const numberOptions = count => Array.from({ length: count }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
  function updateChapters() {
    const selected = books.find(([name]) => name === book.value);
    chapter.innerHTML = numberOptions(selected ? selected[1] : 1);
    updateVerses();
  }
  function updateVerses() { verse.innerHTML = numberOptions(176); }
  updateChapters();
  book.onchange = updateChapters;
  chapter.onchange = updateVerses;

  function normalizeReference(value) {
    const text = value.trim().replace(/\s+/g, ' ');
    // Insere os dois-pontos quando vier no formato "Joao 3 16".
    const match = text.match(/^(.+?)[\s.:]+(\d+)[\s.:]+(\d+)(?:\s*-\s*(\d+))?$/i);
    return match ? `${match[1]} ${match[2]}:${match[3]}${match[4] ? `-${match[4]}` : ''}` : text;
  }
  async function search(reference, translation) {
    const formatted = normalizeReference(reference);
    result.innerHTML = '<div class="text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Buscando texto bíblico…</div>';
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(formatted)}?translation=${translation}`);
      const json = await response.json();
      if (!response.ok) throw Error(json.error || 'Referência não encontrada.');
      const text = json.verses.map(item => `${item.verse}. ${item.text.trim()}`).join('\n');
      result.innerHTML = `<div class="border rounded-3 p-3 p-lg-4 bg-light"><div class="d-flex justify-content-between align-items-center gap-2 flex-wrap"><h2 class="h5 mb-0">${UI.esc(json.reference)}</h2><button class="btn btn-dark" id="project-bible"><i class="bi bi-projector me-1"></i>Projetar texto</button></div><pre class="mt-3 mb-0" style="white-space:pre-wrap;font:inherit;line-height:1.7">${UI.esc(text)}</pre></div>`;
      document.querySelector('#project-bible').onclick = () => {
        localStorage.setItem('bible-projection', JSON.stringify({ text, ref: json.reference }));
        window.open('/pages/bible-projection.html', 'bible-projection');
      };
    } catch (error) { result.innerHTML = `<div class="alert alert-danger">${UI.esc(error.message)}</div>`; }
  }
  document.querySelector('#bible-quick-form').onsubmit = event => {
    event.preventDefault();
    search(document.querySelector('#quick-reference').value, 'almeida');
  };
  document.querySelector('#bible-picker-form').onsubmit = event => {
    event.preventDefault();
    search(`${book.value} ${chapter.value}:${verse.value}`, 'almeida');
  };
});
