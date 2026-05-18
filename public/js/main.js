const app = {
    tasks: [],
    currentDate: new Date(),

    USER_COLORS: 12,
    userColorMap: {},
    calendarDateFilter: null,

    buildUserColorMap(users) {
        this.userColorMap = {};
        users.forEach((user, index) => {
            this.userColorMap[user.username] = index % this.USER_COLORS;
        });
    },

    getUserColorIndex(username) {
        if (!username) return -1;
        if (this.userColorMap[username] !== undefined) {
            return this.userColorMap[username];
        }
        return -1;
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkAuth();
    },

    cacheDOM() {
        this.sidebarItems = document.querySelectorAll('.sidebar-nav li');
        this.views = document.querySelectorAll('.view');
        this.taskModal = document.getElementById('task-modal');
        this.taskForm = document.getElementById('task-form');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.closeModalBtns = document.querySelectorAll('.close-modal');

        this.recentTaskList = document.getElementById('recent-task-list');
        this.fullTaskList = document.getElementById('full-task-list');

        this.statPending = document.getElementById('stat-pending');
        this.statProgress = document.getElementById('stat-progress');
        this.statCompleted = document.getElementById('stat-completed');

        this.calendarDays = document.getElementById('calendar-days');
        this.currentMonthYear = document.getElementById('current-month-year');

        this.filterStatus = document.getElementById('filter-status');
        this.filterTime = document.getElementById('filter-time');
        this.filterPriority = document.getElementById('filter-priority');

        this.statCards = document.querySelectorAll('.stat-card');

        this.loginScreen = document.getElementById('login-screen');
        this.loginForm = document.getElementById('login-form');
        this.appContainer = document.querySelector('.app-container');
        this.logoutBtn = document.getElementById('logout-btn');
        this.loginError = document.getElementById('login-error');

        this.clientModal = document.getElementById('client-modal');
        this.clientForm = document.getElementById('client-form');
        this.addClientBtn = document.getElementById('add-client-btn');
        this.clientList = document.getElementById('client-list');
        this.taskClientSelect = document.getElementById('task-client');
        this.filterClient = document.getElementById('filter-client');
        this.filterUser = document.getElementById('filter-user');

        this.userModal = document.getElementById('user-modal');
        this.userForm = document.getElementById('user-form');
        this.addUserBtn = document.getElementById('add-user-btn');
        this.userList = document.getElementById('user-list');
        this.taskUserSelect = document.getElementById('assigned_to');

        this.passwordModal = document.getElementById('password-modal');
        this.passwordForm = document.getElementById('password-form');

        this.logsList = document.getElementById('logs-list');

        this.notificationBtn = document.getElementById('notifications-btn');
        this.notificationCount = document.getElementById('notification-count');
    },

    bindEvents() {
        // Navigation
        this.sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.view);
                this.sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Task modal
        this.addTaskBtn.addEventListener('click', () => this.openModal());
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal')) this.closeModal();
        });
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });

        // Calendar
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Filters
        this.filterStatus.addEventListener('change', () => { this.clearCalendarFilter(); this.renderTasks(); });
        this.filterTime.addEventListener('change', () => { this.clearCalendarFilter(); this.renderTasks(); });
        this.filterPriority.addEventListener('change', () => this.renderTasks());
        this.filterClient.addEventListener('change', () => this.renderTasks());
        this.filterUser?.addEventListener('change', () => this.renderTasks());

        document.getElementById('clear-calendar-filter')?.addEventListener('click', () => {
            this.clearCalendarFilter();
            this.renderTasks();
        });

        // Dashboard stat cards
        this.statCards.forEach(card => {
            card.addEventListener('click', () => {
                const icon = card.querySelector('.stat-icon');
                if (!icon) return;
                const statusMap = { 'pending': 'pendiente', 'progress': 'en_progreso', 'completed': 'completada' };
                const status = statusMap[icon.classList[1]];
                if (status) {
                    this.filterStatus.value = status;
                    this.switchView('tasks');
                    this.sidebarItems.forEach(i => i.classList.remove('active'));
                    document.querySelector('[data-view="tasks"]').classList.add('active');
                    this.renderTasks();
                }
            });
        });

        // Auth
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Client events
        if (this.addClientBtn) {
            this.addClientBtn.addEventListener('click', () => this.openClientModal());
        }
        if (this.clientForm) {
            this.clientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleClientSubmit();
            });
        }

        // Client logo file preview
        document.getElementById('client-logo-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('client-logo-preview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
                document.getElementById('logo-placeholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        });

        // User events
        if (this.addUserBtn) {
            this.addUserBtn.addEventListener('click', () => this.openUserModal());
        }
        if (this.userForm) {
            this.userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUserSubmit();
            });
        }
        if (this.passwordForm) {
            this.passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordSubmit();
            });
        }

        // User photo file preview
        document.getElementById('user-photo-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = document.getElementById('user-photo-preview');
                preview.src = ev.target.result;
                preview.style.display = 'block';
                document.getElementById('photo-placeholder').style.display = 'none';
            };
            reader.readAsDataURL(file);
        });

        // Notifications
        if (this.notificationBtn) {
            this.notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotifPanel();
            });
        }
        document.getElementById('mark-read-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.markNotificationsRead();
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#notifications-btn')) {
                document.getElementById('notif-panel')?.classList.remove('open');
            }
        });
    },

    async checkAuth() {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            if (data.authenticated) {
                this.setupUserProfile(data.username, data.role);
                this.startNotificationPoller();
                this.showApp();
            } else {
                this.showLogin();
            }
        } catch (error) {
            this.showLogin();
        }
    },

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        this.loginError.textContent = '';
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.setupUserProfile(data.username, data.role);
                this.startNotificationPoller();
                this.showApp();
            } else {
                this.loginError.textContent = data.error || 'Error al iniciar sesión';
            }
        } catch (error) {
            this.loginError.textContent = 'Error de conexión';
        }
    },

    setupUserProfile(username, role) {
        this.currentUser = username;
        const profileName = document.getElementById('user-profile-name');
        const avatar = document.getElementById('user-avatar');
        if (profileName) profileName.textContent = username;
        if (avatar) avatar.textContent = username.substring(0, 2).toUpperCase();
        if (role === 'admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }
    },

    async handleLogout() {
        await fetch('/api/logout', { method: 'POST' });
        this.showLogin();
    },

    showApp() {
        this.loginScreen.style.display = 'none';
        this.appContainer.style.display = 'flex';
        this.loadTasks();
        this.loadClients();
        this.loadUsers();
    },

    showLogin() {
        this.loginScreen.style.display = 'flex';
        this.appContainer.style.display = 'none';
    },

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (response.status === 401) return this.showLogin();
            if (!response.ok) return;
            this.tasks = await response.json();
            this.renderTasks();
            this.updateStats();
            this.renderCalendar();
            if (this.recentTaskList) {
                this.recentTaskList.innerHTML = '';
                this.tasks.slice(0, 5).forEach(task => {
                    this.recentTaskList.appendChild(this.createTaskItem(task));
                });
            }
        } catch (error) {
            console.error('Error cargando tareas:', error);
        }
    },

    async updateStats() {
        try {
            const response = await fetch('/api/stats');
            if (response.status === 401) return;
            const stats = await response.json();
            this.statPending.textContent = stats.pendiente;
            this.statProgress.textContent = stats.en_progreso;
            this.statCompleted.textContent = stats.completada;
        } catch (error) {
            console.error('Error cargando stats:', error);
        }
    },

    switchView(viewId) {
        this.views.forEach(view => view.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        if (viewId === 'tasks') this.renderTasks();
        if (viewId === 'calendar') this.renderCalendar();
        if (viewId === 'clients') this.loadClients();
        if (viewId === 'users') this.loadUsers();
        if (viewId === 'logs') this.loadLogs();
    },

    openModal(task = null) {
        this.taskModal.classList.add('active');
        if (task) {
            document.getElementById('modal-title').textContent = 'Editar Tarea';
            document.getElementById('task-id').value = task.id;
            document.getElementById('title').value = task.title;
            document.getElementById('description').value = task.description;
            document.getElementById('assigned_to').value = task.assigned_to;
            document.getElementById('task-client').value = task.client || '';
            document.getElementById('due_date').value = task.due_date;
            document.getElementById('priority').value = task.priority;
            document.getElementById('status').value = task.status;
            document.getElementById('notes').value = task.notes || '';
        } else {
            document.getElementById('modal-title').textContent = 'Nueva Tarea';
            this.taskForm.reset();
            document.getElementById('task-id').value = '';
        }
    },

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
    },

    async handleTaskSubmit() {
        const taskId = document.getElementById('task-id').value;
        const taskData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            assigned_to: document.getElementById('assigned_to').value,
            client: document.getElementById('task-client').value,
            due_date: document.getElementById('due_date').value,
            priority: document.getElementById('priority').value,
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value
        };
        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `/api/tasks/${taskId}` : '/api/tasks';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (response.ok) {
                this.closeModal();
                this.loadTasks();
            } else {
                const errorData = await response.json();
                alert('Error al guardar la tarea: ' + (errorData.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error guardando tarea:', error);
        }
    },

    renderTasks() {
        // Dashboard recent
        this.recentTaskList.innerHTML = '';
        this.tasks.slice(0, 5).forEach(task => {
            this.recentTaskList.appendChild(this.createTaskItem(task));
        });

        // Full list with filters
        this.fullTaskList.innerHTML = '';
        const statusFilter   = this.filterStatus.value;
        const timeFilter     = this.filterTime.value;
        const priorityFilter = this.filterPriority.value;
        const clientFilter   = this.filterClient.value;
        const userFilter     = this.filterUser?.value || 'all';
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const filteredTasks = this.tasks.filter(task => {
            if (userFilter !== 'all' && task.assigned_to !== userFilter) return false;
            if (statusFilter !== 'all' && task.status !== statusFilter) return false;
            if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
            if (clientFilter !== 'all' && task.client !== clientFilter) return false;
            // Filtro específico del calendario — tiene prioridad sobre el filtro de tiempo
            if (this.calendarDateFilter) {
                return task.due_date === this.calendarDateFilter;
            }
            if (timeFilter !== 'all') {
                const [y, m, d] = task.due_date.split('-').map(Number);
                const taskDate = new Date(y, m - 1, d);
                taskDate.setHours(0, 0, 0, 0);
                if (timeFilter === 'today') {
                    if (taskDate.getTime() !== now.getTime()) return false;
                } else if (timeFilter === 'week') {
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    if (taskDate < startOfWeek || taskDate > endOfWeek) return false;
                } else if (timeFilter === 'month') {
                    if (taskDate.getMonth() !== now.getMonth() || taskDate.getFullYear() !== now.getFullYear()) return false;
                } else if (timeFilter === 'year') {
                    if (taskDate.getFullYear() !== now.getFullYear()) return false;
                }
            }
            return true;
        });

        filteredTasks.forEach(task => {
            this.fullTaskList.appendChild(this.createTaskItem(task));
        });

        if (filteredTasks.length === 0) {
            this.fullTaskList.innerHTML = '<p class="no-tasks">No se encontraron tareas con estos filtros.</p>';
        }
    },

    createTaskItem(task) {
        const div = document.createElement('div');
        div.className = 'task-card';
        const colorIdx = this.getUserColorIndex(task.assigned_to);
        if (colorIdx >= 0) div.setAttribute('data-user-color', colorIdx);

        div.innerHTML = `
            <span class="task-priority priority-${task.priority}">${task.priority}</span>
            <h3>${task.title}</h3>
            <p class="task-desc">${task.description || 'Sin descripción'}</p>
            <div class="task-meta">
                <div class="task-user">
                    <i class="far fa-user"></i>
                    <span>${task.assigned_to || 'Sin asignar'}</span>
                </div>
                <div class="task-date">
                    <i class="far fa-calendar"></i>
                    <span>${task.due_date}</span>
                </div>
                ${task.client ? `
                <div class="task-client">
                    <i class="fas fa-user-tie"></i>
                    <span>${task.client}</span>
                </div>` : ''}
                <span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="btn btn-icon" onclick="app.openModal(${JSON.stringify(task).replace(/"/g, '&quot;')})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-icon" style="color: var(--priority-high);" onclick="app.deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        return div;
    },

    async deleteTask(id) {
        if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            this.loadTasks();
        } catch (error) {
            console.error('Error eliminando tarea:', error);
        }
    },

    // ── Client Management ────────────────────────────────────────
    async loadClients() {
        try {
            const response = await fetch('/api/clients');
            if (!response.ok) return;
            const clients = await response.json();
            this.renderClients(clients);
            this.updateClientSelectors(clients);
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    },

    renderClients(clients) {
        if (!this.clientList) return;
        this.clientList.innerHTML = '';
        clients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';

            const logoHtml = client.logo_url
                ? `<img src="${client.logo_url}" alt="${client.name}" class="client-logo" style="cursor:zoom-in;" onclick="app.openLightbox('${client.logo_url}')">`
                : `<div class="client-logo-placeholder"><i class="fas fa-building"></i></div>`;

            const descHtml = client.description
                ? `<p class="client-description">"${client.description}"</p>`
                : '';

            const instagramHtml = client.instagram_url ? (() => {
                const url = client.instagram_url.startsWith('http')
                    ? client.instagram_url
                    : `https://instagram.com/${client.instagram_url.replace('@', '')}`;
                return `<div class="client-info"><i class="fab fa-instagram" style="color:#E1306C;"></i> <a href="${url}" target="_blank" style="color:var(--gold-light);text-decoration:none;">${client.instagram_url}</a></div>`;
            })() : '';

            const safeClient = JSON.stringify(client).replace(/"/g, '&quot;');

            card.innerHTML = `
                <div class="client-card-header">
                    ${logoHtml}
                    <div style="min-width:0;">
                        <h3 style="margin-bottom:0.15rem;">${client.name}</h3>
                        ${descHtml}
                    </div>
                </div>
                ${client.email ? `<div class="client-info"><i class="fas fa-envelope"></i> ${client.email}</div>` : ''}
                ${client.phone ? `<div class="client-info"><i class="fas fa-phone"></i> ${client.phone}</div>` : ''}
                ${instagramHtml}
                <div style="margin-top: 1rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <button class="btn btn-icon" style="color:var(--gold-light);" title="Ver ficha" onclick="app.openClientProfile(JSON.parse(this.dataset.c))" data-c="${safeClient}"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-icon" title="Editar" onclick="app.openClientModal(JSON.parse(this.dataset.c))" data-c="${safeClient}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="color:var(--priority-high);" title="Eliminar" onclick="app.deleteClient(${client.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            this.clientList.appendChild(card);
        });

        if (clients.length === 0) {
            this.clientList.innerHTML = '<p class="no-tasks">No hay clientes registrados.</p>';
        }
    },

    updateClientSelectors(clients) {
        if (!this.taskClientSelect || !this.filterClient) return;
        const options = clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        this.taskClientSelect.innerHTML = '<option value="">Sin cliente</option>' + options;
        this.filterClient.innerHTML = '<option value="all">Todos los clientes</option>' + options;
    },

    openClientModal(client = null) {
        this.clientModal.classList.add('active');
        const title = document.getElementById('client-modal-title');
        const logoPreview = document.getElementById('client-logo-preview');
        const logoPlaceholder = document.getElementById('logo-placeholder');
        document.getElementById('client-logo-file').value = '';

        if (client) {
            title.textContent = 'Editar Cliente';
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.name || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-phone').value = client.phone || '';
            document.getElementById('client-instagram').value = client.instagram_url || '';
            document.getElementById('client-description').value = client.description || '';
            if (client.logo_url) {
                logoPreview.src = client.logo_url;
                logoPreview.style.display = 'block';
                logoPlaceholder.style.display = 'none';
            } else {
                logoPreview.style.display = 'none';
                logoPlaceholder.style.display = 'flex';
            }
        } else {
            title.textContent = 'Nuevo Cliente';
            this.clientForm.reset();
            document.getElementById('client-id').value = '';
            logoPreview.style.display = 'none';
            logoPlaceholder.style.display = 'flex';
        }
    },

    async handleClientSubmit() {
        const clientId = document.getElementById('client-id').value;
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            instagram_url: document.getElementById('client-instagram').value,
            description: document.getElementById('client-description').value
        };
        const logoFile = document.getElementById('client-logo-file').files[0];

        try {
            let savedId = clientId;
            if (clientId) {
                const response = await fetch(`/api/clients/${clientId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData)
                });
                if (!response.ok) {
                    const data = await response.json();
                    return alert(data.error || 'Error al guardar cliente');
                }
            } else {
                const response = await fetch('/api/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(clientData)
                });
                if (!response.ok) {
                    const data = await response.json();
                    return alert(data.error || 'Error al guardar cliente');
                }
                const data = await response.json();
                savedId = data.id;
            }

            if (logoFile && savedId) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                await fetch(`/api/clients/${savedId}/logo`, { method: 'POST', body: formData });
            }

            this.clientModal.classList.remove('active');
            this.loadClients();
        } catch (error) {
            console.error('Error guardando cliente:', error);
        }
    },

    openLightbox(src) {
        const lb = document.getElementById('lightbox');
        document.getElementById('lightbox-img').src = src;
        lb.style.display = 'flex';
    },

    openClientProfile(client) {
        const body = document.getElementById('profile-modal-body');
        const logoHtml = client.logo_url
            ? `<img src="${client.logo_url}" alt="${client.name}" class="profile-logo-large" style="cursor:zoom-in;" onclick="event.stopPropagation();app.openLightbox('${client.logo_url}')">`
            : `<div class="profile-logo-placeholder-large"><i class="fas fa-building"></i></div>`;

        const instagramUrl = client.instagram_url
            ? (client.instagram_url.startsWith('http') ? client.instagram_url : `https://instagram.com/${client.instagram_url.replace('@', '')}`)
            : null;

        const clientTasks = this.tasks.filter(t => t.client === client.name);
        const activeTasks  = clientTasks.filter(t => t.status !== 'completada').length;
        const doneTask = clientTasks.filter(t => t.status === 'completada').length;

        body.innerHTML = `
            <div class="profile-header" style="background:linear-gradient(135deg,rgba(212,168,67,0.15) 0%,rgba(31,41,55,0.7) 70%);">
                <button class="profile-close close-modal"><i class="fas fa-times"></i></button>
                ${logoHtml}
                <h2 class="profile-name">${client.name}</h2>
                ${client.description ? `<p class="profile-description">"${client.description}"</p>` : ''}
            </div>
            <div class="profile-body">
                ${client.email    ? `<div class="profile-stat"><i class="fas fa-envelope"></i><span>${client.email}</span></div>` : ''}
                ${client.phone    ? `<div class="profile-stat"><i class="fas fa-phone"></i><span>${client.phone}</span></div>` : ''}
                ${instagramUrl    ? `<div class="profile-stat"><i class="fab fa-instagram" style="color:#E1306C;"></i><a href="${instagramUrl}" target="_blank">${client.instagram_url}</a></div>` : ''}
                <div class="profile-stat"><i class="fas fa-tasks"></i><span>Tareas activas: <strong>${activeTasks}</strong></span></div>
                <div class="profile-stat"><i class="fas fa-check-circle" style="color:var(--completed-color);"></i><span>Tareas completadas: <strong>${doneTask}</strong></span></div>
            </div>
        `;
        document.getElementById('profile-modal').classList.add('active');
    },

    openUserProfile(user) {
        const body = document.getElementById('profile-modal-body');
        const photoHtml = user.photo_url
            ? `<img src="${user.photo_url}" alt="${user.username}" class="profile-photo-large" style="cursor:zoom-in;" onclick="event.stopPropagation();app.openLightbox('${user.photo_url}')">`
            : `<div class="profile-photo-placeholder-large">${user.username.substring(0, 2).toUpperCase()}</div>`;

        const userTasks   = this.tasks.filter(t => t.assigned_to === user.username);
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

    async deleteClient(id) {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
        try {
            await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            this.loadClients();
        } catch (error) {
            console.error('Error eliminando cliente:', error);
        }
    },

    // ── User Management ──────────────────────────────────────────
    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            if (response.status === 401) return;
            if (!response.ok) return;
            const users = await response.json();
            this.renderUsers(users);
            this.updateUserSelectors(users);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    },

    renderUsers(users) {
        if (!this.userList) return;
        this.userList.innerHTML = '';
        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';

            const photoHtml = user.photo_url
                ? `<img src="${user.photo_url}" alt="${user.username}" class="user-photo" style="cursor:zoom-in;" onclick="app.openLightbox('${user.photo_url}')">`
                : `<div class="user-photo-placeholder">${user.username.substring(0, 2).toUpperCase()}</div>`;

            const safeUser = JSON.stringify({ id: user.id, username: user.username, role: user.role, photo_url: user.photo_url || '' }).replace(/"/g, '&quot;');

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
            this.userList.appendChild(card);
        });
    },

    updateUserSelectors(users) {
        this.buildUserColorMap(users);
        if (!this.taskUserSelect) return;
        this.taskUserSelect.innerHTML = users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
        if (this.filterUser) {
            const current = this.filterUser.value;
            this.filterUser.innerHTML = '<option value="all">Todos los usuarios</option>' +
                users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
            this.filterUser.value = current;
        }
    },

    openUserModal(user = null) {
        this.userModal.classList.add('active');
        this.userForm.reset();
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
        this.openUserModal({ id, username, role, photo_url: photoUrl });
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

            this.userModal.classList.remove('active');
            this.loadUsers();
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
            this.loadUsers();
        } catch (error) {
            console.error('Error eliminando usuario:', error);
        }
    },

    // ── Activity Logs ────────────────────────────────────────────
    getLogActionMeta(action) {
        const map = {
            'Inicio de sesión':               { icon: 'fa-sign-in-alt',  type: 'auth',     label: 'Inicio sesión' },
            'Cierre de sesión':               { icon: 'fa-sign-out-alt', type: 'auth',     label: 'Cierre sesión' },
            'Creación de tarea':              { icon: 'fa-plus',         type: 'create',   label: 'Nueva tarea' },
            'Actualización de tarea':         { icon: 'fa-pen',          type: 'update',   label: 'Editó tarea' },
            'Eliminación de tarea':           { icon: 'fa-trash',        type: 'delete',   label: 'Eliminó tarea' },
            'Tarea Cerrada/Completada':       { icon: 'fa-check',        type: 'complete', label: 'Completó tarea' },
            'Creación de cliente':            { icon: 'fa-building',     type: 'create',   label: 'Nuevo cliente' },
            'Actualización de cliente':       { icon: 'fa-pen',          type: 'update',   label: 'Editó cliente' },
            'Eliminación de cliente':         { icon: 'fa-building',     type: 'delete',   label: 'Eliminó cliente' },
            'Creación de usuario':            { icon: 'fa-user-plus',    type: 'create',   label: 'Nuevo usuario' },
            'Actualización de usuario':       { icon: 'fa-user-pen',     type: 'update',   label: 'Editó usuario' },
            'Eliminación de usuario':         { icon: 'fa-user-minus',   type: 'delete',   label: 'Eliminó usuario' },
            'Restablecimiento de contraseña': { icon: 'fa-key',          type: 'key',      label: 'Cambió contraseña' },
        };
        return map[action] || { icon: 'fa-circle-dot', type: 'default', label: action };
    },

    getRelativeTime(dateStr) {
        const date = new Date(dateStr);
        const diff = Math.floor((Date.now() - date) / 1000);
        if (diff < 60)     return 'ahora';
        if (diff < 3600)   return `hace ${Math.floor(diff / 60)} min`;
        if (diff < 86400)  return `hace ${Math.floor(diff / 3600)}h`;
        if (diff < 172800) return 'ayer';
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    },

    getDateGroupLabel(dateStr) {
        const date = new Date(dateStr);
        const today = new Date(); today.setHours(0,0,0,0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const d = new Date(date); d.setHours(0,0,0,0);
        if (d.getTime() === today.getTime())     return 'Hoy';
        if (d.getTime() === yesterday.getTime()) return 'Ayer';
        return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    },

    async loadLogs() {
        try {
            const response = await fetch('/api/logs');
            if (response.status === 401) return;
            const logs = await response.json();
            this.renderLogs(logs);
            // Bind search
            document.getElementById('logs-search')?.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                document.querySelectorAll('.log-entry').forEach(entry => {
                    entry.style.display = entry.textContent.toLowerCase().includes(q) ? '' : 'none';
                });
                document.querySelectorAll('.log-date-group').forEach(g => {
                    const next = g.nextElementSibling;
                    g.style.display = (next && next.style.display !== 'none') ? '' : 'none';
                });
            });
        } catch (error) {
            console.error('Error cargando registros:', error);
        }
    },

    renderLogs(logs) {
        if (!this.logsList) return;
        this.logsList.innerHTML = '';

        if (logs.length === 0) {
            this.logsList.innerHTML = '<p class="log-empty">No hay actividad registrada.</p>';
            this.renderLogsStats([]);
            return;
        }

        this.renderLogsStats(logs);

        let lastGroup = null;
        logs.forEach(log => {
            const meta  = this.getLogActionMeta(log.action);
            const group = this.getDateGroupLabel(log.created_at);
            const rel   = this.getRelativeTime(log.created_at);
            const abs   = new Date(log.created_at).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
            const initials = (log.username || '?').substring(0, 2).toUpperCase();

            if (group !== lastGroup) {
                const sep = document.createElement('div');
                sep.className = 'log-date-group';
                sep.textContent = group;
                this.logsList.appendChild(sep);
                lastGroup = group;
            }

            let detailHtml = '';
            if (log.details) {
                try {
                    const details = JSON.parse(log.details);
                    detailHtml = Object.entries(details)
                        .map(([k, v]) => `<span class="log-detail-tag"><span class="log-detail-key">${k}</span> ${v}</span>`)
                        .join('');
                } catch (e) {
                    detailHtml = `<span class="log-detail-tag">${log.details}</span>`;
                }
            }

            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = `
                <div class="log-action-icon log-icon-${meta.type}"><i class="fas ${meta.icon}"></i></div>
                <div class="log-user-avatar">${initials}</div>
                <div class="log-content">
                    <div class="log-header">
                        <span class="log-username">${log.username}</span>
                        <span class="log-action-pill log-pill-${meta.type}">${meta.label}</span>
                    </div>
                    ${detailHtml ? `<div class="log-details-row">${detailHtml}</div>` : ''}
                </div>
                <span class="log-time" title="${abs}">${rel}</span>
            `;
            this.logsList.appendChild(entry);
        });
    },

    renderLogsStats(logs) {
        const el = document.getElementById('logs-stats');
        if (!el) return;
        const creates  = logs.filter(l => this.getLogActionMeta(l.action).type === 'create').length;
        const updates  = logs.filter(l => this.getLogActionMeta(l.action).type === 'update').length;
        const deletes  = logs.filter(l => this.getLogActionMeta(l.action).type === 'delete').length;
        const sessions = logs.filter(l => this.getLogActionMeta(l.action).type === 'auth').length;
        el.innerHTML = `
            <div class="logs-stat-chip"><i class="fas fa-plus" style="color:#34D399;"></i> ${creates}</div>
            <div class="logs-stat-chip"><i class="fas fa-pen" style="color:#FBBF24;"></i> ${updates}</div>
            <div class="logs-stat-chip"><i class="fas fa-trash" style="color:#F87171;"></i> ${deletes}</div>
            <div class="logs-stat-chip"><i class="fas fa-right-to-bracket" style="color:#60A5FA;"></i> ${sessions}</div>
        `;
    },

    openPasswordModal(id, username) {
        document.getElementById('password-user-id').value = id;
        document.getElementById('password-user-name').textContent = username;
        document.getElementById('new-password').value = '';
        this.passwordModal.classList.add('active');
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
                this.passwordModal.classList.remove('active');
                alert('Contraseña actualizada con éxito');
            } else {
                const data = await response.json();
                alert(data.error || 'Error al actualizar contraseña');
            }
        } catch (error) {
            console.error('Error actualizando contraseña:', error);
        }
    },

    // ── Notifications ────────────────────────────────────────────
    startNotificationPoller() {
        this.loadNotifications();
        setInterval(() => this.loadNotifications(), 30000);
    },

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) return;
            const notifications = await response.json();
            this.updateNotificationBadge(notifications.length);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        }
    },

    updateNotificationBadge(count) {
        if (!this.notificationCount) return;
        if (count > 0) {
            this.notificationCount.textContent = count;
            this.notificationCount.style.display = 'block';
        } else {
            this.notificationCount.style.display = 'none';
        }
    },

    toggleNotifPanel() {
        const panel = document.getElementById('notif-panel');
        if (!panel) return;
        const isOpen = panel.classList.toggle('open');
        if (isOpen) this.renderNotifPanel();
    },

    async renderNotifPanel() {
        const list = document.getElementById('notif-list');
        if (!list) return;
        list.innerHTML = '<p class="notif-empty">Cargando...</p>';
        try {
            const response = await fetch('/api/notifications/all');
            if (!response.ok) { list.innerHTML = '<p class="notif-empty">Sin notificaciones</p>'; return; }
            const notifications = await response.json();
            if (notifications.length === 0) { list.innerHTML = '<p class="notif-empty">Sin notificaciones nuevas</p>'; return; }
            list.innerHTML = notifications.map(n => {
                const fecha = new Date(n.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                const isUnread = !n.is_read;
                return `
                <div class="notif-item${isUnread ? ' notif-unread' : ''}">
                    <div class="notif-icon"><i class="fas fa-${isUnread ? 'bell' : 'check'}"></i></div>
                    <div class="notif-body">
                        <p class="notif-msg">${n.message}</p>
                        <p class="notif-time">${fecha}</p>
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            list.innerHTML = '<p class="notif-empty">Sin notificaciones</p>';
        }
    },

    async markNotificationsRead() {
        try {
            await fetch('/api/notifications/read', { method: 'POST' });
            this.updateNotificationBadge(0);
            document.getElementById('notif-panel')?.classList.remove('open');
        } catch (error) {
            console.error('Error al leer notificaciones:', error);
        }
    },

    clearCalendarFilter() {
        this.calendarDateFilter = null;
        document.getElementById('calendar-filter-active').style.display = 'none';
    },

    // ── Calendar ─────────────────────────────────────────────────
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        this.currentMonthYear.textContent = `${monthNames[month]} ${year}`;
        this.calendarDays.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            this.calendarDays.appendChild(empty);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (dateStr === new Date().toISOString().split('T')[0]) dayDiv.classList.add('today');
            dayDiv.innerHTML = `<span class="day-number">${i}</span>`;

            const dayTasks = this.tasks.filter(t => t.due_date === dateStr);
            if (dayTasks.length > 0) {
                const dotsDiv = document.createElement('div');
                dotsDiv.className = 'day-tasks';
                dayTasks.forEach(t => {
                    const dot = document.createElement('div');
                    dot.className = `task-dot status-${t.status}`;
                    dot.title = t.title;
                    dotsDiv.appendChild(dot);
                });
                dayDiv.appendChild(dotsDiv);
                dayDiv.style.cursor = 'pointer';
                dayDiv.addEventListener('click', () => {
                    // Resetear todos los filtros para mostrar TODAS las tareas del día
                    this.filterStatus.value   = 'all';
                    this.filterPriority.value = 'all';
                    this.filterClient.value   = 'all';
                    this.filterTime.value     = 'all';
                    if (this.filterUser) this.filterUser.value = 'all';

                    this.calendarDateFilter = dateStr;
                    this.switchView('tasks');
                    this.sidebarItems.forEach(i => i.classList.remove('active'));
                    document.querySelector('[data-view="tasks"]').classList.add('active');

                    const label = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                    document.getElementById('calendar-filter-label').textContent = label;
                    document.getElementById('calendar-filter-active').style.display = 'block';
                });
            }
            this.calendarDays.appendChild(dayDiv);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
