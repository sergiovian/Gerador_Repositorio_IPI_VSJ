(() => {
  const defaults = { font: 'Arial, sans-serif', textColor: '#ffffff', titleColor: '#ffcc4d', showMusicTitle: false };
  const read = () => ({ ...defaults, ...JSON.parse(localStorage.getItem('projection-style') || '{}') });
  const apply = style => {
    document.documentElement.style.setProperty('--projection-font', style.font);
    document.documentElement.style.setProperty('--projection-text', style.textColor);
    document.documentElement.style.setProperty('--projection-title', style.titleColor);
    localStorage.setItem('projection-style', JSON.stringify(style));
  };
  apply(read());
  const panel = document.createElement('aside'); panel.id = 'projection-style-panel';
  panel.innerHTML = `<button type="button" id="projection-style-toggle" aria-expanded="false"><span>⚙</span> Aparência</button><form id="projection-style-form" class="hidden"><label>Fonte<select name="font"><option value="Arial, sans-serif">Arial</option><option value="Verdana, sans-serif">Verdana</option><option value="Georgia, serif">Georgia</option><option value="'Trebuchet MS', sans-serif">Trebuchet</option><option value="Impact, sans-serif">Impact</option></select></label><label>Cor da letra<input name="textColor" type="color"></label><label>Cor do título<input name="titleColor" type="color"></label><label class="check"><input name="showMusicTitle" type="checkbox"> Mostrar título da música</label><button>Aplicar</button></form>`;
  document.body.append(panel);
  const toggle = panel.querySelector('#projection-style-toggle'), form = panel.querySelector('form');
  const fill = () => { const style = read(); form.font.value = style.font; form.textColor.value = style.textColor; form.titleColor.value = style.titleColor; form.showMusicTitle.checked = style.showMusicTitle; };
  fill(); toggle.onclick = () => { const opening = form.classList.toggle('hidden'); toggle.setAttribute('aria-expanded', String(!opening)); };
  form.onsubmit = event => { event.preventDefault(); const values = new FormData(form); apply({ font: values.get('font'), textColor: values.get('textColor'), titleColor: values.get('titleColor'), showMusicTitle: form.showMusicTitle.checked }); form.classList.add('hidden'); toggle.setAttribute('aria-expanded', 'false'); };
})();
