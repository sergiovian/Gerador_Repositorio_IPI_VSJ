document.addEventListener('DOMContentLoaded', async () => {
  Layout.render('churches', 'Igrejas');
  const app = document.querySelector('#app');

  const roleName = role => ({ SUPER_ADMIN: 'Administrador geral', ADMIN: 'Administrador', MEMBER: 'Membro' }[role] || role);

  async function openChurch(church) {
    const users = await API.get(`/admin/churches/${church.id}/users`);
    const box = document.createElement('div');
    box.className = 'modal fade';
    box.tabIndex = -1;
    box.innerHTML = `
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <div><h2 class="modal-title fs-5">Gerenciar igreja</h2><small class="text-secondary">Dados da igreja e permissões dos usuários</small></div>
            <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <form id="admin-church-profile" class="border rounded-3 p-3 mb-4">
              <h3 class="h6 mb-3"><i class="bi bi-building me-2"></i>Identificação</h3>
              <div class="row g-3">
                <div class="col-12"><label class="form-label">Nome da igreja</label><input class="form-control" name="name" maxlength="140" value="${UI.esc(church.name)}" required></div>
                <div class="col-md-7"><label class="form-label">Cidade</label><input class="form-control" name="city" maxlength="100" value="${UI.esc(church.city || '')}"></div>
                <div class="col-md-5"><label class="form-label">Estado</label><input class="form-control" name="state" maxlength="40" value="${UI.esc(church.state || '')}"></div>
                <div class="col-12"><button class="btn btn-primary" type="submit"><i class="bi bi-save me-1"></i>Salvar dados</button></div>
              </div>
            </form>
            <section>
              <div class="d-flex justify-content-between align-items-center mb-2"><h3 class="h6 mb-0"><i class="bi bi-people me-2"></i>Usuários e permissões</h3><small class="text-secondary">${users.length} usuário(s)</small></div>
              <div class="table-responsive border rounded-3">
                <table class="table align-middle mb-0">
                  <thead><tr><th>Usuário</th><th>Permissão</th><th>Situação</th><th></th></tr></thead>
                  <tbody>${users.length ? users.map(user => {
                    const protectedUser = user.role === 'SUPER_ADMIN';
                    return `<tr data-user-id="${user.id}">
                      <td><strong>${UI.esc(user.name)}</strong><br><small class="text-secondary">${UI.esc(user.username || user.email)}</small></td>
                      <td><select class="form-select form-select-sm user-role" ${protectedUser ? 'disabled' : ''}><option value="MEMBER" ${user.role === 'MEMBER' ? 'selected' : ''}>Membro</option><option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>${protectedUser ? '<option value="SUPER_ADMIN" selected>Administrador geral</option>' : ''}</select></td>
                      <td><div class="form-check form-switch"><input class="form-check-input user-active" type="checkbox" ${user.active ? 'checked' : ''} ${protectedUser ? 'disabled' : ''}><label class="form-check-label">${user.active ? 'Ativo' : 'Inativo'}</label></div></td>
                      <td><button class="btn btn-sm btn-outline-primary save-user" ${protectedUser ? 'disabled' : ''}><i class="bi bi-shield-check me-1"></i>Salvar</button></td>
                    </tr>`;
                  }).join('') : '<tr><td colspan="4" class="text-center text-secondary py-4">Nenhum usuário cadastrado.</td></tr>'}</tbody>
                </table>
              </div>
              <p class="small text-secondary mt-2 mb-0">Administradores podem editar o nome e a foto da própria igreja. Membros possuem acesso normal, sem alterar a identidade.</p>
            </section>
          </div>
        </div>
      </div>`;
    document.body.append(box);
    const modal = new bootstrap.Modal(box);
    box.addEventListener('hidden.bs.modal', () => box.remove(), { once: true });

    box.querySelector('#admin-church-profile').onsubmit = async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        await API.put(`/admin/churches/${church.id}/profile`, Object.fromEntries(new FormData(event.currentTarget)));
        UI.alert('Dados da igreja atualizados.');
        modal.hide();
        await load();
      } catch (error) {
        UI.alert(error.message, 'danger');
        button.disabled = false;
      }
    };

    box.querySelectorAll('.save-user').forEach(button => {
      button.onclick = async () => {
        const row = button.closest('tr');
        button.disabled = true;
        try {
          await API.put(`/admin/users/${row.dataset.userId}`, {
            role: row.querySelector('.user-role').value,
            active: row.querySelector('.user-active').checked
          });
          row.querySelector('.form-check-label').textContent = row.querySelector('.user-active').checked ? 'Ativo' : 'Inativo';
          UI.alert('Permissão do usuário atualizada.');
        } catch (error) {
          UI.alert(error.message, 'danger');
        } finally {
          button.disabled = false;
        }
      };
    });
    modal.show();
  }

  async function load() {
    try {
      const [churches, notifications] = await Promise.all([API.get('/admin/churches'), API.get('/admin/notifications')]);
      const unread = notifications.filter(item => !item.read_at);
      app.innerHTML = `
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div><h2 class="h5 mb-1">Administração geral</h2><p class="text-secondary mb-0">Acompanhe igrejas, acessos e bibliotecas cadastradas.</p></div>
          <details class="position-relative">
            <summary class="btn btn-outline-secondary list-unstyled"><i class="bi bi-bell me-1"></i>Notificações ${unread.length ? `<span class="badge text-bg-danger">${unread.length}</span>` : ''}</summary>
            <div class="card shadow position-absolute end-0 mt-2 p-3" style="width:min(90vw,380px);z-index:10">
              <strong>Novos cadastros</strong>
              ${notifications.length ? notifications.map(item => `<div class="border-top pt-2 mt-2 small">${UI.esc(item.message)}<br><span class="text-secondary">${new Date(item.created_at + 'Z').toLocaleString('pt-BR')}</span></div>`).join('') : '<p class="text-secondary mb-0 mt-2">Nenhuma notificação.</p>'}
              ${unread.length ? '<button class="btn btn-sm btn-outline-primary mt-3" id="read-notifications">Marcar como lidas</button>' : ''}
            </div>
          </details>
        </div>
        <div class="row g-3 mb-4">
          <div class="col-sm-4"><div class="card stat-card p-3"><strong>${churches.length}</strong><small class="text-secondary">Igrejas cadastradas</small></div></div>
          <div class="col-sm-4"><div class="card stat-card p-3"><strong>${churches.filter(item => item.active).length}</strong><small class="text-secondary">Igrejas ativas</small></div></div>
          <div class="col-sm-4"><div class="card stat-card p-3"><strong>${churches.reduce((total, item) => total + Number(item.users_count), 0)}</strong><small class="text-secondary">Usuários</small></div></div>
        </div>
        <div class="card panel"><div class="table-responsive"><table class="table mb-0">
          <thead><tr><th>Igreja</th><th>Usuários</th><th>Músicas</th><th>Status</th><th></th></tr></thead>
          <tbody>${churches.map(church => `
            <tr>
              <td><div class="d-flex align-items-center gap-3"><img class="church-list-logo" src="${church.has_logo ? `/api/admin/churches/${church.id}/logo` : church.id === 1 ? '/assets/img/logo-ipi.jpg' : '/assets/img/app-mark.svg'}" alt=""><div><strong>${UI.esc(church.name)}</strong><br><small class="text-secondary">${UI.esc([church.city, church.state].filter(Boolean).join(' · ') || 'Local não informado')}</small></div></div></td>
              <td>${church.users_count}</td><td>${church.music_count}</td>
              <td><span class="badge text-bg-${church.active ? 'success' : 'secondary'}">${church.active ? 'Ativa' : 'Desativada'}</span></td>
              <td class="text-end"><button class="btn btn-sm btn-outline-primary edit-church" data-id="${church.id}"><i class="bi bi-gear me-1"></i>Gerenciar</button> <button class="btn btn-sm btn-outline-${church.active ? 'danger' : 'success'} toggle-church" data-id="${church.id}" data-active="${church.active ? 0 : 1}" ${church.id === 1 ? 'disabled' : ''}>${church.active ? 'Desativar' : 'Ativar'}</button></td>
            </tr>`).join('')}</tbody>
        </table></div></div>`;

      document.querySelector('#read-notifications')?.addEventListener('click', async () => { await API.post('/admin/notifications/read', {}); await load(); });
      app.querySelectorAll('.edit-church').forEach(button => button.onclick = () => openChurch(churches.find(item => item.id === Number(button.dataset.id))).catch(error => UI.alert(error.message, 'danger')));
      app.querySelectorAll('.toggle-church').forEach(button => button.onclick = async () => {
        button.disabled = true;
        try { await API.put(`/admin/churches/${button.dataset.id}`, { active: Boolean(Number(button.dataset.active)) }); await load(); }
        catch (error) { UI.alert(error.message, 'danger'); button.disabled = false; }
      });
    } catch (error) {
      app.innerHTML = `<div class="alert alert-danger"><strong>Acesso indisponível.</strong><br>${UI.esc(error.message)}</div>`;
    }
  }

  await load();
});
