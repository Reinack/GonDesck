// ── Módulo: Proyectos ─────────────────────────────────────────────────────────

export const projectsModule = {

    async loadProyectos() {
        try {
            const r = await fetch('/api/proyectos');
            if (!r.ok) return;
            window.app.proyectos = await r.json();
            window.app.updateTaskProjectSelector();
            window.app.renderProyectos();
        } catch (e) { console.error('Error cargando proyectos:', e); }
    },

    updateTaskProjectSelector() {
        const sel = document.getElementById('task-project');
        if (!sel) return;
        const prev = sel.value;
        sel.innerHTML = '<option value="">Sin proyecto</option>' +
            window.app.proyectos.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        if (prev) sel.value = prev;
    },

    renderProyectos() {
        const search  = (document.getElementById('proy-search')?.value || '').toLowerCase().trim();
        const statusF = document.getElementById('proy-filter-status')?.value || 'all';

        const filtered = window.app.proyectos.filter(p => {
            if (statusF !== 'all' && p.status !== statusF) return false;
            if (search && !p.name.toLowerCase().includes(search) && !(p.client_name||'').toLowerCase().includes(search)) return false;
            return true;
        });

        // Stats
        document.getElementById('proy-stat-total').textContent      = window.app.proyectos.length;
        document.getElementById('proy-stat-activos').textContent     = window.app.proyectos.filter(p => p.status === 'en_curso').length;
        document.getElementById('proy-stat-entregados').textContent  = window.app.proyectos.filter(p => p.status === 'entregado').length;
        const progresos = window.app.proyectos.map(p => window.app.calcProyProgress(p.id));
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
            const prog     = window.app.calcProyProgress(p.id);
            const taskInfo = window.app.getProyTaskInfo(p.id);
            const dateHtml = (p.start_date || p.end_date)
                ? `<span><i class="far fa-calendar"></i>${p.start_date||'?'} → ${p.end_date||'?'}</span>` : '';
            const budgetHtml = p.budget > 0 ? `<span><i class="fas fa-dollar-sign"></i>${window.app.formatMonto(p.budget)}</span>` : '';
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
        const tasks = window.app.tasks.filter(t => t.project_id == projectId);
        if (!tasks.length) return 0;
        return Math.round(tasks.filter(t => t.status === 'completada').length / tasks.length * 100);
    },

    getProyTaskInfo(projectId) {
        const tasks = window.app.tasks.filter(t => t.project_id == projectId);
        return { total: tasks.length, done: tasks.filter(t => t.status === 'completada').length };
    },

    openProyectoDetail(id) {
        const p = window.app.proyectos.find(x => x.id === id);
        if (!p) return;
        window.app.currentProyecto = p;
        document.getElementById('proy-detail-name').textContent = p.name;
        const statusLabels = { en_curso:'En Curso', pausado:'Pausado', entregado:'Entregado', cancelado:'Cancelado' };
        document.getElementById('proy-detail-meta').innerHTML = `
            ${p.client_name ? `<span><i class="fas fa-user-tie" style="color:var(--gold);"></i>${p.client_name}</span>` : ''}
            <span class="proy-status-badge pbadge-${p.status}">${statusLabels[p.status]}</span>
            ${p.end_date ? `<span><i class="far fa-calendar"></i> Entrega: ${p.end_date}</span>` : ''}
            ${p.budget > 0 ? `<span><i class="fas fa-dollar-sign"></i>${window.app.formatMonto(p.budget)}</span>` : ''}`;

        const prog = window.app.calcProyProgress(id);
        document.getElementById('proy-detail-progress-pct').textContent = prog + '%';
        document.getElementById('proy-detail-progress-bar').style.cssText = `width:${prog}%;background:${p.color||'#60A5FA'};`;

        const tasks = window.app.tasks.filter(t => t.project_id == id);
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
        if (dl && window.app.clients) dl.innerHTML = window.app.clients.map(c => `<option value="${c.name}">`).join('');

        const selectedColor = p?.color || '#60A5FA';
        document.getElementById('proy-color').value = selectedColor;
        const picker = document.getElementById('proy-color-picker');
        if (picker) {
            picker.innerHTML = window.app.PROY_COLORS.map(c => `
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
            if (r.ok) { window.app.closeModal(); window.app.loadProyectos(); }
            else { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); }
        } catch (e) { console.error('Error guardando proyecto:', e); }
    },

    async deleteProyecto(id) {
        if (!confirm('¿Eliminar este proyecto? Las tareas vinculadas quedarán sin proyecto.')) return;
        try {
            await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
            window.app.closeModal();
            window.app.loadProyectos();
            window.app.loadTasks();
        } catch (e) { console.error('Error eliminando proyecto:', e); }
    },

};
