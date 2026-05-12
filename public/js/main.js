/**
 * GonDesck Main Application Logic
 */

const app = {
    tasks: [],
    currentDate: new Date(),

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
        
        // Lists
        this.recentTaskList = document.getElementById('recent-task-list');
        this.fullTaskList = document.getElementById('full-task-list');
        
        // Stats
        this.statPending = document.getElementById('stat-pending');
        this.statProgress = document.getElementById('stat-progress');
        this.statCompleted = document.getElementById('stat-completed');
        
        // Calendar
        this.calendarDays = document.getElementById('calendar-days');
        this.currentMonthYear = document.getElementById('current-month-year');

        // Filters
        this.filterStatus = document.getElementById('filter-status');
        this.filterTime = document.getElementById('filter-time');
        this.filterPriority = document.getElementById('filter-priority');
        
        // Dashboard Stats Cards
        this.statCards = document.querySelectorAll('.stat-card');

        // Auth
        this.loginScreen = document.getElementById('login-screen');
        this.loginForm = document.getElementById('login-form');
        this.appContainer = document.querySelector('.app-container');
        this.logoutBtn = document.getElementById('logout-btn');
        this.loginError = document.getElementById('login-error');

        // Clients
        this.clientModal = document.getElementById('client-modal');
        this.clientForm = document.getElementById('client-form');
        this.addClientBtn = document.getElementById('add-client-btn');
        this.clientList = document.getElementById('client-list');
        this.taskClientSelect = document.getElementById('task-client');
        this.filterClient = document.getElementById('filter-client');
        this.filterUser   = document.getElementById('filter-user');

        // Users
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

        // Modal
        this.addTaskBtn.addEventListener('click', () => this.openModal());
        // Modal Closing (Event Delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal')) {
                this.closeModal();
            }
        });

        // Form Submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });

        // Calendar Controls
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Filters
        this.filterStatus.addEventListener('change', () => this.renderTasks());
        this.filterTime.addEventListener('change', () => this.renderTasks());
        this.filterPriority.addEventListener('change', () => this.renderTasks());
        this.filterClient.addEventListener('change', () => this.renderTasks());
        this.filterUser?.addEventListener('change', () => this.renderTasks());

        // Dashboard Stats Interaction
        this.statCards.forEach(card => {
            card.addEventListener('click', () => {
                const icon = card.querySelector('.stat-icon');
                if (!icon) return;
                const status = icon.classList[1]; // pending, progress, completed
                const statusMap = {
                    'pending': 'pendiente',
                    'progress': 'en_progreso',
                    'completed': 'completada'
                };
                
                if (statusMap[status]) {
                    this.filterStatus.value = statusMap[status];
                    this.switchView('tasks');
                    this.sidebarItems.forEach(i => i.classList.remove('active'));
                    document.querySelector('[data-view="tasks"]').classList.add('active');
                    this.renderTasks();
                }
            });
        });

        // Auth Events
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Client Events
        if (this.addClientBtn) {
            this.addClientBtn.addEventListener('click', () => this.openClientModal());
        }
        if (this.clientForm) {
            this.clientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleClientSubmit();
            });
        }

        // User Events
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
            
            // Re-render recent tasks in dashboard
            if (this.recentTaskList) {
                this.recentTaskList.innerHTML = '';
                const recent = this.tasks.slice(0, 5);
                recent.forEach(task => {
                    this.recentTaskList.appendChild(this.createTaskItem(task, 'list'));
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
        this.views.forEach(view => {
            view.classList.remove('active');
        });
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
                method: method,
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
            alert('Error de conexión al guardar la tarea');
        }
    },

    renderTasks() {
        // Dashboard Recent Tasks
        this.recentTaskList.innerHTML = '';
        const recent = this.tasks.slice(0, 5);
        recent.forEach(task => {
            this.recentTaskList.appendChild(this.createTaskItem(task, 'list'));
        });

        // Full Task List with Filtering
        this.fullTaskList.innerHTML = '';
        
        const statusFilter   = this.filterStatus.value;
        const timeFilter     = this.filterTime.value;
        const priorityFilter = this.filterPriority.value;
        const clientFilter   = this.filterClient.value;
        const userFilter     = this.filterUser?.value || 'all';
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const filteredTasks = this.tasks.filter(task => {
            // Filter by User
            if (userFilter !== 'all' && task.assigned_to !== userFilter) return false;

            // Filter by Status
            if (statusFilter !== 'all' && task.status !== statusFilter) return false;

            // Filter by Priority
            if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

            // Filter by Client
            if (clientFilter !== 'all' && task.client !== clientFilter) return false;

            // Filter by Time
            if (timeFilter !== 'all') {
                const [y, m, d] = task.due_date.split('-').map(Number);
                const taskDate = new Date(y, m - 1, d);
                taskDate.setHours(0, 0, 0, 0);

                if (timeFilter === 'today') {
                    if (taskDate.getTime() !== now.getTime()) return false;
                } else if (timeFilter === 'week') {
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    
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
            this.fullTaskList.appendChild(this.createTaskItem(task, 'card'));
        });
        
        if (filteredTasks.length === 0) {
            this.fullTaskList.innerHTML = '<p class="no-tasks">No se encontraron tareas con estos filtros.</p>';
        }
    },

    createTaskItem(task, type) {
        const div = document.createElement('div');
        div.className = type === 'list' ? 'task-card' : 'task-card'; // We'll use same cards for both for now
        
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
                <div class="task-client" style="color: var(--accent); font-weight: 500;">
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

    // Client Management
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
            card.innerHTML = `
                <h3>${client.name}</h3>
                ${client.email ? `<div class="client-info"><i class="fas fa-envelope"></i> ${client.email}</div>` : ''}
                ${client.phone ? `<div class="client-info"><i class="fas fa-phone"></i> ${client.phone}</div>` : ''}
                <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                    <button class="btn btn-icon" style="color: var(--priority-high);" onclick="app.deleteClient(${client.id})"><i class="fas fa-trash"></i></button>
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

    openClientModal() {
        this.clientModal.classList.add('active');
        this.clientForm.reset();
    },

    async handleClientSubmit() {
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value
        };

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });

            if (response.ok) {
                this.clientModal.classList.remove('active');
                this.loadClients();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al guardar cliente');
            }
        } catch (error) {
            console.error('Error guardando cliente:', error);
        }
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

    // User Management
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
            card.innerHTML = `
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <span class="user-role-badge">${user.role}</span>
                </div>
                <div class="user-actions">
                    <button class="btn btn-icon" style="color: var(--primary);" onclick="app.editUser(${user.id}, '${user.username}', '${user.role}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="color: var(--accent);" onclick="app.openPasswordModal(${user.id}, '${user.username}')"><i class="fas fa-key"></i></button>
                    <button class="btn btn-icon" style="color: var(--priority-high);" onclick="app.deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            this.userList.appendChild(card);
        });
    },

    updateUserSelectors(users) {
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
        if (user) {
            title.textContent = 'Editar Usuario';
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-password-group').style.display = 'none';
            document.getElementById('user-password').required = false;
        } else {
            title.textContent = 'Nuevo Usuario';
            document.getElementById('user-id').value = '';
            document.getElementById('user-password-group').style.display = 'block';
            document.getElementById('user-password').required = true;
        }
    },

    editUser(id, username, role) {
        this.openUserModal({ id, username, role });
    },

    async handleUserSubmit() {
        const userId = document.getElementById('user-id').value;
        const userData = {
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            role: document.getElementById('user-role').value
        };

        try {
            let response;
            if (userId) {
                // Edit existing user
                delete userData.password; // Don't send password for edit
                response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
            } else {
                // Create new user
                response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
            }

            if (response.ok) {
                this.userModal.classList.remove('active');
                this.loadUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Error al guardar usuario');
            }
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

    // Activity Logs
    async loadLogs() {
        try {
            const response = await fetch('/api/logs');
            if (response.status === 401) return;
            const logs = await response.json();
            this.renderLogs(logs);
        } catch (error) {
            console.error('Error cargando registros:', error);
        }
    },

    renderLogs(logs) {
        if (!this.logsList) return;
        this.logsList.innerHTML = '';
        logs.forEach(log => {
            const row = document.createElement('tr');
            const date = new Date(log.created_at).toLocaleString();
            
            // Format details
            let formattedDetails = '-';
            if (log.details) {
                try {
                    const details = JSON.parse(log.details);
                    formattedDetails = Object.entries(details)
                        .map(([key, val]) => `<strong>${key}:</strong> ${val}`)
                        .join(' | ');
                } catch (e) {
                    formattedDetails = log.details;
                }
            }

            row.innerHTML = `
                <td style="white-space: nowrap;">${date}</td>
                <td><strong>${log.username}</strong></td>
                <td><span class="log-action-badge">${log.action}</span></td>
                <td><span class="log-details">${formattedDetails}</span></td>
            `;
            this.logsList.appendChild(row);
        });

        if (logs.length === 0) {
            this.logsList.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay actividad registrada.</td></tr>';
        }
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

    // Notifications
    startNotificationPoller() {
        this.loadNotifications();
        setInterval(() => this.loadNotifications(), 30000); // Check every 30s
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
            if (!response.ok) {
                list.innerHTML = '<p class="notif-empty">Sin notificaciones</p>';
                return;
            }
            const notifications = await response.json();
            if (notifications.length === 0) {
                list.innerHTML = '<p class="notif-empty">Sin notificaciones nuevas</p>';
                return;
            }
            list.innerHTML = notifications.map(n => {
                const fecha = new Date(n.created_at).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
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

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        this.currentMonthYear.textContent = `${monthNames[month]} ${year}`;

        this.calendarDays.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Padding days
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            this.calendarDays.appendChild(emptyDay);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            if (dateStr === new Date().toISOString().split('T')[0]) {
                dayDiv.classList.add('today');
            }

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
                
                dayDiv.addEventListener('click', () => {
                    this.switchView('tasks');
                    // Filter tasks logic could go here
                });
            }

            this.calendarDays.appendChild(dayDiv);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
