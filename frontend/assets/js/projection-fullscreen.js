(() => {
  const button = document.createElement('button');
  button.id = 'projection-fullscreen';
  button.type = 'button';
  button.innerHTML = '<span>⛶</span> Iniciar em tela cheia';
  button.title = 'Tela cheia (F)';
  document.body.append(button);
  const enter = async () => {
    try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (_) { /* o navegador pode exigir nova tentativa */ }
  };
  button.onclick = enter;
  document.addEventListener('fullscreenchange', () => button.classList.toggle('hidden', !!document.fullscreenElement));
  document.addEventListener('keydown', event => { if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.altKey) { event.preventDefault(); enter(); } });
})();
