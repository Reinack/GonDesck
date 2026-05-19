// ── GonDesck Pro — main.js ────────────────────────────────────────────────────
// Orchestration layer: imports all domain modules and owns core state + init.

import { authModule }          from './modules/auth.js';
import { tasksModule }         from './modules/tasks.js';
import { usersModule }         from './modules/users.js';
import { clientsModule }       from './modules/clients.js';
import { projectsModule }      from './modules/projects.js';
import { pipelineModule }      from './modules/pipeline.js';
import { logsModule }          from './modules/logs.js';
import { meetingsModule }      from './modules/meetings.js';
import { kbModule }            from './modules/kb.js';
import { budgetsModule }       from './modules/budgets.js';
import { financeModule }       from './modules/finance.js';
import { notificationsModule } from './modules/notifications.js';

const app = {

    // ── State ─────────────────────────────────────────────────────
    tasks:            [],
    proyectos:        [],
    currentProyecto:  null,
    pipelineDeals:    [],
    reuniones:        [],
    reunCalDate:      new Date(),
    ingresos:         [],
    gastos:           [],
    finCategories:    [],
    presupuestos:     [],
    kbArticles:       [],
    kbCurrentArticle: null,
    finCharts:        {},
    currentDate:      new Date(),
    clients:          [],
    users:            [],
    USER_COLORS:      12,
    userColorMap:     {},
    calendarDateFilter: null,
    PROY_COLORS: ['#60A5FA','#34D399','#F472B6','#FBBF24','#A78BFA','#FB923C','#22D3EE','#F87171','#4ADE80','#818CF8'],

    // ── Core utilities ────────────────────────────────────────────
    safeJson(obj) { return JSON.stringify(obj).replace(/"/g, '&quot;'); },
    todayStr()    { return new Date().toISOString().split('T')[0]; },
    formatMonto(n){ return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },

    // ── Bootstrap ─────────────────────────────────────────────────
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkAuth();
    },

    // ── DOM cache ─────────────────────────────────────────────────
    cacheDOM() {
        this.sidebarItems      = document.querySelectorAll('.sidebar-nav li');
        this.views             = document.querySelectorAll('.view');
        this.taskModal         = document.getElementById('task-modal');
        this.taskForm          = document.getElementById('task-form');
        this.addTaskBtn        = document.getElementById('add-task-btn');
        this.recentTaskList    = document.getElementById('recent-task-list');
        this.fullTaskList      = document.getElementById('full-task-list');
        this.statPending       = document.getElementById('stat-pending');
        this.statProgress      = document.getElementById('stat-progress');
        this.statCompleted     = document.getElementById('stat-completed');
        this.calendarDays      = document.getElementById('calendar-days');
        this.currentMonthYear  = document.getElementById('current-month-year');
        this.filterStatus      = document.getElementById('filter-status');
        this.filterTime        = document.getElementById('filter-time');
        this.filterPriority    = document.getElementById('filter-priority');
        this.filterClient      = document.getElementById('filter-client');
        this.filterUser        = document.getElementById('filter-user');
        this.statCards         = document.querySelectorAll('.stat-card');
        this.loginScreen       = document.getElementById('login-screen');
        this.loginForm         = document.getElementById('login-form');
        this.appContainer      = document.querySelector('.app-container');
        this.logoutBtn         = document.getElementById('logout-btn');
        this.loginError        = document.getElementById('login-error');
        this.clientModal       = document.getElementById('client-modal');
        this.clientForm        = document.getElementById('client-form');
        this.addClientBtn      = document.getElementById('add-client-btn');
        this.clientList        = document.getElementById('client-list');
        this.taskClientSelect  = document.getElementById('task-client');
        this.userModal         = document.getElementById('user-modal');
        this.userForm          = document.getElementById('user-form');
        this.addUserBtn        = document.getElementById('add-user-btn');
        this.userList          = document.getElementById('user-list');
        this.taskUserSelect    = document.getElementById('assigned_to');
        this.passwordModal     = document.getElementById('password-modal');
        this.passwordForm      = document.getElementById('password-form');
        this.logsList          = document.getElementById('logs-list');
        this.notificationBtn   = document.getElementById('notifications-btn');
        this.notificationCount = document.getElementById('notification-count');
        this.finanzaModal      = document.getElementById('finanza-modal');
        this.finanzaForm       = document.getElementById('finanza-form');
        this.addFinanzaBtn     = document.getElementById('add-finanza-btn');
        this.filterClient      = document.getElementById('filter-client');
    },

    // ── Navigation ────────────────────────────────────────────────
    switchView(viewId) {
        this.views.forEach(view => view.classList.remove('active'));
        document.getElementById(`view-${viewId}`)?.classList.add('active');
        const loaders = {
            tasks:        () => this.renderTasks(),
            dashboard:    () => this.renderCalendar(),
            calendar:     () => this.renderCalendar(),
            clients:      () => this.loadClients(),
            users:        () => this.loadUsers(),
            logs:         () => this.loadLogs(),
            proyectos:    () => this.loadProyectos(),
            manual:       () => this.initManual(),
            pipeline:     () => this.loadPipeline(),
            reuniones:    () => this.loadReuniones(),
            finanzas:     () => this.loadFinanzas(),
            presupuestos: () => this.loadPresupuestos(),
            kb:           () => this.loadKb(),
        };
        loaders[viewId]?.();
    },

    // ── Modal helpers ─────────────────────────────────────────────
    openModal(task = null) {
        this.taskModal.classList.add('active');
        if (task) {
            document.getElementById('modal-title').textContent    = 'Editar Tarea';
            document.getElementById('task-id').value              = task.id;
            document.getElementById('title').value                = task.title;
            document.getElementById('description').value          = task.description;
            document.getElementById('assigned_to').value          = task.assigned_to;
            document.getElementById('task-client').value          = task.client || '';
            document.getElementById('due_date').value             = task.due_date;
            document.getElementById('priority').value             = task.priority;
            document.getElementById('status').value               = task.status;
            document.getElementById('notes').value                = task.notes || '';
            const projSel = document.getElementById('task-project');
            if (projSel) projSel.value = task.project_id || '';
        } else {
            document.getElementById('modal-title').textContent = 'Nueva Tarea';
            this.taskForm.reset();
            document.getElementById('task-id').value = '';
        }
    },

    closeModal() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    },

    // ── Calendar ──────────────────────────────────────────────────
    renderCalendar() {
        const year  = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        this.currentMonthYear.textContent = `${monthNames[month]} ${year}`;
        this.calendarDays.innerHTML = '';

        const firstDay    = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            this.calendarDays.appendChild(empty);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const dayDiv  = document.createElement('div');
            dayDiv.className = 'calendar-day';
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
                    this.filterStatus.value   = 'all';
                    this.filterPriority.value = 'all';
                    this.filterClient.value   = 'all';
                    this.filterTime.value     = 'all';
                    if (this.filterUser) this.filterUser.value = 'all';
                    this.calendarDateFilter = dateStr;
                    this.switchView('tasks');
                    this.sidebarItems.forEach(i => i.classList.remove('active'));
                    document.querySelector('[data-view="tasks"]')?.classList.add('active');
                    const label = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
                    document.getElementById('calendar-filter-label').textContent = label;
                    document.getElementById('calendar-filter-active').style.display = 'block';
                });
            }
            this.calendarDays.appendChild(dayDiv);
        }
    },

    clearCalendarFilter() {
        this.calendarDateFilter = null;
        document.getElementById('calendar-filter-active').style.display = 'none';
    },

    // ── Projects helpers ─────────────────────────────────────────
    selectProyColor(color) {
        document.getElementById('proy-color').value = color;
        document.querySelectorAll('.proy-color-dot').forEach(d => d.classList.toggle('selected', d.dataset.color === color));
    },

    // ── Manual ───────────────────────────────────────────────────
    initManual() {
        const links    = document.querySelectorAll('.manual-index-item');
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
        const content = document.querySelector('.manual-content');
        if (content) {
            content.addEventListener('scroll', () => {
                let current = '';
                sections.forEach(s => { if (s.offsetTop <= content.scrollTop + 80) current = s.id; });
                links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
            });
        }
    },

    // ── Event bindings ────────────────────────────────────────────
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
        document.addEventListener('click', (e) => { if (e.target.closest('.close-modal')) this.closeModal(); });
        this.taskForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleTaskSubmit(); });

        // Calendar
        document.getElementById('prev-month')?.addEventListener('click', () => { this.currentDate.setMonth(this.currentDate.getMonth()-1); this.renderCalendar(); });
        document.getElementById('next-month')?.addEventListener('click', () => { this.currentDate.setMonth(this.currentDate.getMonth()+1); this.renderCalendar(); });

        // Task filters
        this.filterStatus.addEventListener('change',   () => { this.clearCalendarFilter(); this.renderTasks(); });
        this.filterTime.addEventListener('change',     () => { this.clearCalendarFilter(); this.renderTasks(); });
        this.filterPriority.addEventListener('change', () => this.renderTasks());
        this.filterClient.addEventListener('change',   () => this.renderTasks());
        this.filterUser?.addEventListener('change',    () => this.renderTasks());
        document.getElementById('clear-calendar-filter')?.addEventListener('click', () => { this.clearCalendarFilter(); this.renderTasks(); });

        // Dashboard stat cards
        this.statCards.forEach(card => {
            card.addEventListener('click', () => {
                const icon = card.querySelector('.stat-icon');
                if (!icon) return;
                const statusMap = { pending: 'pendiente', progress: 'en_progreso', completed: 'completada' };
                const status = statusMap[icon.classList[1]];
                if (status) {
                    this.filterStatus.value = status;
                    this.switchView('tasks');
                    this.sidebarItems.forEach(i => i.classList.remove('active'));
                    document.querySelector('[data-view="tasks"]')?.classList.add('active');
                    this.renderTasks();
                }
            });
        });

        // Auth
        this.loginForm.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Clients
        this.addClientBtn?.addEventListener('click', () => this.openClientModal());
        this.clientForm?.addEventListener('submit', (e) => { e.preventDefault(); this.handleClientSubmit(); });
        document.getElementById('client-logo-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => { const preview = document.getElementById('client-logo-preview'); preview.src = ev.target.result; preview.style.display = 'block'; document.getElementById('logo-placeholder').style.display = 'none'; };
            reader.readAsDataURL(file);
        });

        // Users
        this.addUserBtn?.addEventListener('click', () => this.openUserModal());
        this.userForm?.addEventListener('submit', (e) => { e.preventDefault(); this.handleUserSubmit(); });
        this.passwordForm?.addEventListener('submit', (e) => { e.preventDefault(); this.handlePasswordSubmit(); });
        document.getElementById('user-photo-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => { const preview = document.getElementById('user-photo-preview'); preview.src = ev.target.result; preview.style.display = 'block'; document.getElementById('photo-placeholder').style.display = 'none'; };
            reader.readAsDataURL(file);
        });

        // Notifications
        this.notificationBtn?.addEventListener('click', (e) => { e.stopPropagation(); this.toggleNotifPanel(); });
        document.getElementById('mark-read-btn')?.addEventListener('click', (e) => { e.stopPropagation(); this.markNotificationsRead(); });
        document.addEventListener('click', (e) => { if (!e.target.closest('#notifications-btn')) document.getElementById('notif-panel')?.classList.remove('open'); });

        // Finanzas
        this.addFinanzaBtn?.addEventListener('click', () => this.openFinanzaModal());
        this.finanzaForm?.addEventListener('submit', (e) => { e.preventDefault(); this.handleFinanzaSubmit(); });
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
            if (!visible) this.renderFinCharts(); else this.destroyFinCharts();
        });
        ['fin-search-text','fin-search-cat','fin-search-client','fin-search-from','fin-search-to'].forEach(id => {
            document.getElementById(id)?.addEventListener(id === 'fin-search-text' ? 'input' : 'change', () => this.applyFinSearch());
        });
        document.getElementById('fin-clear-search')?.addEventListener('click', () => this.clearFinSearch());

        // Proyectos
        document.getElementById('add-proyecto-btn')?.addEventListener('click', () => this.openProyectoModal());
        document.getElementById('proyecto-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleProyectoSubmit(); });
        document.getElementById('proy-search')?.addEventListener('input', () => this.renderProyectos());
        document.getElementById('proy-filter-status')?.addEventListener('change', () => this.renderProyectos());
        document.getElementById('proy-detail-edit-btn')?.addEventListener('click', () => { this.closeModal(); if (this.currentProyecto) this.openProyectoModal(this.currentProyecto); });
        document.getElementById('proy-detail-delete-btn')?.addEventListener('click', () => { if (this.currentProyecto) this.deleteProyecto(this.currentProyecto.id); });
        document.getElementById('proy-add-task-btn')?.addEventListener('click', () => {
            this.closeModal();
            if (this.currentProyecto) { this.openModal(); setTimeout(() => { const sel = document.getElementById('task-project'); if (sel) sel.value = this.currentProyecto.id; }, 50); }
        });

        // Pipeline
        document.getElementById('add-deal-btn')?.addEventListener('click', () => this.openDealModal());
        document.getElementById('deal-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleDealSubmit(); });
        document.getElementById('pipe-search')?.addEventListener('input', () => this.renderPipeline());
        document.getElementById('pipe-filter-user')?.addEventListener('change', () => this.renderPipeline());

        // Reuniones
        document.getElementById('add-reunion-btn')?.addEventListener('click', () => this.openReunionModal());
        document.getElementById('reunion-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleReunionSubmit(); });
        ['reun-search','reun-filter-type','reun-filter-status','reun-filter-from','reun-filter-to'].forEach(id => {
            document.getElementById(id)?.addEventListener(id === 'reun-search' ? 'input' : 'change', () => this.renderReuniones());
        });
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
                document.getElementById('reun-lista').style.display      = isLista ? 'grid'  : 'none';
                document.getElementById('reun-calendario').style.display = isLista ? 'none'  : 'block';
                if (!isLista) this.renderReunCal();
            });
        });
        document.getElementById('reun-prev-month')?.addEventListener('click', () => { this.reunCalDate.setMonth(this.reunCalDate.getMonth()-1); this.renderReunCal(); });
        document.getElementById('reun-next-month')?.addEventListener('click', () => { this.reunCalDate.setMonth(this.reunCalDate.getMonth()+1); this.renderReunCal(); });
        document.querySelectorAll('.reun-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.reun-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toggleReunTypeFields(btn.dataset.rtype);
            });
        });

        // KB
        document.getElementById('add-kb-btn')?.addEventListener('click', () => this.openKbModal());
        document.getElementById('kb-pdf-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            document.getElementById('kb-pdf-name').textContent = file.name;
            document.getElementById('kb-pdf-view').style.display     = 'none';
            document.getElementById('kb-pdf-current').style.display  = 'flex';
            document.getElementById('kb-pdf-placeholder').style.display = 'none';
        });
        document.getElementById('kb-pdf-remove')?.addEventListener('click', () => this.removeKbPdf());
        document.getElementById('kb-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleKbSubmit(); });
        document.getElementById('kb-search')?.addEventListener('input', () => this.renderKb());
        document.getElementById('kb-detail-edit-btn')?.addEventListener('click', () => { this.closeModal(); if (this.kbCurrentArticle) this.openKbModal(this.kbCurrentArticle); });
        document.getElementById('kb-detail-delete-btn')?.addEventListener('click', () => { if (this.kbCurrentArticle) this.deleteKbArticle(this.kbCurrentArticle.id); });

        // Presupuestos
        document.getElementById('add-presupuesto-btn')?.addEventListener('click', () => this.openPresupuestoModal());
        document.getElementById('presupuesto-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handlePresupuestoSubmit(); });
        ['pres-search','pres-filter-status','pres-sort','pres-from','pres-to','pres-amount-min','pres-amount-max'].forEach(id => {
            document.getElementById(id)?.addEventListener(id === 'pres-search' ? 'input' : 'change', () => this.renderPresupuestos());
        });
        document.getElementById('pres-clear-filters')?.addEventListener('click', () => {
            ['pres-search','pres-from','pres-to','pres-amount-min','pres-amount-max'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            document.getElementById('pres-filter-status').value = 'all';
            document.getElementById('pres-sort').value = 'date_desc';
            this.renderPresupuestos();
        });
        document.getElementById('pres-pdf-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            document.getElementById('pres-pdf-name').textContent = file.name;
            document.getElementById('pres-pdf-view').style.display     = 'none';
            document.getElementById('pres-pdf-current').style.display  = 'flex';
            document.getElementById('pres-pdf-placeholder').style.display = 'none';
        });
        document.getElementById('pres-pdf-remove')?.addEventListener('click', () => this.removePresPdf());

        // Categorías
        document.getElementById('manage-cats-btn')?.addEventListener('click', () => this.openCatModal());
        document.getElementById('cat-add-btn')?.addEventListener('click', () => this.handleAddCat());
        document.getElementById('cat-new-name')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.handleAddCat(); } });
        document.querySelectorAll('[data-cattab]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-cattab]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('cat-list-ingreso').style.display = btn.dataset.cattab === 'ingreso' ? 'flex' : 'none';
                document.getElementById('cat-list-gasto').style.display   = btn.dataset.cattab === 'gasto'   ? 'flex' : 'none';
            });
        });
    },

    // ── Module mix-in ─────────────────────────────────────────────
    ...authModule,
    ...tasksModule,
    ...usersModule,
    ...clientsModule,
    ...projectsModule,
    ...pipelineModule,
    ...logsModule,
    ...meetingsModule,
    ...kbModule,
    ...budgetsModule,
    ...financeModule,
    ...notificationsModule,
};

// Expose globally so inline onclick handlers (app.xxx) work
window.app = app;

document.addEventListener('DOMContentLoaded', () => app.init());
