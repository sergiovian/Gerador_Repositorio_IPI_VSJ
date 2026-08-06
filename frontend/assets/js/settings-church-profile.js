if (document.documentElement.dataset.page === 'settings') {
  let mounting = false;

  async function mountChurchProfile() {
    const app = document.querySelector('#app');
    if (!app || !app.children.length || app.querySelector('#church-profile-settings') || mounting) return;
    mounting = true;
    try {
      const [profile, user] = await Promise.all([API.get('/church/profile'), API.get('/auth/me')]);
      const canEdit = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      const card = document.createElement('div');
      card.id = 'church-profile-settings';
      card.className = 'card panel p-4 mt-4';
      card.innerHTML = `
        <div class="d-flex flex-column flex-lg-row gap-4 align-items-lg-start">
          <div class="text-center">
            <img class="church-profile-logo mb-2" src="${UI.esc(profile.logoUrl)}" alt="Foto da igreja">
            <label class="btn btn-sm btn-outline-primary d-block ${canEdit ? '' : 'disabled'}">
              <i class="bi bi-camera me-1"></i>Trocar foto
              <input class="d-none" id="church-logo-file" type="file" accept="image/jpeg,image/png,image/webp" ${canEdit ? '' : 'disabled'}>
            </label>
            <small class="d-block text-secondary mt-2">JPG, PNG ou WEBP · até 5 MB</small>
          </div>
          <form id="church-profile-form" class="flex-grow-1">
            <div class="d-flex align-items-center justify-content-between gap-2 mb-3">
              <div><h2 class="h5 mb-1"><i class="bi bi-building-gear me-2"></i>Identidade da igreja</h2><p class="text-secondary mb-0">Este nome e esta foto aparecem no menu de todos os usuários da igreja.</p></div>
              <span class="badge text-bg-${canEdit ? 'primary' : 'secondary'}">${canEdit ? 'Administrador' : 'Somente leitura'}</span>
            </div>
            <div class="row g-3">
              <div class="col-12"><label class="form-label">Nome da igreja</label><input class="form-control" name="name" maxlength="140" value="${UI.esc(profile.name)}" required ${canEdit ? '' : 'disabled'}></div>
              <div class="col-md-7"><label class="form-label">Cidade</label><input class="form-control" name="city" maxlength="100" value="${UI.esc(profile.city || '')}" ${canEdit ? '' : 'disabled'}></div>
              <div class="col-md-5"><label class="form-label">Estado</label><input class="form-control" name="state" maxlength="40" value="${UI.esc(profile.state || '')}" ${canEdit ? '' : 'disabled'}></div>
              ${canEdit ? '<div class="col-12"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i>Salvar identidade</button></div>' : ''}
            </div>
          </form>
        </div>`;
      app.append(card);

      if (canEdit) {
        card.querySelector('#church-profile-form').onsubmit = async event => {
          event.preventDefault();
          const button = event.currentTarget.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            await API.put('/church/profile', Object.fromEntries(new FormData(event.currentTarget)));
            UI.alert('Identidade da igreja atualizada.');
            setTimeout(() => location.reload(), 500);
          } catch (error) {
            UI.alert(error.message, 'danger');
            button.disabled = false;
          }
        };

        card.querySelector('#church-logo-file').onchange = async event => {
          const file = event.target.files[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) return UI.alert('A foto deve ter no máximo 5 MB.', 'warning');
          const data = new FormData();
          data.append('logo', file);
          try {
            UI.load();
            const response = await fetch('/api/church/profile/logo', { method: 'PUT', body: data });
            const json = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(json.error?.message || 'Não foi possível enviar a foto.');
            UI.alert('Foto da igreja atualizada.');
            setTimeout(() => location.reload(), 500);
          } catch (error) {
            UI.alert(error.message, 'danger');
          } finally {
            UI.load(false);
          }
        };
      }
    } catch (error) {
      UI.alert(error.message, 'danger');
    } finally {
      mounting = false;
    }
  }

  new MutationObserver(mountChurchProfile).observe(document.documentElement, { childList: true, subtree: true });
}
