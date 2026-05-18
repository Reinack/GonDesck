// ── Módulo: Pipeline de Ventas ────────────────────────────────────────────────

export const pipelineModule = {

    async loadPipeline() {
        try {
            const r = await fetch('/api/pipeline');
            if (!r.ok) return;
            window.app.pipelineDeals = await r.json();
            window.app.renderPipeline();
            window.app.renderPipelineUserFilter();
        } catch (e) { console.error('Error cargando pipeline:', e); }
    },

    renderPipelineUserFilter() {
        const sel = document.getElementById('pipe-filter-user');
        if (!sel || !window.app.users) return;
        const prev = sel.value;
        sel.innerHTML = '<option value="all">Todos los responsables</option>' +
            window.app.users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
        if (prev) sel.value = prev;
    },

    renderPipeline() {
        const search   = (document.getElementById('pipe-search')?.value || '').toLowerCase().trim();
        const userF    = document.getElementById('pipe-filter-user')?.value || 'all';
        const STAGES   = ['prospecto','contactado','propuesta','negociando','ganado','perdido'];

        const filtered = window.app.pipelineDeals.filter(d => {
            if (userF !== 'all' && d.assigned_to !== userF) return false;
            if (search && !d.title.toLowerCase().includes(search) && !d.contact_name.toLowerCase().includes(search)) return false;
            return true;
        });

        // Stats
        const active   = window.app.pipelineDeals.filter(d => !['ganado','perdido'].includes(d.stage)).length;
        const ganados  = window.app.pipelineDeals.filter(d => d.stage === 'ganado').length;
        const total    = window.app.pipelineDeals.filter(d => ['ganado','perdido'].includes(d.stage)).length;
        const rate     = total > 0 ? Math.round((ganados / total) * 100) : 0;
        const valor    = filtered.filter(d => d.stage !== 'perdido')
                                 .reduce((s, d) => s + Number(d.amount) * (Number(d.probability) / 100), 0);
        document.getElementById('pipe-stat-active').textContent  = active;
        document.getElementById('pipe-stat-ganados').textContent = ganados;
        document.getElementById('pipe-stat-valor').textContent   = window.app.formatMonto(valor);
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
            col.innerHTML = deals.map(d => window.app.buildDealCard(d)).join('');
            col.querySelectorAll('.deal-card').forEach(card => window.app.attachDragEvents(card));
        });

        window.app.setupDropZones();
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
                ${Number(d.amount) > 0 ? `<div class="deal-card-amount">${window.app.formatMonto(d.amount)}</div>` : ''}
                <div class="deal-prob-bar-wrap"><div class="deal-prob-bar" style="width:${prob}%"></div></div>
                <div class="deal-card-meta">
                    <span class="deal-tag">${prob}% prob.</span>
                    ${closeHtml}${userHtml}${sourceHtml}
                </div>
                ${d.notes ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.4rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${d.notes}</p>` : ''}
                <div class="deal-card-actions">
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;" onclick="app.openDealModal(${window.app.safeJson(d)})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;color:var(--priority-high);" onclick="app.deleteDeal(${d.id})"><i class="fas fa-trash"></i></button>
                    ${d.stage === 'ganado' ? `<button class="btn btn-icon" style="padding:0.3rem 0.45rem;color:var(--completed-color);" title="Crear ingreso" onclick="app.dealToIngreso(${window.app.safeJson(d)})"><i class="fas fa-coins"></i></button>` : ''}
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
                const deal = window.app.pipelineDeals.find(d => d.id == id);
                if (!deal || deal.stage === stage) return;
                deal.stage = stage;
                window.app.renderPipeline();
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
        if (dl && window.app.clients) dl.innerHTML = window.app.clients.map(c => `<option value="${c.name}">`).join('');
        const sel = document.getElementById('deal-assigned');
        if (sel && window.app.users) {
            sel.innerHTML = '<option value="">Sin asignar</option>' +
                window.app.users.map(u => `<option value="${u.username}">${u.username}</option>`).join('');
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
            if (r.ok) { window.app.closeModal(); window.app.loadPipeline(); }
            else { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); }
        } catch (e) { console.error('Error guardando deal:', e); }
    },

    async deleteDeal(id) {
        if (!confirm('¿Eliminar esta oportunidad?')) return;
        try {
            await fetch(`/api/pipeline/${id}`, { method: 'DELETE' });
            window.app.loadPipeline();
        } catch (e) { console.error('Error eliminando deal:', e); }
    },

};
