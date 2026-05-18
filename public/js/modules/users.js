// modules/users.js
// Extracted from main.js — User Management functions

export const usersModule = {

    buildUserColorMap(users) {
        window.app.userColorMap = {};
        users.forEach((user, index) => {
            window.app.userColorMap[user.username] = index % window.app.USER_COLORS;
        });
    },

    getUserColorIndex(username) {
        if (!username) return -1;
        if (window.app.userColorMap[username] !== undefined) {
            return window.app.userColorMap[username];
        }
        return -1;
    },

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            if (response.status === 401) return;
            if (!response.ok) return;
            const users = await response.json();
            usersModule.renderUsers(users);
            usersModule.updateUserSelectors(users);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    },

    renderUsers(users) {
        const userList = window.app.userList;
        if (!userList) return;
        userList.innerHTML = '';
        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';

            const photoHtml = user.photo_url
                ? `<img src="${user.photo_url}" alt="${user.username}" class="user-photo" style="cursor:zoom-in;" onclick="app.openLightbox('${user.photo_url}')">`
                : `<div class="user-photo-placeholder">${user.username.substring(0, 2).toUpperCase()}</div>`;

            const safeUser = window.app.safeJson({ id: user.id, username: user.username, role: user.role, photo_url: user.photo_url || '' });

            card.innerHTML = `
                <div class="user-info" style="display:flex;align-items:center;gap:0.85rem;">
                    ${photoHtml}
                    <div>
                        <h3>${user.username}</h3>
                        <span class="user-role-badge">${user.role}</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-icon" style="color:var(--gold-light);" title="Ver ficha" onclick="app.openUserProfile(JSON.parse(this.dataset.u))" data-u="${safeUser}"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-icon" title="Editar" onclick="app.editUser(${user.id},'${user.username}','${user.role}','${user.photo_url || ''}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" title="Cambiar contraseña" onclick="app.openPasswordModal(${user.id},'${user.username}')"><i class="fas fa-key"></i></button>
                    <button class="btn btn-icon" style="color:var(--priority-high);" title="Eliminar" onclick="app.deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            userList.appendChild(card);
        });
    },

    updateUserSelectors(users) {
        usersModule.buildUserColorMap(users);
        const taskUserSelect = window.app.taskUserSelect;
        if (!taskUserSelect) return;
        taskUserSelect.innerHTML = users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
        const filterUser = window.app.filterUser;
        if (filterUser) {
            const current = filterUser.value;
            filterUser.innerHTML = '<option value="all">Todos los usuarios</option>' +
                users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
            filterUser.value = current;
        }
    },

    openUserModal(user = null) {
        const userModal = window.app.userModal;
        const userForm  = window.app.userForm;
        userModal.classList.add('active');
        userForm.reset();
        const title = document.getElementById('user-modal-title');
        const photoPreview = document.getElementById('user-photo-preview');
        const photoPlaceholder = document.getElementById('photo-placeholder');
        document.getElementById('user-photo-file').value = '';

        if (user) {
            title.textContent = 'Editar Usuario';
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-password-group').style.display = 'none';
            document.getElementById('user-password').required = false;
            if (user.photo_url) {
                photoPreview.src = user.photo_url;
                photoPreview.style.display = 'block';
                photoPlaceholder.style.display = 'none';
            } else {
                photoPreview.style.display = 'none';
                photoPlaceholder.style.display = 'flex';
            }
        } else {
            title.textContent = 'Nuevo Usuario';
            document.getElementById('user-id').value = '';
            document.getElementById('user-password-group').style.display = 'block';
            document.getElementById('user-password').required = true;
            photoPreview.style.display = 'none';
            photoPlaceholder.style.display = 'flex';
        }
    },

    editUser(id, username, role, photoUrl = '') {
        usersModule.openUserModal({ id, username, role, photo_url: photoUrl });
    },

    async handleUserSubmit() {
        const userId = document.getElementById('user-id').value;
        const userData = {
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            role: document.getElementById('user-role').value
        };
        const photoFile = document.getElementById('user-photo-file').files[0];

        try {
            let savedId = userId;
            if (userId) {
                delete userData.password;
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                if (!response.ok) {
                    const data = await response.json();
                    return alert(data.error || 'Error al guardar usuario');
                }
            } else {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                if (!response.ok) {
                    const data = await response.json();
                    return alert(data.error || 'Error al guardar usuario');
                }
                const data = await response.json();
                savedId = data.id;
            }

            if (photoFile && savedId) {
                const formData = new FormData();
                formData.append('photo', photoFile);
                await fetch(`/api/users/${savedId}/photo`, { method: 'POST', body: formData });
            }

            window.app.userModal.classList.remove('active');
            usersModule.loadUsers();
        } catch (error) {
            console.error('Error guardando usuario:', error);
        }
    },

    async deleteUser(id) {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const data = await response.json();
                alert(data.error);
            }
            usersModule.loadUsers();
        } catch (error) {
            console.error('Error eliminando usuario:', error);
        }
    },

    openPasswordModal(id, username) {
        document.getElementById('password-user-id').value = id;
        document.getElementById('password-user-name').textContent = username;
        document.getElementById('new-password').value = '';
        window.app.passwordModal.classList.add('active');
    },

    async handlePasswordSubmit() {
        const id = document.getElementById('password-user-id').value;
        const password = document.getElementById('new-password').value;
        try {
            const response = await fetch(`/api/users/${id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (response.ok) {
                window.app.passwordModal.classList.remove('active');
                alert('Contraseña actualizada con éxito');
            } else {
                const data = await response.json();
                alert(data.error || 'Error al actualizar contraseña');
            }
        } catch (error) {
            console.error('Error actualizando contraseña:', error);
        }
    },

    openUserProfile(user) {
        const body = document.getElementById('profile-modal-body');
        const photoHtml = user.photo_url
            ? `<img src="${user.photo_url}" alt="${user.username}" class="profile-photo-large" style="cursor:zoom-in;" onclick="event.stopPropagation();app.openLightbox('${user.photo_url}')">`
            : `<div class="profile-photo-placeholder-large">${user.username.substring(0, 2).toUpperCase()}</div>`;

        const userTasks   = window.app.tasks.filter(t => t.assigned_to === user.username);
        const pending     = userTasks.filter(t => t.status === 'pendiente').length;
        const inProgress  = userTasks.filter(t => t.status === 'en_progreso').length;
        const completed   = userTasks.filter(t => t.status === 'completada').length;

        const headerBg = user.role === 'admin'
            ? 'rgba(212,168,67,0.15)'
            : 'rgba(52,211,153,0.12)';

        body.innerHTML = `
            <div class="profile-header" style="background:linear-gradient(135deg,${headerBg} 0%,rgba(31,41,55,0.7) 70%);">
                <button class="profile-close close-modal"><i class="fas fa-times"></i></button>
                ${photoHtml}
                <h2 class="profile-name">${user.username}</h2>
                <span class="user-role-badge" style="display:inline-block;margin-top:0.5rem;">${user.role}</span>
            </div>
            <div class="profile-body">
                <div class="profile-stat"><i class="fas fa-clock" style="color:var(--pending-color);"></i><span>Pendientes: <strong>${pending}</strong></span></div>
                <div class="profile-stat"><i class="fas fa-spinner" style="color:var(--progress-color);"></i><span>En progreso: <strong>${inProgress}</strong></span></div>
                <div class="profile-stat"><i class="fas fa-check-circle" style="color:var(--completed-color);"></i><span>Completadas: <strong>${completed}</strong></span></div>
                <div class="profile-stat"><i class="fas fa-layer-group"></i><span>Total asignadas: <strong>${userTasks.length}</strong></span></div>
            </div>
        `;
        document.getElementById('profile-modal').classList.add('active');
    },

};
