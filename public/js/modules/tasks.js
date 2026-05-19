// ── Tasks Module ─────────────────────────────────────────────────────────────
// Extracted from main.js. All `this.xxx` references use `app` (= window.app).
// Cross-module calls use window.app.methodName().

async function loadTasks() {
    const app = window.app;
    try {
        const response = await fetch('/api/tasks');
        if (response.status === 401) return app.showLogin();
        if (!response.ok) return;
        app.tasks = await response.json();
        app.renderTasks();
        app.updateStats();
        app.renderCalendar(); // calendar lives in dashboard
        if (app.recentTaskList) {
            app.recentTaskList.innerHTML = '';
            app.tasks.slice(0, 5).forEach(task => {
                app.recentTaskList.appendChild(app.createTaskItem(task));
            });
        }
    } catch (error) {
        console.error('Error cargando tareas:', error);
    }
}

function renderTasks() {
    const app = window.app;

    // Full list with filters
    app.fullTaskList.innerHTML = '';
    const statusFilter   = app.filterStatus.value;
    const timeFilter     = app.filterTime.value;
    const priorityFilter = app.filterPriority.value;
    const clientFilter   = app.filterClient.value;
    const userFilter     = app.filterUser?.value || 'all';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const filteredTasks = app.tasks.filter(task => {
        if (userFilter !== 'all' && task.assigned_to !== userFilter) return false;
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (clientFilter !== 'all' && task.client !== clientFilter) return false;
        // Filtro específico del calendario — tiene prioridad sobre el filtro de tiempo
        if (app.calendarDateFilter) {
            return task.due_date === app.calendarDateFilter;
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
        app.fullTaskList.appendChild(app.createTaskItem(task));
    });

    if (filteredTasks.length === 0) {
        app.fullTaskList.innerHTML = '<p class="no-tasks">No se encontraron tareas con estos filtros.</p>';
    }
}

async function handleTaskSubmit() {
    const app = window.app;
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
            app.closeModal();
            app.loadTasks();
        } else {
            const errorData = await response.json();
            alert('Error al guardar la tarea: ' + (errorData.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error guardando tarea:', error);
    }
}

async function deleteTask(id) {
    const app = window.app;
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        app.loadTasks();
    } catch (error) {
        console.error('Error eliminando tarea:', error);
    }
}

function createTaskItem(task) {
    const app = window.app;
    const div = document.createElement('div');
    div.className = 'task-card';
    const colorIdx = app.getUserColorIndex(task.assigned_to);
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
            <button class="btn btn-icon" onclick="app.openModal(${app.safeJson(task)})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-icon" style="color: var(--priority-high);" onclick="app.deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
        </div>
    `;
    return div;
}

function openModal(task = null) {
    const app = window.app;
    app.taskModal.classList.add('active');
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
        app.taskForm.reset();
        document.getElementById('task-id').value = '';
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
}

async function updateStats() {
    const app = window.app;
    try {
        const response = await fetch('/api/tasks/stats/all');
        if (response.status === 401) return;
        const stats = await response.json();
        app.statPending.textContent = stats.pendiente;
        app.statProgress.textContent = stats.en_progreso;
        app.statCompleted.textContent = stats.completada;
    } catch (error) {
        console.error('Error cargando stats:', error);
    }
}

function clearCalendarFilter() {
    const app = window.app;
    app.calendarDateFilter = null;
    document.getElementById('calendar-filter-active').style.display = 'none';
}

export const tasksModule = {
    loadTasks,
    renderTasks,
    handleTaskSubmit,
    deleteTask,
    createTaskItem,
    openModal,
    closeModal,
    updateStats,
    clearCalendarFilter
};
