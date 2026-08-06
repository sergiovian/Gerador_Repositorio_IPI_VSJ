document.addEventListener('DOMContentLoaded', async () => {
  Layout.render('repertoires', 'Central do culto');
  const app = document.querySelector('#app');
  const repertoireId = Number(new URLSearchParams(location.search).get('repertoire'));
  let center;
  let timeline = [];
  let activeView = 'rehearsal';
  let polling = false;

  const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const typeInfo = type => ({ MUSIC: ['Música', 'music-note-beamed', 'success'], LITURGY: ['Liturgia', 'file-text', 'primary'], CUSTOM: ['Momento', 'stars', 'secondary'] }[type] || [type, 'circle', 'secondary']);
  const seconds = value => {
    if (!value) return 0;
    const end = center?.live?.running ? Date.now() : new Date(center?.live?.updatedAt || Date.now()).getTime();
    return Math.max(0, Math.floor((end - new Date(value).getTime()) / 1000));
  };
  const clock = total => `${String(Math.floor(total / 3600)).padStart(2, '0')}:${String(Math.floor(total % 3600 / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

  function defaultTimeline() {
    return [
      ...center.liturgy.map((page, index) => ({ uid: `liturgy-${index}-${Date.now()}`, type: 'LITURGY', title: page.title || page.content?.split('\n')[0] || `Liturgia ${index + 1}`, liturgyIndex: index, durationMinutes: 2, notes: '' })),
      ...center.items.map((item, index) => ({ uid: `music-${item.music_id}-${Date.now()}-${index}`, type: 'MUSIC', title: item.title, musicId: item.music_id, durationMinutes: 5, notes: '' }))
    ];
  }

  function viewButtons() {
    return `<div class="service-center-tabs" role="tablist">
      <button class="${activeView === 'rehearsal' ? 'active' : ''}" data-center-view="rehearsal"><i class="bi bi-music-player"></i><span>Ensaio</span></button>
      <button class="${activeView === 'timeline' ? 'active' : ''}" data-center-view="timeline"><i class="bi bi-list-check"></i><span>Ordem do culto</span></button>
      <button class="${activeView === 'live' ? 'active' : ''}" data-center-view="live"><i class="bi bi-broadcast-pin"></i><span>Ao vivo</span></button>
    </div>`;
  }

  function rehearsalHtml() {
    const checklistLabels = { sound: 'Som testado', projection: 'Projeção preparada', instruments: 'Instrumentos prontos', microphones: 'Microfones conferidos', cables: 'Cabos e energia', team: 'Equipe confirmada', prayer: 'Oração com a equipe' };
    const checked = Object.values(center.rehearsal.checklist).filter(Boolean).length;
    const rehearsed = Object.values(center.rehearsal.songs).filter(song => song.rehearsed).length;
    const total = Object.keys(checklistLabels).length + center.items.length;
    const completed = checked + rehearsed;
    return `<section class="center-panel">
      <div class="row g-3 mb-4">
        <div class="col-md-4"><div class="center-summary-card"><i class="bi bi-check2-circle"></i><div><strong>${completed}/${total}</strong><span>Preparação concluída</span></div></div></div>
        <div class="col-md-4"><div class="center-summary-card"><i class="bi bi-music-note-list"></i><div><strong>${rehearsed}/${center.items.length}</strong><span>Músicas ensaiadas</span></div></div></div>
        <div class="col-md-4"><div class="center-summary-card"><i class="bi bi-speedometer2"></i><div><strong>${Math.round((completed / Math.max(1, total)) * 100)}%</strong><span>Prontidão da equipe</span></div></div></div>
      </div>
      <form id="rehearsal-form">
        <div class="card panel p-4 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3"><div><h2 class="h5 mb-1">Checklist antes do ensaio</h2><p class="text-secondary mb-0">Uma conferência rápida evita correria antes do culto.</p></div><i class="bi bi-clipboard2-check fs-3 text-primary"></i></div>
          <div class="row g-2">${Object.entries(checklistLabels).map(([key, label]) => `<div class="col-sm-6 col-xl-4"><label class="center-check"><input type="checkbox" data-checklist="${key}" ${center.rehearsal.checklist[key] ? 'checked' : ''}><span><i class="bi bi-check-lg"></i>${label}</span></label></div>`).join('')}</div>
        </div>
        <div class="d-flex justify-content-between align-items-end gap-3 mb-3"><div><h2 class="h5 mb-1">Músicas do ensaio</h2><p class="text-secondary mb-0">Combine tom, andamento, entrada e finalização.</p></div><button class="btn btn-primary text-nowrap" type="submit"><i class="bi bi-save me-1"></i>Salvar ensaio</button></div>
        <div class="vstack gap-3">${center.items.map((item, index) => {
          const song = center.rehearsal.songs[item.music_id];
          return `<article class="card panel rehearsal-song" data-music-id="${item.music_id}">
            <div class="rehearsal-song-head"><div class="song-number">${index + 1}</div><div class="flex-grow-1"><h3>${UI.esc(item.title)}</h3><p>${UI.esc(item.artist_name || 'Artista não informado')}</p></div><label class="rehearsed-toggle"><input name="rehearsed" type="checkbox" ${song.rehearsed ? 'checked' : ''}><span><i class="bi bi-check2"></i>Ensaiada</span></label></div>
            <div class="row g-3 p-3 p-lg-4 pt-0">
              <div class="col-4 col-md-2"><label class="form-label">Tom</label><input class="form-control" name="key" maxlength="10" value="${UI.esc(song.key || '')}" placeholder="Ex.: G"></div>
              <div class="col-4 col-md-2"><label class="form-label">BPM</label><input class="form-control" name="bpm" type="number" min="20" max="400" value="${song.bpm || ''}"></div>
              <div class="col-4 col-md-2"><label class="form-label">Repetições</label><input class="form-control" name="repetitions" type="number" min="1" max="20" value="${song.repetitions || 1}"></div>
              <div class="col-md-3"><label class="form-label">Introdução</label><input class="form-control" name="intro" maxlength="500" value="${UI.esc(song.intro || '')}" placeholder="Quem inicia e como"></div>
              <div class="col-md-3"><label class="form-label">Finalização</label><input class="form-control" name="ending" maxlength="500" value="${UI.esc(song.ending || '')}" placeholder="Sinal e último acorde"></div>
              <div class="col-12"><label class="form-label">Observações do arranjo</label><textarea class="form-control" name="notes" rows="2" maxlength="3000" placeholder="Entradas, dinâmica, vozes, pausas…">${UI.esc(song.notes || '')}</textarea></div>
            </div>
          </article>`;
        }).join('')}</div>
        <div class="card panel p-4 mt-4"><label class="form-label fw-bold">Observações gerais do ensaio</label><textarea class="form-control" name="generalNotes" rows="4" maxlength="5000" placeholder="Recados para a equipe, equipamentos necessários, horários…">${UI.esc(center.rehearsal.generalNotes || '')}</textarea><div class="text-end mt-3"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i>Salvar ensaio</button></div></div>
      </form>
    </section>`;
  }

  function syncTimeline() {
    document.querySelectorAll('.timeline-editor-item').forEach((row, index) => {
      if (!timeline[index]) return;
      timeline[index].title = row.querySelector('[name="title"]').value.trim();
      timeline[index].durationMinutes = Number(row.querySelector('[name="duration"]').value) || 0;
      timeline[index].notes = row.querySelector('[name="notes"]').value.trim();
    });
  }

  function timelineItemsHtml() {
    return timeline.map((entry, index) => {
      const [label, icon, color] = typeInfo(entry.type);
      return `<article class="timeline-editor-item" data-index="${index}">
        <div class="timeline-order">${index + 1}</div>
        <div class="timeline-type text-${color}"><i class="bi bi-${icon}"></i><small>${label}</small></div>
        <div class="timeline-fields"><input class="form-control fw-semibold" name="title" maxlength="120" value="${UI.esc(entry.title)}"><div class="d-flex gap-2 mt-2"><div class="input-group input-group-sm timeline-duration"><input class="form-control" name="duration" type="number" min="0" max="240" value="${entry.durationMinutes || 0}"><span class="input-group-text">min</span></div><input class="form-control form-control-sm" name="notes" maxlength="1000" value="${UI.esc(entry.notes || '')}" placeholder="Responsável ou observação"></div></div>
        <div class="timeline-actions"><button type="button" class="btn btn-sm btn-outline-secondary move-up" ${index ? '' : 'disabled'} aria-label="Mover para cima"><i class="bi bi-arrow-up"></i></button><button type="button" class="btn btn-sm btn-outline-secondary move-down" ${index < timeline.length - 1 ? '' : 'disabled'} aria-label="Mover para baixo"><i class="bi bi-arrow-down"></i></button><button type="button" class="btn btn-sm btn-outline-danger remove-timeline" aria-label="Remover"><i class="bi bi-trash"></i></button></div>
      </article>`;
    }).join('');
  }

  function timelineHtml() {
    const total = timeline.reduce((sum, item) => sum + Number(item.durationMinutes || 0), 0);
    return `<section class="center-panel"><div class="card panel p-4">
      <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4"><div><h2 class="h5 mb-1">Ordem completa do culto</h2><p class="text-secondary mb-0">Organize liturgia e músicas na sequência real. Tempo estimado: <strong id="timeline-total">${total} minutos</strong>.</p></div><div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-secondary" id="reset-timeline"><i class="bi bi-arrow-counterclockwise me-1"></i>Recriar ordem</button><button class="btn btn-outline-primary" id="add-custom"><i class="bi bi-plus-lg me-1"></i>Adicionar momento</button><button class="btn btn-primary" id="save-timeline"><i class="bi bi-save me-1"></i>Salvar ordem</button></div></div>
      <div id="timeline-editor" class="timeline-editor">${timelineItemsHtml()}</div>
    </div></section>`;
  }

  function liveHtml() {
    const current = timeline[center.live.currentIndex];
    const next = timeline[center.live.currentIndex + 1];
    const [label, icon] = typeInfo(current?.type);
    return `<section class="center-panel live-console ${center.live.running ? 'is-running' : ''}">
      <div class="live-status-bar"><span class="live-dot"></span><strong>${center.live.running ? 'Culto em andamento' : 'Central preparada'}</strong><span class="ms-auto">${center.live.currentIndex + 1} de ${timeline.length}</span></div>
      <div class="row g-4">
        <div class="col-lg-8"><article class="live-current"><div class="live-kicker"><i class="bi bi-${icon || 'circle'} me-2"></i>Agora · ${label || 'Momento'}</div><h2>${UI.esc(current?.title || 'Nenhum momento')}</h2><p>${UI.esc(current?.notes || 'Sem observações para este momento.')}</p><div class="live-clocks"><div><span>Tempo do culto</span><strong id="service-clock">${clock(seconds(center.live.startedAt))}</strong></div><div><span>Neste momento</span><strong id="item-clock">${clock(seconds(center.live.itemStartedAt))}</strong></div><div><span>Previsto</span><strong>${current?.durationMinutes || 0} min</strong></div></div></article></div>
        <div class="col-lg-4"><article class="live-next"><span>Próximo</span><h3>${UI.esc(next?.title || 'Fim da programação')}</h3><p>${next ? `${next.durationMinutes || 0} min · ${typeInfo(next.type)[0]}` : 'Todos os momentos foram concluídos.'}</p></article><div class="d-grid gap-2 mt-3"><button class="btn btn-lg ${center.live.running ? 'btn-outline-danger' : 'btn-success'}" id="toggle-live"><i class="bi bi-${center.live.running ? 'pause-circle' : 'play-circle'} me-2"></i>${center.live.running ? 'Pausar acompanhamento' : center.live.startedAt ? 'Retomar acompanhamento' : 'Iniciar culto'}</button><button class="btn btn-outline-secondary" id="reset-live"><i class="bi bi-arrow-counterclockwise me-1"></i>Reiniciar acompanhamento</button></div></div>
      </div>
      <div class="live-controls"><button class="btn btn-outline-light" id="previous-live" ${center.live.currentIndex ? '' : 'disabled'}><i class="bi bi-chevron-left me-1"></i>Anterior</button><button class="btn btn-light flex-grow-1" id="project-current"><i class="bi bi-projector me-1"></i>Projetar item atual</button><button class="btn btn-warning flex-grow-1" id="next-live" ${center.live.currentIndex < timeline.length - 1 ? '' : 'disabled'}><i class="bi bi-check2-circle me-1"></i>Concluir e avançar</button><button class="btn btn-outline-light" id="mobile-control"><i class="bi bi-qr-code me-1"></i>Celular</button><button class="btn btn-outline-light" id="open-projector"><i class="bi bi-box-arrow-up-right me-1"></i>Projeção</button></div>
      <div class="live-sequence"><h3>Sequência do culto</h3>${timeline.map((entry, index) => `<button class="${index === center.live.currentIndex ? 'active' : ''} ${index < center.live.currentIndex ? 'done' : ''}" data-live-index="${index}"><span>${index < center.live.currentIndex ? '<i class="bi bi-check-lg"></i>' : index + 1}</span><div><strong>${UI.esc(entry.title)}</strong><small>${typeInfo(entry.type)[0]} · ${entry.durationMinutes || 0} min</small></div></button>`).join('')}</div>
    </section>`;
  }

  function render() {
    app.innerHTML = `<div class="service-center-hero"><div><a href="/pages/repertoires.html"><i class="bi bi-arrow-left me-1"></i>Voltar aos cultos</a><p>${UI.esc(center.serviceType)} · ${formatDate(center.serviceDate)}</p><h2>${UI.esc(center.theme || 'Culto sem tema informado')}</h2><span>${center.preacher ? `Responsável: ${UI.esc(center.preacher)}` : 'Planejamento compartilhado da equipe'}</span></div><div class="service-status ${center.live.running ? 'running' : ''}"><i class="bi bi-${center.live.running ? 'broadcast' : 'calendar2-check'}"></i>${center.live.running ? 'AO VIVO' : center.status}</div></div>${viewButtons()}<div id="center-content">${activeView === 'rehearsal' ? rehearsalHtml() : activeView === 'timeline' ? timelineHtml() : liveHtml()}</div>`;
    bind();
  }

  function renderTimelineEditor() {
    document.querySelector('#timeline-editor').innerHTML = timelineItemsHtml();
    document.querySelector('#timeline-total').textContent = `${timeline.reduce((sum, item) => sum + Number(item.durationMinutes || 0), 0)} minutos`;
    bindTimeline();
  }

  function bindTimeline() {
    document.querySelectorAll('.timeline-editor-item').forEach((row, index) => {
      row.querySelector('.move-up').onclick = () => { syncTimeline(); [timeline[index - 1], timeline[index]] = [timeline[index], timeline[index - 1]]; renderTimelineEditor(); };
      row.querySelector('.move-down').onclick = () => { syncTimeline(); [timeline[index], timeline[index + 1]] = [timeline[index + 1], timeline[index]]; renderTimelineEditor(); };
      row.querySelector('.remove-timeline').onclick = () => { syncTimeline(); timeline.splice(index, 1); renderTimelineEditor(); };
    });
  }

  async function projectCurrent() {
    const entry = timeline[center.live.currentIndex];
    if (!entry) return;
    if (entry.type === 'MUSIC') {
      const item = center.items.find(value => value.music_id === entry.musicId);
      if (item) await API.put(`/projection/${center.id}/state`, { mode: 'MUSIC', position: item.position, slide: 0, blackout: false, liturgyIndex: 0 });
    } else if (entry.type === 'LITURGY') {
      await API.put(`/projection/${center.id}/state`, { mode: 'LITURGY', position: 1, slide: 0, blackout: false, liturgyIndex: entry.liturgyIndex });
    } else UI.alert('Este é um momento interno. A projeção atual foi mantida.', 'info');
  }

  async function updateLive(change, project = false) {
    center.live = await API.put(`/service-center/${center.id}/live`, { ...center.live, ...change });
    if (project) await projectCurrent();
    render();
  }

  function showMobileControl() {
    const path = `/pages/service-center.html?repertoire=${center.id}`;
    const loginUrl = `${location.origin}/login?next=${encodeURIComponent(path)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(loginUrl)}`;
    const box = document.createElement('div');
    box.className = 'modal fade';
    box.tabIndex = -1;
    box.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content text-center"><div class="modal-header"><h2 class="modal-title fs-5">Controle no celular</h2><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body p-4"><p>Aponte a câmera do celular, faça login e abra a mesma Central do Culto.</p><img class="img-fluid border rounded-3 p-2" width="260" height="260" src="${qrUrl}" alt="QR Code da Central do Culto"><p class="small text-secondary mt-3 mb-0">As mudanças feitas no celular e no computador são sincronizadas automaticamente.</p></div></div></div>`;
    document.body.append(box);
    const modal = new bootstrap.Modal(box);
    box.addEventListener('hidden.bs.modal', () => box.remove(), { once: true });
    modal.show();
  }

  function bind() {
    document.querySelectorAll('[data-center-view]').forEach(button => button.onclick = () => { activeView = button.dataset.centerView; render(); });
    if (activeView === 'rehearsal') {
      document.querySelector('#rehearsal-form').onsubmit = async event => {
        event.preventDefault();
        const submitButtons = event.currentTarget.querySelectorAll('[type="submit"]');
        submitButtons.forEach(button => { button.disabled = true; });
        const songs = {};
        document.querySelectorAll('.rehearsal-song').forEach(card => {
          songs[card.dataset.musicId] = { key: card.querySelector('[name="key"]').value, bpm: card.querySelector('[name="bpm"]').value, repetitions: card.querySelector('[name="repetitions"]').value, intro: card.querySelector('[name="intro"]').value, ending: card.querySelector('[name="ending"]').value, notes: card.querySelector('[name="notes"]').value, rehearsed: card.querySelector('[name="rehearsed"]').checked };
        });
        const checklist = Object.fromEntries([...document.querySelectorAll('[data-checklist]')].map(input => [input.dataset.checklist, input.checked]));
        try { center.rehearsal = await API.put(`/service-center/${center.id}/rehearsal`, { checklist, generalNotes: event.currentTarget.generalNotes.value, songs }); UI.alert('Planejamento do ensaio salvo.'); render(); }
        catch (error) { UI.alert(error.message, 'danger'); submitButtons.forEach(button => { button.disabled = false; }); }
      };
    }
    if (activeView === 'timeline') {
      bindTimeline();
      document.querySelector('#add-custom').onclick = () => { syncTimeline(); timeline.push({ uid: `custom-${Date.now()}`, type: 'CUSTOM', title: 'Novo momento', durationMinutes: 5, notes: '' }); renderTimelineEditor(); };
      document.querySelector('#reset-timeline').onclick = () => { if (UI.confirm('Recriar a ordem com todas as páginas da liturgia e músicas?')) { timeline = defaultTimeline(); renderTimelineEditor(); } };
      document.querySelector('#save-timeline').onclick = async event => { syncTimeline(); if (!timeline.length) return UI.alert('Adicione ao menos um momento.', 'warning'); event.currentTarget.disabled = true; try { timeline = await API.put(`/service-center/${center.id}/timeline`, { timeline }); center.timeline = timeline; UI.alert('Ordem do culto salva.'); render(); } catch (error) { UI.alert(error.message, 'danger'); event.currentTarget.disabled = false; } };
    }
    if (activeView === 'live') {
      document.querySelector('#toggle-live').onclick = () => updateLive({ running: !center.live.running }, !center.live.running).catch(error => UI.alert(error.message, 'danger'));
      document.querySelector('#reset-live').onclick = () => UI.confirm('Voltar ao primeiro momento e zerar os cronômetros?') && updateLive({ currentIndex: 0, running: false, reset: true }).catch(error => UI.alert(error.message, 'danger'));
      document.querySelector('#previous-live').onclick = () => updateLive({ currentIndex: center.live.currentIndex - 1 }, true).catch(error => UI.alert(error.message, 'danger'));
      document.querySelector('#next-live').onclick = () => updateLive({ currentIndex: center.live.currentIndex + 1 }, true).catch(error => UI.alert(error.message, 'danger'));
      document.querySelector('#project-current').onclick = () => projectCurrent().then(() => UI.alert('Item enviado para a projeção.')).catch(error => UI.alert(error.message, 'danger'));
      document.querySelector('#mobile-control').onclick = showMobileControl;
      document.querySelector('#open-projector').onclick = () => window.open(`/pages/projection.html?repertoire=${center.id}&v=4`, 'cult-projector', 'popup=yes');
      document.querySelectorAll('[data-live-index]').forEach(button => button.onclick = () => updateLive({ currentIndex: Number(button.dataset.liveIndex) }, true).catch(error => UI.alert(error.message, 'danger')));
    }
  }

  try {
    if (!repertoireId) throw new Error('Selecione um culto para abrir a central.');
    center = await API.get(`/service-center/${repertoireId}`);
    timeline = center.timeline.map(item => ({ ...item }));
    render();
    setInterval(() => {
      if (activeView !== 'live' || !center?.live?.running) return;
      const serviceClock = document.querySelector('#service-clock');
      const itemClock = document.querySelector('#item-clock');
      if (serviceClock) serviceClock.textContent = clock(seconds(center.live.startedAt));
      if (itemClock) itemClock.textContent = clock(seconds(center.live.itemStartedAt));
    }, 1000);
    setInterval(async () => {
      if (activeView !== 'live' || polling) return;
      polling = true;
      try {
        const fresh = await API.get(`/service-center/${center.id}`);
        const freshTimeline = JSON.stringify(fresh.timeline);
        const currentTimeline = JSON.stringify(timeline);
        if (fresh.live.updatedAt !== center.live.updatedAt || freshTimeline !== currentTimeline) {
          center = fresh;
          timeline = fresh.timeline.map(item => ({ ...item }));
          render();
        }
      } catch (_) {
      } finally {
        polling = false;
      }
    }, 2000);
  } catch (error) {
    app.innerHTML = `<div class="alert alert-danger"><strong>Não foi possível abrir a Central do Culto.</strong><br>${UI.esc(error.message)}</div>`;
  }
});
