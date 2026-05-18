const app = {
    tasks: [],
    proyectos: [],
    currentProyecto: null,
    pipelineDeals: [],
    reuniones: [],
    reunCalDate: new Date(),
    ingresos: [],
    gastos: [],
    finCategories: [],
    presupuestos: [],
    kbArticles: [],
    kbCurrentArticle: null,
    finCharts: {},
    currentDate: new Date(),

    USER_COLORS: 12,
    userColorMap: {},
    calendarDateFilter: null,

    safeJson(obj) { return JSON.stringify(obj).replace(/"/g, '&quot;'); },
    todayStr()    { return new Date().toISOString().split('T')[0]; },

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

        this.finanzaModal = document.getElementById('finanza-modal');
        this.finanzaForm = document.getElementById('finanza-form');
        this.addFinanzaBtn = document.getElementById('add-finanza-btn');
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
        // Finanzas
        this.addFinanzaBtn?.addEventListener('click', () => this.openFinanzaModal());
        this.finanzaForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFinanzaSubmit();
        });
        document.querySelectorAll('.fin-tab:not([data-cattab])').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.fin-tab:not([data-cattab])').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const isIngresos = tab.dataset.tab === 'ingresos';
                document.getElementById('fin-ingresos-list').style.display = isIngresos ? 'flex' : 'none';
                document.getElementById('fin-gastos-list').style.display   = isIngresos ? 'none' : 'flex';
                document.getElementById('fin-search-client').style.display = isIngresos ? '' : 'none';
                this.updateSearchCatOptions(tab.dataset.tab);
                this.applyFinSearch();
            });
        });
        document.getElementById('fin-filter-periodo')?.addEventListener('change', () => this.renderFinanzas());
        document.getElementById('fin-toggle-charts')?.addEventListener('click', () => {
            const panel   = document.getElementById('fin-charts-panel');
            const btnSpan = document.querySelector('#fin-toggle-charts span');
            const visible = panel.style.display !== 'none';
            panel.style.display = visible ? 'none' : 'block';
            if (btnSpan) btnSpan.textContent = visible ? 'Ver Gráficas' : 'Ocultar Gráficas';
            if (!visible) this.renderFinCharts();
            else this.destroyFinCharts();
        });

        // Buscador avanzado
        document.getElementById('fin-search-text')?.addEventListener('input',  () => this.applyFinSearch());
        document.getElementById('fin-search-cat')?.addEventListener('change',  () => this.applyFinSearch());
        document.getElementById('fin-search-client')?.addEventListener('change',() => this.applyFinSearch());
        document.getElementById('fin-search-from')?.addEventListener('change', () => this.applyFinSearch());
        document.getElementById('fin-search-to')?.addEventListener('change',   () => this.applyFinSearch());
        document.getElementById('fin-clear-search')?.addEventListener('click', () => this.clearFinSearch());

        // Proyectos
        document.getElementById('add-proyecto-btn')?.addEventListener('click', () => this.openProyectoModal());
        document.getElementById('proyecto-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleProyectoSubmit(); });
        document.getElementById('proy-search')?.addEventListener('input', () => this.renderProyectos());
        document.getElementById('proy-filter-status')?.addEventListener('change', () => this.renderProyectos());
        document.getElementById('proy-detail-edit-btn')?.addEventListener('click', () => {
            this.closeModal();
            if (this.currentProyecto) this.openProyectoModal(this.currentProyecto);
        });
        document.getElementById('proy-detail-delete-btn')?.addEventListener('click', () => {
            if (this.currentProyecto) this.deleteProyecto(this.currentProyecto.id);
        });
        document.getElementById('proy-add-task-btn')?.addEventListener('click', () => {
            this.closeModal();
            if (this.currentProyecto) {
                this.openModal();
                setTimeout(() => {
                    const sel = document.getElementById('task-project');
                    if (sel) sel.value = this.currentProyecto.id;
                }, 50);
            }
        });

        // Pipeline
        document.getElementById('add-deal-btn')?.addEventListener('click', () => this.openDealModal());
        document.getElementById('deal-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleDealSubmit(); });
        document.getElementById('pipe-search')?.addEventListener('input', () => this.renderPipeline());
        document.getElementById('pipe-filter-user')?.addEventListener('change', () => this.renderPipeline());

        // Reuniones
        document.getElementById('add-reunion-btn')?.addEventListener('click', () => this.openReunionModal());
        document.getElementById('reunion-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleReunionSubmit(); });
        ['reun-search','reun-filter-type','reun-filter-status','reun-filter-from','reun-filter-to']
            .forEach(id => document.getElementById(id)?.addEventListener(id === 'reun-search' ? 'input' : 'change', () => this.renderReuniones()));
        document.getElementById('reun-clear-filters')?.addEventListener('click', () => {
            ['reun-search','reun-filter-from','reun-filter-to'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            document.getElementById('reun-filter-type').value   = 'all';
            document.getElementById('reun-filter-status').value = 'all';
            this.renderReuniones();
        });
        document.querySelectorAll('.reun-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.reun-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const isLista = btn.dataset.reunview === 'lista';
                document.getElementById('reun-lista').style.display      = isLista ? 'grid' : 'none';
                document.getElementById('reun-calendario').style.display = isLista ? 'none'  : 'block';
                if (!isLista) this.renderReunCal();
            });
        });
        document.getElementById('reun-prev-month')?.addEventListener('click', () => {
            this.reunCalDate.setMonth(this.reunCalDate.getMonth() - 1);
            this.renderReunCal();
        });
        document.getElementById('reun-next-month')?.addEventListener('click', () => {
            this.reunCalDate.setMonth(this.reunCalDate.getMonth() + 1);
            this.renderReunCal();
        });
        document.querySelectorAll('.reun-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.reun-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toggleReunTypeFields(btn.dataset.rtype);
            });
        });

        // Base de Conocimiento
        document.getElementById('add-kb-btn')?.addEventListener('click', () => this.openKbModal());
        document.getElementById('kb-pdf-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            document.getElementById('kb-pdf-name').textContent = file.name;
            document.getElementById('kb-pdf-view').style.display = 'none';
            document.getElementById('kb-pdf-current').style.display = 'flex';
            document.getElementById('kb-pdf-placeholder').style.display = 'none';
        });
        document.getElementById('kb-pdf-remove')?.addEventListener('click', () => this.removeKbPdf());
        document.getElementById('kb-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleKbSubmit(); });
        document.getElementById('kb-search')?.addEventListener('input', () => this.renderKb());
        document.getElementById('kb-detail-edit-btn')?.addEventListener('click', () => {
            this.closeModal();
            if (this.kbCurrentArticle) this.openKbModal(this.kbCurrentArticle);
        });
        document.getElementById('kb-detail-delete-btn')?.addEventListener('click', () => {
            if (this.kbCurrentArticle) this.deleteKbArticle(this.kbCurrentArticle.id);
        });

        // Presupuestos
        document.getElementById('add-presupuesto-btn')?.addEventListener('click', () => this.openPresupuestoModal());
        document.getElementById('presupuesto-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePresupuestoSubmit();
        });
        ['pres-search','pres-filter-status','pres-sort','pres-from','pres-to','pres-amount-min','pres-amount-max']
            .forEach(id => document.getElementById(id)?.addEventListener(id === 'pres-search' ? 'input' : 'change', () => this.renderPresupuestos()));
        document.getElementById('pres-clear-filters')?.addEventListener('click', () => {
            ['pres-search','pres-from','pres-to','pres-amount-min','pres-amount-max'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            document.getElementById('pres-filter-status').value = 'all';
            document.getElementById('pres-sort').value = 'date_desc';
            this.renderPresupuestos();
        });

        // PDF adjunto en presupuesto
        document.getElementById('pres-pdf-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            document.getElementById('pres-pdf-name').textContent = file.name;
            document.getElementById('pres-pdf-view').style.display = 'none';
            document.getElementById('pres-pdf-current').style.display = 'flex';
            document.getElementById('pres-pdf-placeholder').style.display = 'none';
        });
        document.getElementById('pres-pdf-remove')?.addEventListener('click', () => this.removePresPdf());

        // Modal categorías
        document.getElementById('manage-cats-btn')?.addEventListener('click', () => this.openCatModal());
        document.getElementById('cat-add-btn')?.addEventListener('click', () => this.handleAddCat());
        document.getElementById('cat-new-name')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.handleAddCat(); }
        });
        document.querySelectorAll('[data-cattab]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-cattab]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('cat-list-ingreso').style.display = btn.dataset.cattab === 'ingreso' ? 'flex' : 'none';
                document.getElementById('cat-list-gasto').style.display   = btn.dataset.cattab === 'gasto'   ? 'flex' : 'none';
            });
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
        this.loadProyectos();
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
            this.renderCalendar(); // calendar lives in dashboard
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
        if (viewId === 'dashboard') this.renderCalendar();
        if (viewId === 'calendar') this.renderCalendar();
        if (viewId === 'clients') this.loadClients();
        if (viewId === 'users') this.loadUsers();
        if (viewId === 'logs') this.loadLogs();
        if (viewId === 'proyectos') this.loadProyectos();
        if (viewId === 'manual') this.initManual();
        if (viewId === 'pipeline') this.loadPipeline();
        if (viewId === 'reuniones') this.loadReuniones();
        if (viewId === 'finanzas') this.loadFinanzas();
        if (viewId === 'presupuestos') this.loadPresupuestos();
        if (viewId === 'kb') this.loadKb();
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
            const projSel = document.getElementById('task-project');
            if (projSel) projSel.value = task.project_id || '';
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
            notes:      document.getElementById('notes').value,
            project_id: document.getElementById('task-project')?.value || null
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
                <button class="btn btn-icon" onclick="app.openModal(${this.safeJson(task)})"><i class="fas fa-edit"></i></button>
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
            this.clients = clients;
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

            const safeClient = this.safeJson(client);

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

            const safeUser = this.safeJson({ id: user.id, username: user.username, role: user.role, photo_url: user.photo_url || '' });

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

    // ── Proyectos ─────────────────────────────────────────────────
    PROY_COLORS: ['#60A5FA','#34D399','#F472B6','#FBBF24','#A78BFA','#FB923C','#22D3EE','#F87171','#4ADE80','#818CF8'],

    async loadProyectos() {
        try {
            const r = await fetch('/api/proyectos');
            if (!r.ok) return;
            this.proyectos = await r.json();
            this.updateTaskProjectSelector();
            this.renderProyectos();
        } catch (e) { console.error('Error cargando proyectos:', e); }
    },

    updateTaskProjectSelector() {
        const sel = document.getElementById('task-project');
        if (!sel) return;
        const prev = sel.value;
        sel.innerHTML = '<option value="">Sin proyecto</option>' +
            this.proyectos.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        if (prev) sel.value = prev;
    },

    renderProyectos() {
        const search  = (document.getElementById('proy-search')?.value || '').toLowerCase().trim();
        const statusF = document.getElementById('proy-filter-status')?.value || 'all';

        const filtered = this.proyectos.filter(p => {
            if (statusF !== 'all' && p.status !== statusF) return false;
            if (search && !p.name.toLowerCase().includes(search) && !(p.client_name||'').toLowerCase().includes(search)) return false;
            return true;
        });

        // Stats
        document.getElementById('proy-stat-total').textContent      = this.proyectos.length;
        document.getElementById('proy-stat-activos').textContent     = this.proyectos.filter(p => p.status === 'en_curso').length;
        document.getElementById('proy-stat-entregados').textContent  = this.proyectos.filter(p => p.status === 'entregado').length;
        const progresos = this.proyectos.map(p => this.calcProyProgress(p.id));
        const avg = progresos.length ? Math.round(progresos.reduce((a,b) => a+b, 0) / progresos.length) : 0;
        document.getElementById('proy-stat-progreso').textContent = avg + '%';

        const container = document.getElementById('proyectos-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<div class="proy-empty"><i class="fas fa-layer-group" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>No hay proyectos que coincidan.</div>';
            return;
        }

        const statusLabels = { en_curso:'En Curso', pausado:'Pausado', entregado:'Entregado', cancelado:'Cancelado' };

        container.innerHTML = filtered.map(p => {
            const prog     = this.calcProyProgress(p.id);
            const taskInfo = this.getProyTaskInfo(p.id);
            const dateHtml = (p.start_date || p.end_date)
                ? `<span><i class="far fa-calendar"></i>${p.start_date||'?'} → ${p.end_date||'?'}</span>` : '';
            const budgetHtml = p.budget > 0 ? `<span><i class="fas fa-dollar-sign"></i>${this.formatMonto(p.budget)}</span>` : '';
            return `
                <div class="proy-card" onclick="app.openProyectoDetail(${p.id})">
                    <div class="proy-card-top" style="background:${p.color||'#60A5FA'};"></div>
                    <div class="proy-card-body">
                        <div class="proy-card-header">
                            <div class="proy-card-name">${p.name}</div>
                            <span class="proy-status-badge pbadge-${p.status}">${statusLabels[p.status]}</span>
                        </div>
                        ${p.client_name ? `<div class="proy-card-client"><i class="fas fa-user-tie"></i>${p.client_name}</div>` : ''}
                        <div class="proy-progress-wrap">
                            <div class="proy-progress-label">
                                <span>${taskInfo.done}/${taskInfo.total} tareas</span>
                                <span>${prog}%</span>
                            </div>
                            <div class="proy-progress-track">
                                <div class="proy-progress-fill" style="width:${prog}%;background:${p.color||'#60A5FA'};"></div>
                            </div>
                        </div>
                        <div class="proy-card-meta">
                            ${dateHtml}${budgetHtml}
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    calcProyProgress(projectId) {
        const tasks = this.tasks.filter(t => t.project_id == projectId);
        if (!tasks.length) return 0;
        return Math.round(tasks.filter(t => t.status === 'completada').length / tasks.length * 100);
    },

    getProyTaskInfo(projectId) {
        const tasks = this.tasks.filter(t => t.project_id == projectId);
        return { total: tasks.length, done: tasks.filter(t => t.status === 'completada').length };
    },

    openProyectoDetail(id) {
        const p = this.proyectos.find(x => x.id === id);
        if (!p) return;
        this.currentProyecto = p;
        document.getElementById('proy-detail-name').textContent = p.name;
        const statusLabels = { en_curso:'En Curso', pausado:'Pausado', entregado:'Entregado', cancelado:'Cancelado' };
        document.getElementById('proy-detail-meta').innerHTML = `
            ${p.client_name ? `<span><i class="fas fa-user-tie" style="color:var(--gold);"></i>${p.client_name}</span>` : ''}
            <span class="proy-status-badge pbadge-${p.status}">${statusLabels[p.status]}</span>
            ${p.end_date ? `<span><i class="far fa-calendar"></i> Entrega: ${p.end_date}</span>` : ''}
            ${p.budget > 0 ? `<span><i class="fas fa-dollar-sign"></i>${this.formatMonto(p.budget)}</span>` : ''}`;

        const prog = this.calcProyProgress(id);
        document.getElementById('proy-detail-progress-pct').textContent = prog + '%';
        document.getElementById('proy-detail-progress-bar').style.cssText = `width:${prog}%;background:${p.color||'#60A5FA'};`;

        const tasks = this.tasks.filter(t => t.project_id == id);
        const tasksHtml = tasks.length
            ? tasks.map(t => `
                <div class="proy-task-item">
                    <div class="proy-task-check ${t.status==='completada'?'done':''}">
                        ${t.status==='completada'?'<i class="fas fa-check"></i>':''}
                    </div>
                    <span class="proy-task-title ${t.status==='completada'?'done':''}">${t.title}</span>
                    <span class="status-badge status-${t.status}" style="font-size:0.65rem;">${t.status.replace('_',' ')}</span>
                    <span style="font-size:0.75rem;color:var(--text-muted);">${t.due_date||''}</span>
                </div>`).join('')
            : '<p style="color:var(--text-muted);font-size:0.85rem;padding:1rem 0;">Sin tareas asignadas a este proyecto.</p>';
        document.getElementById('proy-detail-tasks').innerHTML = tasksHtml;
        document.getElementById('proyecto-detail-modal').classList.add('active');
    },

    openProyectoModal(p = null) {
        document.getElementById('proyecto-modal').classList.add('active');
        document.getElementById('proyecto-modal-title').textContent = p ? 'Editar Proyecto' : 'Nuevo Proyecto';
        document.getElementById('proy-id').value = p ? p.id : '';

        const dl = document.getElementById('proy-client-list');
        if (dl && this.clients) dl.innerHTML = this.clients.map(c => `<option value="${c.name}">`).join('');

        const selectedColor = p?.color || '#60A5FA';
        document.getElementById('proy-color').value = selectedColor;
        const picker = document.getElementById('proy-color-picker');
        if (picker) {
            picker.innerHTML = this.PROY_COLORS.map(c => `
                <div class="proy-color-dot${c===selectedColor?' selected':''}" style="background:${c};" data-color="${c}" onclick="app.selectProyColor('${c}')"></div>
            `).join('');
        }

        if (p) {
            document.getElementById('proy-name').value          = p.name;
            document.getElementById('proy-client').value        = p.client_name || '';
            document.getElementById('proy-status-field').value  = p.status;
            document.getElementById('proy-description').value   = p.description || '';
            document.getElementById('proy-start').value         = p.start_date || '';
            document.getElementById('proy-end').value           = p.end_date || '';
            document.getElementById('proy-budget').value        = p.budget || '';
        } else {
            document.getElementById('proyecto-form').reset();
            document.getElementById('proy-id').value = '';
        }
    },

    selectProyColor(color) {
        document.getElementById('proy-color').value = color;
        document.querySelectorAll('.proy-color-dot').forEach(d => d.classList.toggle('selected', d.dataset.color === color));
    },

    async handleProyectoSubmit() {
        const id   = document.getElementById('proy-id').value;
        const data = {
            name:        document.getElementById('proy-name').value,
            client_name: document.getElementById('proy-client').value,
            status:      document.getElementById('proy-status-field').value,
            description: document.getElementById('proy-description').value,
            start_date:  document.getElementById('proy-start').value,
            end_date:    document.getElementById('proy-end').value,
            budget:      document.getElementById('proy-budget').value || 0,
            color:       document.getElementById('proy-color').value,
        };
        const method = id ? 'PUT' : 'POST';
        const url    = id ? `/api/proyectos/${id}` : '/api/proyectos';
        try {
            const r = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if (r.ok) { this.closeModal(); this.loadProyectos(); }
            else { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); }
        } catch (e) { console.error('Error guardando proyecto:', e); }
    },

    async deleteProyecto(id) {
        if (!confirm('¿Eliminar este proyecto? Las tareas vinculadas quedarán sin proyecto.')) return;
        try {
            await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
            this.closeModal();
            this.loadProyectos();
            this.loadTasks();
        } catch (e) { console.error('Error eliminando proyecto:', e); }
    },

    // ── Pipeline de Ventas ────────────────────────────────────────
    async loadPipeline() {
        try {
            const r = await fetch('/api/pipeline');
            if (!r.ok) return;
            this.pipelineDeals = await r.json();
            this.renderPipeline();
            this.renderPipelineUserFilter();
        } catch (e) { console.error('Error cargando pipeline:', e); }
    },

    renderPipelineUserFilter() {
        const sel = document.getElementById('pipe-filter-user');
        if (!sel || !this.users) return;
        const prev = sel.value;
        sel.innerHTML = '<option value="all">Todos los responsables</option>' +
            this.users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
        if (prev) sel.value = prev;
    },

    renderPipeline() {
        const search   = (document.getElementById('pipe-search')?.value || '').toLowerCase().trim();
        const userF    = document.getElementById('pipe-filter-user')?.value || 'all';
        const STAGES   = ['prospecto','contactado','propuesta','negociando','ganado','perdido'];

        const filtered = this.pipelineDeals.filter(d => {
            if (userF !== 'all' && d.assigned_to !== userF) return false;
            if (search && !d.title.toLowerCase().includes(search) && !d.contact_name.toLowerCase().includes(search)) return false;
            return true;
        });

        // Stats
        const active   = this.pipelineDeals.filter(d => !['ganado','perdido'].includes(d.stage)).length;
        const ganados  = this.pipelineDeals.filter(d => d.stage === 'ganado').length;
        const total    = this.pipelineDeals.filter(d => ['ganado','perdido'].includes(d.stage)).length;
        const rate     = total > 0 ? Math.round((ganados / total) * 100) : 0;
        const valor    = filtered.filter(d => d.stage !== 'perdido')
                                 .reduce((s, d) => s + Number(d.amount) * (Number(d.probability) / 100), 0);
        document.getElementById('pipe-stat-active').textContent  = active;
        document.getElementById('pipe-stat-ganados').textContent = ganados;
        document.getElementById('pipe-stat-valor').textContent   = this.formatMonto(valor);
        document.getElementById('pipe-stat-rate').textContent    = rate + '%';

        // Render columns
        STAGES.forEach(stage => {
            const col   = document.getElementById(`col-${stage}`);
            const cnt   = document.getElementById(`cnt-${stage}`);
            const deals = filtered.filter(d => d.stage === stage);
            if (cnt) cnt.textContent = deals.length;
            if (!col) return;
            if (deals.length === 0) {
                col.innerHTML = '<div class="pipe-col-empty">Arrastrá deals aquí</div>';
                return;
            }
            col.innerHTML = deals.map(d => this.buildDealCard(d)).join('');
            col.querySelectorAll('.deal-card').forEach(card => this.attachDragEvents(card));
        });

        this.setupDropZones();
    },

    buildDealCard(d) {
        const prob = Math.min(100, Math.max(0, Number(d.probability)));
        const closeHtml  = d.expected_close ? `<span class="deal-tag close"><i class="far fa-calendar"></i> ${d.expected_close}</span>` : '';
        const userHtml   = d.assigned_to    ? `<span class="deal-tag user"><i class="far fa-user"></i> ${d.assigned_to}</span>` : '';
        const sourceHtml = d.source         ? `<span class="deal-tag source">${d.source}</span>` : '';
        return `
            <div class="deal-card stage-${d.stage}" draggable="true" data-id="${d.id}" data-stage="${d.stage}">
                <div class="deal-card-title">${d.title}</div>
                <div class="deal-card-contact"><i class="fas fa-user-tie"></i>${d.contact_name}</div>
                ${Number(d.amount) > 0 ? `<div class="deal-card-amount">${this.formatMonto(d.amount)}</div>` : ''}
                <div class="deal-prob-bar-wrap"><div class="deal-prob-bar" style="width:${prob}%"></div></div>
                <div class="deal-card-meta">
                    <span class="deal-tag">${prob}% prob.</span>
                    ${closeHtml}${userHtml}${sourceHtml}
                </div>
                ${d.notes ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.4rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${d.notes}</p>` : ''}
                <div class="deal-card-actions">
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;" onclick="app.openDealModal(${this.safeJson(d)})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;color:var(--priority-high);" onclick="app.deleteDeal(${d.id})"><i class="fas fa-trash"></i></button>
                    ${d.stage === 'ganado' ? `<button class="btn btn-icon" style="padding:0.3rem 0.45rem;color:var(--completed-color);" title="Crear ingreso" onclick="app.dealToIngreso(${this.safeJson(d)})"><i class="fas fa-coins"></i></button>` : ''}
                </div>
            </div>`;
    },

    attachDragEvents(card) {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('dealId', card.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
    },

    setupDropZones() {
        document.querySelectorAll('.pipe-col-body').forEach(col => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                col.closest('.pipe-col').classList.add('drag-over');
            });
            col.addEventListener('dragleave', () => col.closest('.pipe-col').classList.remove('drag-over'));
            col.addEventListener('drop', async (e) => {
                e.preventDefault();
                col.closest('.pipe-col').classList.remove('drag-over');
                const id    = e.dataTransfer.getData('dealId');
                const stage = col.closest('.pipe-col').dataset.stage;
                if (!id || !stage) return;
                const deal = this.pipelineDeals.find(d => d.id == id);
                if (!deal || deal.stage === stage) return;
                deal.stage = stage;
                this.renderPipeline();
                try {
                    await fetch(`/api/pipeline/${id}/stage`, {
                        method: 'PATCH',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({ stage })
                    });
                } catch (err) { console.error('Error moviendo deal:', err); }
            });
        });
    },

    openDealModal(d = null) {
        document.getElementById('deal-modal').classList.add('active');
        document.getElementById('deal-modal-title').textContent = d ? 'Editar Oportunidad' : 'Nueva Oportunidad';
        document.getElementById('deal-id').value = d ? d.id : '';

        // Datalist
        const dl = document.getElementById('deal-contact-list');
        if (dl && this.clients) dl.innerHTML = this.clients.map(c => `<option value="${c.name}">`).join('');
        const sel = document.getElementById('deal-assigned');
        if (sel && this.users) {
            sel.innerHTML = '<option value="">Sin asignar</option>' +
                this.users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
        }

        if (d) {
            document.getElementById('deal-title').value       = d.title;
            document.getElementById('deal-contact').value     = d.contact_name;
            document.getElementById('deal-stage').value       = d.stage;
            document.getElementById('deal-amount').value      = d.amount || '';
            document.getElementById('deal-probability').value = d.probability ?? 50;
            document.getElementById('deal-close').value       = d.expected_close || '';
            document.getElementById('deal-source').value      = d.source || 'Otro';
            document.getElementById('deal-assigned').value    = d.assigned_to || '';
            document.getElementById('deal-notes').value       = d.notes || '';
        } else {
            document.getElementById('deal-form').reset();
            document.getElementById('deal-id').value          = '';
            document.getElementById('deal-probability').value = 50;
        }
    },

    async handleDealSubmit() {
        const id   = document.getElementById('deal-id').value;
        const data = {
            title:          document.getElementById('deal-title').value,
            contact_name:   document.getElementById('deal-contact').value,
            stage:          document.getElementById('deal-stage').value,
            amount:         document.getElementById('deal-amount').value || 0,
            probability:    document.getElementById('deal-probability').value || 50,
            expected_close: document.getElementById('deal-close').value,
            source:         document.getElementById('deal-source').value,
            assigned_to:    document.getElementById('deal-assigned').value,
            notes:          document.getElementById('deal-notes').value,
        };
        const method = id ? 'PUT' : 'POST';
        const url    = id ? `/api/pipeline/${id}` : '/api/pipeline';
        try {
            const r = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if (r.ok) { this.closeModal(); this.loadPipeline(); }
            else { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); }
        } catch (e) { console.error('Error guardando deal:', e); }
    },

    async deleteDeal(id) {
        if (!confirm('¿Eliminar esta oportunidad?')) return;
        try {
            await fetch(`/api/pipeline/${id}`, { method: 'DELETE' });
            this.loadPipeline();
        } catch (e) { console.error('Error eliminando deal:', e); }
    },

    dealToIngreso(d) {
        this.openFinanzaModal('ingreso', {
            description: d.title,
            amount:      d.amount,
            client:      d.contact_name,
            category:    'Servicios',
            date:        this.todayStr()
        });
    },

    // ── Reuniones ─────────────────────────────────────────────────
    async loadReuniones() {
        try {
            const r = await fetch('/api/reuniones');
            if (!r.ok) return;
            this.reuniones = await r.json();
            this.renderReuniones();
            if (document.getElementById('reun-calendario')?.style.display !== 'none') this.renderReunCal();
        } catch (e) { console.error('Error cargando reuniones:', e); }
    },

    renderReuniones() {
        const search  = (document.getElementById('reun-search')?.value || '').toLowerCase().trim();
        const type    = document.getElementById('reun-filter-type')?.value   || 'all';
        const status  = document.getElementById('reun-filter-status')?.value || 'all';
        const from    = document.getElementById('reun-filter-from')?.value   || '';
        const to      = document.getElementById('reun-filter-to')?.value     || '';

        const filtered = this.reuniones.filter(r => {
            if (type   !== 'all' && r.type   !== type)   return false;
            if (status !== 'all' && r.status !== status) return false;
            if (from && r.date < from) return false;
            if (to   && r.date > to)   return false;
            if (search && !r.title.toLowerCase().includes(search) && !r.client_name.toLowerCase().includes(search)) return false;
            return true;
        });

        // Stats (sobre todas)
        document.getElementById('reun-stat-total').textContent      = this.reuniones.length;
        document.getElementById('reun-stat-programadas').textContent = this.reuniones.filter(r => r.status === 'programada').length;
        document.getElementById('reun-stat-realizadas').textContent  = this.reuniones.filter(r => r.status === 'realizada').length;

        const container = document.getElementById('reun-lista');
        if (!container) return;
        if (filtered.length === 0) {
            container.innerHTML = '<div class="reun-empty"><i class="fas fa-handshake" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>No hay reuniones con estos filtros.</div>';
            return;
        }

        const durLabel = { 15:'15 min', 30:'30 min', 45:'45 min', 60:'1h', 90:'1h 30min', 120:'2h', 180:'3h' };
        const statusLabels = { programada:'Programada', realizada:'Realizada', cancelada:'Cancelada' };

        container.innerHTML = filtered.map(r => {
            const infoHtml = r.type === 'virtual'
                ? (r.link ? `<div class="reun-card-info"><i class="fas fa-video" style="color:var(--progress-color);flex-shrink:0;"></i><a href="${r.link}" target="_blank">${r.link}</a></div>` : '')
                : (r.location ? `<div class="reun-card-info"><i class="fas fa-map-marker-alt" style="color:var(--completed-color);flex-shrink:0;"></i><span>${r.location}</span></div>` : '');

            const topicsHtml = r.topics ? `<div class="reun-card-topics">${r.topics}</div>` : '';
            const notesHtml  = r.notes  ? `<p style="font-size:0.78rem;color:var(--text-muted);font-style:italic;"><i class="fas fa-sticky-note"></i> ${r.notes}</p>` : '';
            const dur = durLabel[r.duration] || `${r.duration} min`;

            let quickBtns = '';
            if (r.status === 'programada') quickBtns = `
                <button class="reun-q-btn realizada"  onclick="app.changeReunStatus(${r.id},'realizada')"><i class="fas fa-check"></i> Realizada</button>
                <button class="reun-q-btn cancelada"  onclick="app.changeReunStatus(${r.id},'cancelada')"><i class="fas fa-times"></i> Cancelar</button>`;
            else if (r.status !== 'programada') quickBtns = `
                <button class="reun-q-btn programada" onclick="app.changeReunStatus(${r.id},'programada')"><i class="fas fa-redo"></i> Reprogramar</button>`;

            return `
                <div class="reun-card type-${r.type} status-${r.status}">
                    <div class="reun-card-header">
                        <div>
                            <div class="reun-card-title">${r.title}</div>
                            <div class="reun-card-client"><i class="fas fa-user-tie"></i>${r.client_name}</div>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem;">
                            <span class="reun-type-badge badge-${r.type}">${r.type === 'virtual' ? '⬡ Virtual' : '⬡ Presencial'}</span>
                            <span class="reun-status-badge rbadge-${r.status}">${statusLabels[r.status]}</span>
                        </div>
                    </div>
                    <div class="reun-card-datetime">
                        <span><i class="fas fa-calendar-day"></i> ${r.date}</span>
                        <span><i class="fas fa-clock"></i> ${r.time}</span>
                        <span style="color:var(--text-muted);font-size:0.8rem;">${dur}</span>
                    </div>
                    ${infoHtml}
                    ${topicsHtml}
                    ${notesHtml}
                    <div class="reun-card-footer">
                        <div class="reun-quick-btns">${quickBtns}</div>
                        <div style="display:flex;gap:0.4rem;">
                            <button class="btn btn-icon" onclick="app.openReunionModal(${this.safeJson(r)})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-icon" style="color:var(--priority-high);" onclick="app.deleteReunion(${r.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    renderReunCal() {
        const year  = this.reunCalDate.getFullYear();
        const month = this.reunCalDate.getMonth();
        const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        document.getElementById('reun-month-label').textContent = `${MONTHS[month]} ${year}`;

        const grid = document.getElementById('reun-cal-days');
        if (!grid) return;
        grid.innerHTML = '';

        const firstDay   = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const el = document.createElement('div');
            el.className = 'calendar-day empty';
            grid.appendChild(el);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const dayDiv  = document.createElement('div');
            dayDiv.className = 'calendar-day';
            if (dateStr === this.todayStr()) dayDiv.classList.add('today');
            dayDiv.innerHTML = `<span class="day-number">${i}</span>`;

            const dayReuns = this.reuniones.filter(r => r.date === dateStr);
            if (dayReuns.length > 0) {
                const chipsWrap = document.createElement('div');
                chipsWrap.className = 'day-tasks';
                dayReuns.slice(0, 3).forEach(r => {
                    const chip = document.createElement('div');
                    chip.className = `reun-chip ${r.status === 'cancelada' ? 'cancelada' : r.type}`;
                    chip.textContent = `${r.time} ${r.title}`;
                    chip.title = `${r.title} — ${r.client_name}`;
                    chipsWrap.appendChild(chip);
                });
                if (dayReuns.length > 3) {
                    const more = document.createElement('div');
                    more.className = 'reun-chip';
                    more.style.color = 'var(--text-muted)';
                    more.textContent = `+${dayReuns.length - 3} más`;
                    chipsWrap.appendChild(more);
                }
                dayDiv.appendChild(chipsWrap);
                dayDiv.style.cursor = 'pointer';
                dayDiv.addEventListener('click', () => this.showReunCalDetail(dateStr, dayReuns));
            }
            grid.appendChild(dayDiv);
        }
        document.getElementById('reun-cal-detail').innerHTML = '';
    },

    showReunCalDetail(dateStr, reuns) {
        const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
        const durLabel  = { 15:'15 min', 30:'30 min', 45:'45 min', 60:'1h', 90:'1h 30min', 120:'2h', 180:'3h' };
        document.getElementById('reun-cal-detail').innerHTML = `
            <div class="reun-day-detail">
                <h3><i class="fas fa-calendar-day" style="color:#F472B6;margin-right:0.5rem;"></i>${dateLabel}</h3>
                ${reuns.map(r => `
                    <div style="display:flex;align-items:center;gap:0.85rem;padding:0.65rem 0;border-bottom:1px solid var(--border);">
                        <span class="reun-type-badge badge-${r.type}" style="flex-shrink:0;">${r.type}</span>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:600;font-size:0.9rem;color:var(--text);">${r.time} — ${r.title}</div>
                            <div style="font-size:0.8rem;color:var(--gold-light);">${r.client_name}</div>
                            ${r.link     ? `<a href="${r.link}" target="_blank" style="font-size:0.78rem;color:var(--progress-color);">${r.link}</a>` : ''}
                            ${r.location ? `<div style="font-size:0.78rem;color:var(--text-muted);"><i class="fas fa-map-marker-alt"></i> ${r.location}</div>` : ''}
                        </div>
                        <span class="reun-status-badge rbadge-${r.status}" style="flex-shrink:0;">${r.status}</span>
                        <button class="btn btn-icon" style="flex-shrink:0;" onclick="app.openReunionModal(${this.safeJson(r)})"><i class="fas fa-edit"></i></button>
                    </div>`).join('')}
            </div>`;
    },

    toggleReunTypeFields(type) {
        document.getElementById('reun-link-group').style.display     = type === 'virtual'    ? 'block' : 'none';
        document.getElementById('reun-location-group').style.display = type === 'presencial' ? 'block' : 'none';
    },

    openReunionModal(r = null) {
        document.getElementById('reunion-modal').classList.add('active');
        document.getElementById('reunion-modal-title').textContent = r ? 'Editar Reunión' : 'Nueva Reunión';
        document.getElementById('reun-id').value = r ? r.id : '';

        const type = r ? r.type : 'virtual';
        document.querySelectorAll('.reun-type-btn').forEach(b => b.classList.toggle('active', b.dataset.rtype === type));
        this.toggleReunTypeFields(type);

        // Datalist clientes
        const dl = document.getElementById('reun-client-list');
        if (dl && this.clients) dl.innerHTML = this.clients.map(c => `<option value="${c.name}">`).join('');

        if (r) {
            document.getElementById('reun-title').value        = r.title;
            document.getElementById('reun-client').value       = r.client_name;
            document.getElementById('reun-date').value         = r.date;
            document.getElementById('reun-time').value         = r.time;
            document.getElementById('reun-duration').value     = r.duration;
            document.getElementById('reun-link').value         = r.link     || '';
            document.getElementById('reun-location').value     = r.location || '';
            document.getElementById('reun-topics').value       = r.topics   || '';
            document.getElementById('reun-notes').value        = r.notes    || '';
            document.getElementById('reun-status-field').value = r.status;
        } else {
            document.getElementById('reunion-form').reset();
            document.getElementById('reun-id').value   = '';
            document.getElementById('reun-date').value = this.todayStr();
            document.querySelectorAll('.reun-type-btn').forEach(b => b.classList.toggle('active', b.dataset.rtype === 'virtual'));
            this.toggleReunTypeFields('virtual');
        }
    },

    async handleReunionSubmit() {
        const id   = document.getElementById('reun-id').value;
        const type = document.querySelector('.reun-type-btn.active')?.dataset.rtype || 'virtual';
        const data = {
            title:       document.getElementById('reun-title').value,
            client_name: document.getElementById('reun-client').value,
            type,
            link:        type === 'virtual'    ? document.getElementById('reun-link').value     : null,
            location:    type === 'presencial' ? document.getElementById('reun-location').value : null,
            date:        document.getElementById('reun-date').value,
            time:        document.getElementById('reun-time').value,
            duration:    document.getElementById('reun-duration').value,
            topics:      document.getElementById('reun-topics').value,
            status:      document.getElementById('reun-status-field').value,
            notes:       document.getElementById('reun-notes').value,
        };
        const method = id ? 'PUT' : 'POST';
        const url    = id ? `/api/reuniones/${id}` : '/api/reuniones';
        try {
            const r = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if (r.ok) { this.closeModal(); this.loadReuniones(); }
            else { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); }
        } catch (e) { console.error('Error guardando reunión:', e); }
    },

    async changeReunStatus(id, status) {
        try {
            const r = await fetch(`/api/reuniones/${id}/status`, {
                method: 'PATCH',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ status })
            });
            if (r.ok) this.loadReuniones();
        } catch (e) { console.error('Error cambiando estado:', e); }
    },

    async deleteReunion(id) {
        if (!confirm('¿Eliminar esta reunión?')) return;
        try {
            await fetch(`/api/reuniones/${id}`, { method: 'DELETE' });
            this.loadReuniones();
        } catch (e) { console.error('Error eliminando reunión:', e); }
    },

    // ── Base de Conocimiento ─────────────────────────────────────
    async loadKb() {
        try {
            const r = await fetch('/api/kb');
            if (!r.ok) return;
            this.kbArticles = await r.json();
            this.renderKb();
        } catch (e) {
            console.error('Error cargando KB:', e);
        }
    },

    renderKb() {
        const search  = (document.getElementById('kb-search')?.value || '').toLowerCase().trim();
        const activeCat = document.querySelector('.kb-cat-item.active')?.dataset.cat || 'all';

        // Construir conteos por categoría
        const catCounts = {};
        this.kbArticles.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });

        // Renderizar sidebar de categorías
        const catList = document.getElementById('kb-cat-list');
        if (catList) {
            const cats = Object.keys(catCounts).sort();
            catList.innerHTML = `
                <button class="kb-cat-item${activeCat === 'all' ? ' active' : ''}" data-cat="all">
                    <i class="fas fa-border-all"></i> Todos
                    <span class="kb-cat-count">${this.kbArticles.length}</span>
                </button>
                ${cats.map(c => `
                    <button class="kb-cat-item${activeCat === c ? ' active' : ''}" data-cat="${c}">
                        <i class="${this.kbCatIcon(c)}"></i> ${c}
                        <span class="kb-cat-count">${catCounts[c]}</span>
                    </button>`).join('')}`;
            catList.querySelectorAll('.kb-cat-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    catList.querySelectorAll('.kb-cat-item').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.renderKb();
                });
            });
        }

        // Filtrar artículos
        const filtered = this.kbArticles.filter(a => {
            if (activeCat !== 'all' && a.category !== activeCat) return false;
            if (search && !a.title.toLowerCase().includes(search) && !a.content.toLowerCase().includes(search)) return false;
            return true;
        });

        const container = document.getElementById('kb-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="kb-empty"><i class="fas fa-book-open" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>${search ? 'Sin resultados para tu búsqueda.' : 'No hay artículos en esta categoría.'}</div>`;
            return;
        }

        const isAdmin = document.body.classList.contains('is-admin');
        container.innerHTML = filtered.map(a => {
            const excerpt = a.content.replace(/[#*`]/g, '').substring(0, 150).trim() + (a.content.length > 150 ? '...' : '');
            const date    = new Date(a.updated_at).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' });
            const pdfBadge = a.pdf_url ? `<a href="${a.pdf_url}" target="_blank" class="pres-pdf-btn" onclick="event.stopPropagation()"><i class="fas fa-file-pdf"></i> PDF</a>` : '';
            const adminBtns = isAdmin ? `
                <div class="kb-card-admin-btns">
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;" title="Editar" onclick="event.stopPropagation();app.openKbModal(${this.safeJson(a)})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;color:var(--priority-high);" title="Eliminar" onclick="event.stopPropagation();app.deleteKbArticle(${a.id})"><i class="fas fa-trash"></i></button>
                </div>` : '';
            return `
                <div class="kb-card" onclick="app.openKbDetail(${a.id})">
                    <div class="kb-card-header">
                        <span class="kb-cat-badge">${a.category}</span>
                        ${pdfBadge}
                    </div>
                    <div class="kb-card-title">${a.title}</div>
                    <div class="kb-card-excerpt">${excerpt}</div>
                    <div class="kb-card-footer">
                        <span class="kb-author"><i class="far fa-user"></i>${a.author || 'Sistema'}</span>
                        <div style="display:flex;align-items:center;gap:0.6rem;">
                            <span><i class="far fa-clock"></i>${date}</span>
                            ${adminBtns}
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    kbCatIcon(cat) {
        const icons = { 'Procesos':'fas fa-sitemap', 'FAQ':'fas fa-question-circle', 'Guías':'fas fa-map-signs', 'Plantillas':'fas fa-file-alt', 'Recursos':'fas fa-link', 'General':'fas fa-folder' };
        return icons[cat] || 'fas fa-tag';
    },

    kbParseContent(raw) {
        if (!raw) return '';
        return raw
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
            .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h2>$3</h2>'.replace('$3','$1'))
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g,     '<code>$1</code>')
            .replace(/^---$/gm,      '<hr>')
            .replace(/^[-•] (.+)$/gm,'<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .split('\n').map(line => {
                if (/^<(h[123]|hr|ul|li)/.test(line.trim())) return line;
                if (line.trim() === '') return '';
                return `<p>${line}</p>`;
            }).join('\n');
    },

    openKbDetail(id) {
        const a = this.kbArticles.find(x => x.id === id);
        if (!a) return;
        this.kbCurrentArticle = a;
        document.getElementById('kb-detail-title').textContent = a.title;
        const date = new Date(a.updated_at).toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' });
        document.getElementById('kb-detail-meta').innerHTML = `
            <span><i class="fas fa-tag" style="color:#22D3EE;"></i> ${a.category}</span>
            <span><i class="far fa-user"></i> ${a.author || 'Sistema'}</span>
            <span><i class="far fa-clock"></i> ${date}</span>
            ${a.pdf_url ? `<a href="${a.pdf_url}" target="_blank" class="pres-pdf-btn"><i class="fas fa-file-pdf"></i> Ver PDF adjunto</a>` : ''}`;
        document.getElementById('kb-detail-body').innerHTML = this.kbParseContent(a.content);
        document.getElementById('kb-detail-modal').classList.add('active');
    },

    openKbModal(a = null) {
        document.getElementById('kb-modal').classList.add('active');
        document.getElementById('kb-modal-title').textContent = a ? 'Editar Artículo' : 'Nuevo Artículo';
        document.getElementById('kb-id').value       = a ? a.id : '';
        document.getElementById('kb-title').value    = a ? a.title : '';
        document.getElementById('kb-category').value = a ? a.category : '';
        document.getElementById('kb-content').value  = a ? a.content : '';
        document.getElementById('kb-pdf-file').value = '';
        this.showKbPdfState(a?.pdf_url || null);
        if (!a) document.getElementById('kb-form').reset();
    },

    showKbPdfState(pdfUrl) {
        const current     = document.getElementById('kb-pdf-current');
        const placeholder = document.getElementById('kb-pdf-placeholder');
        const viewBtn     = document.getElementById('kb-pdf-view');
        const nameEl      = document.getElementById('kb-pdf-name');
        if (pdfUrl) {
            nameEl.textContent      = decodeURIComponent(pdfUrl.split('/').pop());
            viewBtn.href            = pdfUrl;
            viewBtn.style.display   = '';
            current.style.display   = 'flex';
            placeholder.style.display = 'none';
        } else {
            current.style.display   = 'none';
            placeholder.style.display = '';
        }
    },

    async handleKbSubmit() {
        const id   = document.getElementById('kb-id').value;
        const data = {
            title:    document.getElementById('kb-title').value,
            content:  document.getElementById('kb-content').value,
            category: document.getElementById('kb-category').value || 'General',
        };
        const method = id ? 'PUT' : 'POST';
        const url    = id ? `/api/kb/${id}` : '/api/kb';
        try {
            const r = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if (!r.ok) { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); return; }
            const result  = await r.json();
            const kbId    = id || result.id;
            const pdfFile = document.getElementById('kb-pdf-file')?.files[0];
            if (pdfFile) {
                const form = new FormData();
                form.append('pdf', pdfFile);
                await fetch(`/api/kb/${kbId}/pdf`, { method: 'POST', body: form });
            }
            this.closeModal();
            this.loadKb();
        } catch (e) { console.error('Error guardando artículo:', e); }
    },

    async removeKbPdf() {
        const id      = document.getElementById('kb-id').value;
        const pdfFile = document.getElementById('kb-pdf-file');
        if (pdfFile.files[0]) { pdfFile.value = ''; this.showKbPdfState(null); return; }
        if (!id) { this.showKbPdfState(null); return; }
        try {
            await fetch(`/api/kb/${id}/pdf`, { method: 'DELETE' });
            this.showKbPdfState(null);
        } catch (e) { console.error('Error eliminando PDF de KB:', e); }
    },

    async deleteKbArticle(id) {
        if (!confirm('¿Eliminar este artículo?')) return;
        try {
            await fetch(`/api/kb/${id}`, { method: 'DELETE' });
            this.closeModal();
            this.loadKb();
        } catch (e) {
            console.error('Error eliminando artículo:', e);
        }
    },

    // ── Presupuestos ─────────────────────────────────────────────
    async loadPresupuestos() {
        try {
            const r = await fetch('/api/presupuestos');
            if (!r.ok) return;
            this.presupuestos = await r.json();
            this.renderPresupuestos();
        } catch (e) {
            console.error('Error cargando presupuestos:', e);
        }
    },

    renderPresupuestos() {
        const search    = (document.getElementById('pres-search')?.value || '').toLowerCase().trim();
        const statusF   = document.getElementById('pres-filter-status')?.value || 'all';
        const sort      = document.getElementById('pres-sort')?.value || 'date_desc';
        const from      = document.getElementById('pres-from')?.value || '';
        const to        = document.getElementById('pres-to')?.value || '';
        const amountMin = parseFloat(document.getElementById('pres-amount-min')?.value) || 0;
        const amountMax = parseFloat(document.getElementById('pres-amount-max')?.value) || Infinity;

        let filtered = this.presupuestos.filter(p => {
            if (statusF !== 'all' && p.status !== statusF) return false;
            if (search && !p.title.toLowerCase().includes(search) && !p.client_name.toLowerCase().includes(search)) return false;
            if (from && p.date < from) return false;
            if (to   && p.date > to)   return false;
            if (Number(p.amount) < amountMin) return false;
            if (Number(p.amount) > amountMax) return false;
            return true;
        });

        const sortFns = {
            date_desc:   (a, b) => b.date.localeCompare(a.date),
            date_asc:    (a, b) => a.date.localeCompare(b.date),
            amount_desc: (a, b) => Number(b.amount) - Number(a.amount),
            amount_asc:  (a, b) => Number(a.amount) - Number(b.amount),
            client_asc:  (a, b) => a.client_name.localeCompare(b.client_name),
        };
        filtered = filtered.sort(sortFns[sort] || sortFns.date_desc);

        // Stats (sobre todos, sin filtro)
        const all = this.presupuestos;
        document.getElementById('pres-stat-total').textContent     = all.length;
        document.getElementById('pres-stat-enviados').textContent   = all.filter(p => p.status === 'enviado').length;
        document.getElementById('pres-stat-aceptados').textContent  = all.filter(p => p.status === 'aceptado').length;
        const montoAceptado = all.filter(p => p.status === 'aceptado').reduce((s, p) => s + Number(p.amount), 0);
        document.getElementById('pres-stat-monto').textContent = this.formatMonto(montoAceptado);

        const container = document.getElementById('presupuestos-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<div class="pres-empty"><i class="fas fa-file-invoice-dollar" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>No hay presupuestos que coincidan.</div>';
            return;
        }

        container.innerHTML = filtered.map(p => {
            const statusLabels = { borrador:'Borrador', enviado:'Enviado', aceptado:'Aceptado', rechazado:'Rechazado', vencido:'Vencido' };
            const validUntilHtml = p.valid_until
                ? `<span><i class="far fa-clock"></i> Válido hasta ${p.valid_until}</span>`
                : '';
            const descHtml = p.description ? `<p class="pres-card-desc">${p.description}</p>` : '';
            const notesHtml = p.notes ? `<p style="font-size:0.78rem;color:var(--text-muted);font-style:italic;"><i class="fas fa-sticky-note"></i> ${p.notes}</p>` : '';

            let quickActions = '';
            if (p.status === 'borrador') {
                quickActions = `<button class="pres-action-btn enviar" onclick="app.changePresStatus(${p.id},'enviado')"><i class="fas fa-paper-plane"></i> Marcar Enviado</button>`;
            } else if (p.status === 'enviado') {
                quickActions = `
                    <button class="pres-action-btn aceptar"  onclick="app.changePresStatus(${p.id},'aceptado')"><i class="fas fa-check"></i> Aceptado</button>
                    <button class="pres-action-btn rechazar" onclick="app.changePresStatus(${p.id},'rechazado')"><i class="fas fa-times"></i> Rechazado</button>
                    <button class="pres-action-btn"          onclick="app.changePresStatus(${p.id},'vencido')"><i class="fas fa-hourglass-end"></i> Vencido</button>`;
            } else if (p.status === 'aceptado') {
                quickActions = `<button class="pres-action-btn ingreso" onclick="app.convertirAIngreso(${this.safeJson(p)})"><i class="fas fa-arrow-trend-up"></i> Convertir a Ingreso</button>`;
            }

            const pdfHtml = p.pdf_url
                ? `<a href="${p.pdf_url}" target="_blank" class="pres-pdf-btn"><i class="fas fa-file-pdf"></i> Ver PDF</a>`
                : '';
            const safeP = this.safeJson(p);
            return `
                <div class="pres-card status-${p.status}">
                    <div class="pres-card-header">
                        <div>
                            <div class="pres-card-title">${p.title}</div>
                            <div class="pres-card-client"><i class="fas fa-user-tie"></i>${p.client_name}</div>
                        </div>
                        <span class="pres-status-badge badge-${p.status}">${statusLabels[p.status]}</span>
                    </div>
                    <div class="pres-card-amount status-${p.status}">${this.formatMonto(p.amount)}</div>
                    ${descHtml}
                    ${notesHtml}
                    <div class="pres-card-dates">
                        <span><i class="far fa-calendar"></i> ${p.date}</span>
                        ${validUntilHtml}
                    </div>
                    <div class="pres-card-actions">
                        ${quickActions}
                        ${pdfHtml}
                        <div style="margin-left:auto;display:flex;gap:0.4rem;">
                            <button class="btn btn-icon" onclick="app.openPresupuestoModal(JSON.parse(this.dataset.p))" data-p="${safeP}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-icon" style="color:var(--priority-high);" onclick="app.deletePresupuesto(${p.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    openPresupuestoModal(p = null) {
        document.getElementById('presupuesto-modal').classList.add('active');
        document.getElementById('pres-modal-title').textContent = p ? 'Editar Presupuesto' : 'Nuevo Presupuesto';
        document.getElementById('pres-id').value = p ? p.id : '';

        // Poblar datalist de clientes
        const dl = document.getElementById('pres-client-list');
        if (dl && this.clients) {
            dl.innerHTML = this.clients.map(c => `<option value="${c.name}">`).join('');
        }

        // Resetear UI del PDF
        document.getElementById('pres-pdf-file').value = '';
        this.showPresPdfState(p?.pdf_url || null);

        if (p) {
            document.getElementById('pres-title').value       = p.title;
            document.getElementById('pres-client').value      = p.client_name;
            document.getElementById('pres-amount').value      = p.amount;
            document.getElementById('pres-description').value = p.description || '';
            document.getElementById('pres-date').value        = p.date;
            document.getElementById('pres-valid-until').value = p.valid_until || '';
            document.getElementById('pres-status').value      = p.status;
            document.getElementById('pres-notes').value       = p.notes || '';
        } else {
            document.getElementById('presupuesto-form').reset();
            document.getElementById('pres-id').value   = '';
            document.getElementById('pres-date').value = this.todayStr();
        }
    },

    showPresPdfState(pdfUrl) {
        const current     = document.getElementById('pres-pdf-current');
        const placeholder = document.getElementById('pres-pdf-placeholder');
        const viewBtn     = document.getElementById('pres-pdf-view');
        const nameEl      = document.getElementById('pres-pdf-name');
        if (pdfUrl) {
            nameEl.textContent      = decodeURIComponent(pdfUrl.split('/').pop());
            viewBtn.href            = pdfUrl;
            viewBtn.style.display   = '';
            current.style.display   = 'flex';
            placeholder.style.display = 'none';
        } else {
            current.style.display   = 'none';
            placeholder.style.display = '';
        }
    },

    async handlePresupuestoSubmit() {
        const id = document.getElementById('pres-id').value;
        const data = {
            title:       document.getElementById('pres-title').value,
            client_name: document.getElementById('pres-client').value,
            amount:      document.getElementById('pres-amount').value,
            description: document.getElementById('pres-description').value,
            date:        document.getElementById('pres-date').value,
            valid_until: document.getElementById('pres-valid-until').value,
            status:      document.getElementById('pres-status').value,
            notes:       document.getElementById('pres-notes').value,
        };
        const method = id ? 'PUT' : 'POST';
        const url    = id ? `/api/presupuestos/${id}` : '/api/presupuestos';
        try {
            const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!r.ok) { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); return; }
            const result  = await r.json();
            const presId  = id || result.id;
            const pdfFile = document.getElementById('pres-pdf-file')?.files[0];
            if (pdfFile) await this.uploadPresPdf(presId, pdfFile);
            this.closeModal();
            this.loadPresupuestos();
        } catch (e) {
            console.error('Error guardando presupuesto:', e);
        }
    },

    async uploadPresPdf(id, file) {
        const form = new FormData();
        form.append('pdf', file);
        try {
            const r = await fetch(`/api/presupuestos/${id}/pdf`, { method: 'POST', body: form });
            if (!r.ok) { const err = await r.json(); alert('Error subiendo PDF: ' + (err.error || 'desconocido')); }
        } catch (e) {
            console.error('Error subiendo PDF:', e);
        }
    },

    async removePresPdf() {
        const id      = document.getElementById('pres-id').value;
        const pdfFile = document.getElementById('pres-pdf-file');
        // Si solo fue seleccionado pero no guardado aun, solo limpiar la UI
        if (pdfFile.files[0]) {
            pdfFile.value = '';
            this.showPresPdfState(null);
            return;
        }
        // Si es un PDF ya guardado, eliminarlo del servidor
        if (!id) { this.showPresPdfState(null); return; }
        try {
            await fetch(`/api/presupuestos/${id}/pdf`, { method: 'DELETE' });
            this.showPresPdfState(null);
            // Actualizar localmente
            const pres = this.presupuestos.find(p => p.id == id);
            if (pres) pres.pdf_url = null;
        } catch (e) {
            console.error('Error eliminando PDF:', e);
        }
    },

    async changePresStatus(id, status) {
        try {
            const r = await fetch(`/api/presupuestos/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (r.ok) this.loadPresupuestos();
        } catch (e) {
            console.error('Error cambiando estado:', e);
        }
    },

    async deletePresupuesto(id) {
        if (!confirm('¿Eliminar este presupuesto?')) return;
        try {
            await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' });
            this.loadPresupuestos();
        } catch (e) {
            console.error('Error eliminando presupuesto:', e);
        }
    },

    convertirAIngreso(p) {
        if (!confirm(`¿Convertir "${p.title}" a ingreso por ${this.formatMonto(p.amount)}?`)) return;
        this.openFinanzaModal('ingreso', {
            description: p.title,
            amount:      p.amount,
            client:      p.client_name,
            category:    'Servicios',
            date:        this.todayStr()
        });
    },

    // ── Manual de Uso ─────────────────────────────────────────────
    initManual() {
        const links = document.querySelectorAll('.manual-index-item');
        const sections = document.querySelectorAll('.manual-section');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        // Resaltar sección al hacer scroll
        const content = document.querySelector('.manual-content');
        if (content) {
            content.addEventListener('scroll', () => {
                let current = '';
                sections.forEach(s => { if (s.offsetTop <= content.scrollTop + 80) current = s.id; });
                links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
            });
        }
    },

    // ── Gráficas de Finanzas ─────────────────────────────────────
    getLast12Months() {
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
                label: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
            });
        }
        return months;
    },

    destroyFinCharts() {
        Object.values(this.finCharts).forEach(c => c && c.destroy());
        this.finCharts = {};
    },

    renderFinCharts() {
        if (!window.Chart) return;
        this.destroyFinCharts();

        const PALETTE = ['#D4A843','#34D399','#60A5FA','#F87171','#A78BFA','#FB923C','#FBBF24','#22D3EE','#4ADE80','#F472B6','#818CF8','#FCA5A5'];
        const gridColor  = 'rgba(255,255,255,0.06)';
        const tickColor  = '#6B7280';
        const fontFamily = 'Inter, sans-serif';
        const tooltipMonto = (ctx) => ` ${ctx.label}: $${Number(ctx.raw).toLocaleString('es-AR', {minimumFractionDigits:2})}`;

        const periodo   = document.getElementById('fin-filter-periodo')?.value || 'mes';
        const ingFilt   = this.finanzasPeriodoFiltrar(this.ingresos, periodo);
        const gasFilt   = this.finanzasPeriodoFiltrar(this.gastos,   periodo);
        const months    = this.getLast12Months();

        // Agrupar por mes (siempre últimos 12, independiente del filtro de periodo)
        const ingByMonth = {}, gasByMonth = {};
        months.forEach(m => { ingByMonth[m.key] = 0; gasByMonth[m.key] = 0; });
        this.ingresos.forEach(i => { const k = i.date.substring(0,7); if (k in ingByMonth) ingByMonth[k] += Number(i.amount); });
        this.gastos.forEach(g   => { const k = g.date.substring(0,7); if (k in gasByMonth) gasByMonth[k] += Number(g.amount); });

        // 1. Bar chart — evolución mensual
        const ctxBar = document.getElementById('chart-evolucion');
        if (ctxBar) {
            this.finCharts.bar = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: months.map(m => m.label),
                    datasets: [
                        { label: 'Ingresos', data: months.map(m => ingByMonth[m.key]), backgroundColor: 'rgba(52,211,153,0.65)', borderColor: '#34D399', borderWidth: 1, borderRadius: 4 },
                        { label: 'Gastos',   data: months.map(m => gasByMonth[m.key]), backgroundColor: 'rgba(248,113,113,0.65)', borderColor: '#F87171', borderWidth: 1, borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: tickColor, font: { family: fontFamily, size: 11 } } } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 }, callback: v => '$' + Number(v).toLocaleString('es-AR') } }
                    }
                }
            });
        }

        const buildDoughnut = (canvasId, items, chartKey) => {
            const byCat = {};
            items.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + Number(x.amount); });
            const keys = Object.keys(byCat);
            const ctx  = document.getElementById(canvasId);
            if (!ctx) return;
            this.finCharts[chartKey] = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: keys, datasets: [{ data: keys.map(k => byCat[k]), backgroundColor: PALETTE, borderColor: '#1F2937', borderWidth: 2 }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: tickColor, font: { family: fontFamily, size: 11 }, padding: 10, boxWidth: 12 } },
                        tooltip: { callbacks: { label: tooltipMonto } }
                    }
                }
            });
        };
        buildDoughnut('chart-gastos-cat',   gasFilt, 'gastos');
        buildDoughnut('chart-ingresos-cat', ingFilt, 'ingresos');

        // 4. Line chart — balance acumulado
        const ctxLine = document.getElementById('chart-balance');
        if (ctxLine) {
            let acumulado = 0;
            const balanceData = months.map(m => {
                acumulado += (ingByMonth[m.key] || 0) - (gasByMonth[m.key] || 0);
                return acumulado;
            });
            this.finCharts.balance = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: months.map(m => m.label),
                    datasets: [{
                        label: 'Balance acumulado',
                        data: balanceData,
                        borderColor: '#60A5FA',
                        backgroundColor: 'rgba(96,165,250,0.10)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: '#60A5FA',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 }, callback: v => '$' + Number(v).toLocaleString('es-AR') } }
                    }
                }
            });
        }
    },

    // ── Finanzas ─────────────────────────────────────────────────
    async loadFinanzas() {
        try {
            const [resI, resG, resC] = await Promise.all([
                fetch('/api/finanzas/ingresos'),
                fetch('/api/finanzas/gastos'),
                fetch('/api/finanzas/categorias')
            ]);
            if (!resI.ok || !resG.ok) return;
            this.ingresos      = await resI.json();
            this.gastos        = await resG.json();
            this.finCategories = resC.ok ? await resC.json() : [];
            this.updateSearchCatOptions(this.activeFinTab());
            this.renderFinanzas();
        } catch (error) {
            console.error('Error cargando finanzas:', error);
        }
    },

    activeFinTab() {
        return document.querySelector('.fin-tab:not([data-cattab]).active')?.dataset.tab || 'ingresos';
    },

    updateSearchCatOptions(tab) {
        const tipo = tab === 'ingresos' ? 'ingreso' : 'gasto';
        const cats = this.finCategories.filter(c => c.tipo === tipo);
        const sel  = document.getElementById('fin-search-cat');
        if (!sel) return;
        sel.innerHTML = '<option value="">Todas las categorías</option>' +
            cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    },

    finanzasPeriodoFiltrar(items, periodo) {
        const now = new Date();
        return items.filter(item => {
            if (periodo === 'todo') return true;
            const [y, m] = item.date.split('-').map(Number);
            if (periodo === 'mes')  return y === now.getFullYear() && m === now.getMonth() + 1;
            if (periodo === 'anio') return y === now.getFullYear();
            return true;
        });
    },

    formatMonto(n) {
        return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    renderFinanzas() {
        const periodo = document.getElementById('fin-filter-periodo')?.value || 'mes';
        const ingPeriodo = this.finanzasPeriodoFiltrar(this.ingresos, periodo);
        const gasPeriodo = this.finanzasPeriodoFiltrar(this.gastos,   periodo);

        // Stats reflect period only
        const totalIng = ingPeriodo.reduce((s, i) => s + Number(i.amount), 0);
        const totalGas = gasPeriodo.reduce((s, i) => s + Number(i.amount), 0);
        const balance  = totalIng - totalGas;
        document.getElementById('fin-total-ingresos').textContent = this.formatMonto(totalIng);
        document.getElementById('fin-total-gastos').textContent   = this.formatMonto(totalGas);
        document.getElementById('fin-balance').textContent        = this.formatMonto(balance);

        const balanceIcon = document.getElementById('fin-balance-icon');
        if (balanceIcon) balanceIcon.className = 'stat-icon balance' + (balance < 0 ? ' negative' : '');

        // Update client search selector
        const clientSel = document.getElementById('fin-search-client');
        if (clientSel) {
            const usedClients = [...new Set(ingPeriodo.map(i => i.client).filter(Boolean))].sort();
            const prev = clientSel.value;
            clientSel.innerHTML = '<option value="">Todos los clientes</option>' +
                usedClients.map(c => `<option value="${c}">${c}</option>`).join('');
            if (prev) clientSel.value = prev;
        }

        // Render lists with search applied
        this.applyFinSearch(ingPeriodo, gasPeriodo);

        // Actualizar gráficas si están visibles
        if (document.getElementById('fin-charts-panel')?.style.display !== 'none') {
            this.renderFinCharts();
        }
    },

    applyFinSearch(ingBase, gasBase) {
        const periodo = document.getElementById('fin-filter-periodo')?.value || 'mes';
        ingBase = ingBase || this.finanzasPeriodoFiltrar(this.ingresos, periodo);
        gasBase = gasBase || this.finanzasPeriodoFiltrar(this.gastos,   periodo);

        const text   = (document.getElementById('fin-search-text')?.value || '').toLowerCase().trim();
        const cat    = document.getElementById('fin-search-cat')?.value || '';
        const client = document.getElementById('fin-search-client')?.value || '';
        const from   = document.getElementById('fin-search-from')?.value || '';
        const to     = document.getElementById('fin-search-to')?.value || '';

        const applyFilters = (items, includeClient) => items.filter(item => {
            if (text   && !item.description.toLowerCase().includes(text)) return false;
            if (cat    && item.category !== cat) return false;
            if (from   && item.date < from) return false;
            if (to     && item.date > to)   return false;
            if (includeClient && client && item.client !== client) return false;
            return true;
        });

        this.renderFinanzaList('fin-ingresos-list', applyFilters(ingBase, true),  'ingreso');
        this.renderFinanzaList('fin-gastos-list',   applyFilters(gasBase, false), 'gasto');
    },

    clearFinSearch() {
        ['fin-search-text','fin-search-cat','fin-search-client','fin-search-from','fin-search-to']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        this.applyFinSearch();
    },

    renderFinanzaList(containerId, items, tipo) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (items.length === 0) {
            container.innerHTML = `<div class="fin-empty"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.4;"></i>No hay ${tipo === 'ingreso' ? 'ingresos' : 'gastos'} en este periodo.</div>`;
            return;
        }
        container.innerHTML = items.map(item => `
            <div class="fin-item">
                <div class="fin-item-icon ${tipo}">
                    <i class="fas fa-arrow-${tipo === 'ingreso' ? 'up' : 'down'}"></i>
                </div>
                <div class="fin-item-info">
                    <div class="fin-item-desc">${item.description}</div>
                    <div class="fin-item-meta">
                        <span><i class="far fa-calendar"></i> ${item.date}</span>
                        <span class="fin-cat-badge">${item.category}</span>
                        ${item.client ? `<span style="color:var(--gold-light);"><i class="fas fa-user-tie"></i> ${item.client}</span>` : ''}
                    </div>
                </div>
                <div class="fin-item-amount ${tipo}">${this.formatMonto(item.amount)}</div>
                <div class="fin-item-actions">
                    <button class="btn btn-icon" onclick="app.openFinanzaModal('${tipo}', ${this.safeJson(item)})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="color:var(--priority-high);" onclick="app.deleteFinanza('${tipo}', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    },

    openFinanzaModal(tipo = 'ingreso', item = null) {
        this.finanzaModal.classList.add('active');
        document.getElementById('finanza-modal-title').textContent = item ? 'Editar Movimiento' : 'Nuevo Movimiento';
        document.getElementById('finanza-id').value = item ? item.id : '';

        const typeBtns    = document.querySelectorAll('.fin-type-btn');
        typeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === tipo);
            btn.onclick = () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateFinanzaCategoryOptions(btn.dataset.type);
                document.getElementById('fin-client-group').style.display = btn.dataset.type === 'ingreso' ? 'block' : 'none';
            };
        });

        // Actualizar categorías
        this.updateFinanzaCategoryOptions(tipo);
        document.getElementById('fin-client-group').style.display = tipo === 'ingreso' ? 'block' : 'none';

        // Poblar selector de clientes
        const clientSelect = document.getElementById('fin-client');
        const clientOptions = this.clients ? this.clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('') : '';
        clientSelect.innerHTML = '<option value="">Sin cliente</option>' + clientOptions;

        if (item) {
            document.getElementById('fin-description').value = item.description;
            document.getElementById('fin-amount').value      = item.amount;
            document.getElementById('fin-date').value        = item.date;
            document.getElementById('fin-category').value    = item.category;
            if (item.client) document.getElementById('fin-client').value = item.client;
        } else {
            this.finanzaForm.reset();
            document.getElementById('finanza-id').value = '';
            document.getElementById('fin-date').value   = this.todayStr();
            // Restore type buttons after reset
            typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === tipo));
            this.updateFinanzaCategoryOptions(tipo);
        }
    },

    updateFinanzaCategoryOptions(tipo) {
        const cats = this.finCategories.filter(c => c.tipo === tipo).map(c => c.name);
        const fallback = tipo === 'ingreso'
            ? ['Servicios','Productos','Suscripción','Honorarios','Otro']
            : ['Marketing','Infraestructura','Personal','Herramientas','Suscripciones','Impuestos','Otro'];
        const list = cats.length ? cats : fallback;
        document.getElementById('fin-category').innerHTML = list.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    async handleFinanzaSubmit() {
        const id   = document.getElementById('finanza-id').value;
        const tipo = document.querySelector('.fin-type-btn.active')?.dataset.type || 'ingreso';
        const data = {
            description: document.getElementById('fin-description').value,
            amount:      document.getElementById('fin-amount').value,
            date:        document.getElementById('fin-date').value,
            category:    document.getElementById('fin-category').value,
        };
        if (tipo === 'ingreso') data.client = document.getElementById('fin-client').value;

        const endpoint = tipo === 'ingreso' ? 'ingresos' : 'gastos';
        const method   = id ? 'PUT' : 'POST';
        const url      = id ? `/api/finanzas/${endpoint}/${id}` : `/api/finanzas/${endpoint}`;
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                this.closeModal();
                this.loadFinanzas();
            } else {
                const err = await response.json();
                alert('Error: ' + (err.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error guardando movimiento:', error);
        }
    },

    async deleteFinanza(tipo, id) {
        if (!confirm(`¿Eliminar este ${tipo}?`)) return;
        const endpoint = tipo === 'ingreso' ? 'ingresos' : 'gastos';
        try {
            await fetch(`/api/finanzas/${endpoint}/${id}`, { method: 'DELETE' });
            this.loadFinanzas();
        } catch (error) {
            console.error('Error eliminando movimiento:', error);
        }
    },

    openCatModal() {
        document.getElementById('cat-modal').classList.add('active');
        document.getElementById('cat-new-name').value = '';
        // Reset tabs to ingreso
        document.querySelectorAll('[data-cattab]').forEach(b => b.classList.toggle('active', b.dataset.cattab === 'ingreso'));
        document.getElementById('cat-list-ingreso').style.display = 'flex';
        document.getElementById('cat-list-gasto').style.display   = 'none';
        this.renderCatLists();
    },

    renderCatLists() {
        ['ingreso','gasto'].forEach(tipo => {
            const cats = this.finCategories.filter(c => c.tipo === tipo);
            const container = document.getElementById(`cat-list-${tipo}`);
            if (!container) return;
            if (cats.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem;">Sin categorías.</p>';
                return;
            }
            container.innerHTML = cats.map(c => `
                <div class="cat-item">
                    <span>${c.name}</span>
                    ${c.is_default ? '<span class="cat-default-badge">default</span>' : ''}
                    ${!c.is_default ? `<button class="btn btn-icon" style="color:var(--priority-high);padding:0.3rem 0.45rem;" onclick="app.deleteCat(${c.id})"><i class="fas fa-trash"></i></button>` : '<span style="width:30px;"></span>'}
                </div>
            `).join('');
        });
    },

    async handleAddCat() {
        const nameInput = document.getElementById('cat-new-name');
        const name = nameInput.value.trim();
        if (!name) return;
        const tipo = document.querySelector('[data-cattab].active')?.dataset.cattab || 'ingreso';
        try {
            const r = await fetch('/api/finanzas/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, tipo })
            });
            if (r.ok) {
                const cat = await r.json();
                this.finCategories.push({ id: cat.id, name, tipo, is_default: 0 });
                nameInput.value = '';
                this.renderCatLists();
                this.updateSearchCatOptions(this.activeFinTab());
                this.updateFinanzaCategoryOptions(tipo);
            } else {
                const err = await r.json();
                alert(err.error || 'Error al agregar categoría');
            }
        } catch (error) {
            console.error('Error agregando categoría:', error);
        }
    },

    async deleteCat(id) {
        if (!confirm('¿Eliminar esta categoría?')) return;
        try {
            const r = await fetch(`/api/finanzas/categorias/${id}`, { method: 'DELETE' });
            if (r.ok) {
                this.finCategories = this.finCategories.filter(c => c.id !== id);
                this.renderCatLists();
                this.updateSearchCatOptions(this.activeFinTab());
                this.updateFinanzaCategoryOptions(
                    document.querySelector('[data-cattab].active')?.dataset.cattab || 'ingreso'
                );
            } else {
                const err = await r.json();
                alert(err.error || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Error eliminando categoría:', error);
        }
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
            if (dateStr === this.todayStr()) dayDiv.classList.add('today');
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
