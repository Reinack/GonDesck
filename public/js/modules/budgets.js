// ── Budgets / Presupuestos Module ─────────────────────────────────────────────
// Extracted from main.js. Uses window.app for cross-module access.

export const budgetsModule = {

    async loadPresupuestos() {
        try {
            const r = await fetch('/api/presupuestos');
            if (!r.ok) return;
            window.app.presupuestos = await r.json();
            window.app.renderPresupuestos();
        } catch (e) { console.error('Error cargando presupuestos:', e); }
    },

    renderPresupuestos() {
        const search    = (document.getElementById('pres-search')?.value || '').toLowerCase().trim();
        const statusF   = document.getElementById('pres-filter-status')?.value || 'all';
        const sort      = document.getElementById('pres-sort')?.value || 'date_desc';
        const from      = document.getElementById('pres-from')?.value || '';
        const to        = document.getElementById('pres-to')?.value || '';
        const amountMin = parseFloat(document.getElementById('pres-amount-min')?.value) || 0;
        const amountMax = parseFloat(document.getElementById('pres-amount-max')?.value) || Infinity;

        let filtered = window.app.presupuestos.filter(p => {
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

        const all = window.app.presupuestos;
        document.getElementById('pres-stat-total').textContent     = all.length;
        document.getElementById('pres-stat-enviados').textContent   = all.filter(p => p.status === 'enviado').length;
        document.getElementById('pres-stat-aceptados').textContent  = all.filter(p => p.status === 'aceptado').length;
        const montoAceptado = all.filter(p => p.status === 'aceptado').reduce((s, p) => s + Number(p.amount), 0);
        document.getElementById('pres-stat-monto').textContent = window.app.formatMonto(montoAceptado);

        const container = document.getElementById('presupuestos-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<div class="pres-empty"><i class="fas fa-file-invoice-dollar" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>No hay presupuestos que coincidan.</div>';
            return;
        }

        container.innerHTML = filtered.map(p => {
            const statusLabels  = { borrador:'Borrador', enviado:'Enviado', aceptado:'Aceptado', rechazado:'Rechazado', vencido:'Vencido' };
            const validUntilHtml = p.valid_until ? `<span><i class="far fa-clock"></i> Válido hasta ${p.valid_until}</span>` : '';
            const descHtml  = p.description ? `<p class="pres-card-desc">${p.description}</p>` : '';
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
                quickActions = `<button class="pres-action-btn ingreso" onclick="app.convertirAIngreso(${window.app.safeJson(p)})"><i class="fas fa-arrow-trend-up"></i> Convertir a Ingreso</button>`;
            }

            const pdfHtml = p.pdf_url ? `<a href="${p.pdf_url}" target="_blank" class="pres-pdf-btn"><i class="fas fa-file-pdf"></i> Ver PDF</a>` : '';
            const safeP   = window.app.safeJson(p);
            return `
                <div class="pres-card status-${p.status}">
                    <div class="pres-card-header">
                        <div>
                            <div class="pres-card-title">${p.title}</div>
                            <div class="pres-card-client"><i class="fas fa-user-tie"></i>${p.client_name}</div>
                        </div>
                        <span class="pres-status-badge badge-${p.status}">${statusLabels[p.status]}</span>
                    </div>
                    <div class="pres-card-amount status-${p.status}">${window.app.formatMonto(p.amount)}</div>
                    ${descHtml}${notesHtml}
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

        const dl = document.getElementById('pres-client-list');
        if (dl && window.app.clients) dl.innerHTML = window.app.clients.map(c => `<option value="${c.name}">`).join('');

        document.getElementById('pres-pdf-file').value = '';
        window.app.showPresPdfState(p?.pdf_url || null);

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
            document.getElementById('pres-date').value = window.app.todayStr();
        }
    },

    showPresPdfState(pdfUrl) {
        const current     = document.getElementById('pres-pdf-current');
        const placeholder = document.getElementById('pres-pdf-placeholder');
        const viewBtn     = document.getElementById('pres-pdf-view');
        const nameEl      = document.getElementById('pres-pdf-name');
        if (pdfUrl) {
            nameEl.textContent        = decodeURIComponent(pdfUrl.split('/').pop());
            viewBtn.href              = pdfUrl;
            viewBtn.style.display     = '';
            current.style.display     = 'flex';
            placeholder.style.display = 'none';
        } else {
            current.style.display     = 'none';
            placeholder.style.display = '';
        }
    },

    async handlePresupuestoSubmit() {
        const id   = document.getElementById('pres-id').value;
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
            const r      = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if (!r.ok) { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); return; }
            const result  = await r.json();
            const presId  = id || result.id;
            const pdfFile = document.getElementById('pres-pdf-file')?.files[0];
            if (pdfFile) await window.app.uploadPresPdf(presId, pdfFile);
            window.app.closeModal();
            window.app.loadPresupuestos();
        } catch (e) { console.error('Error guardando presupuesto:', e); }
    },

    async uploadPresPdf(id, file) {
        const form = new FormData();
        form.append('pdf', file);
        try {
            const r = await fetch(`/api/presupuestos/${id}/pdf`, { method: 'POST', body: form });
            if (!r.ok) { const err = await r.json(); alert('Error subiendo PDF: ' + (err.error || 'desconocido')); }
        } catch (e) { console.error('Error subiendo PDF:', e); }
    },

    async removePresPdf() {
        const id      = document.getElementById('pres-id').value;
        const pdfFile = document.getElementById('pres-pdf-file');
        if (pdfFile.files[0]) { pdfFile.value = ''; window.app.showPresPdfState(null); return; }
        if (!id) { window.app.showPresPdfState(null); return; }
        try {
            await fetch(`/api/presupuestos/${id}/pdf`, { method: 'DELETE' });
            window.app.showPresPdfState(null);
            const pres = window.app.presupuestos.find(p => p.id == id);
            if (pres) pres.pdf_url = null;
        } catch (e) { console.error('Error eliminando PDF:', e); }
    },

    async changePresStatus(id, status) {
        try {
            const r = await fetch(`/api/presupuestos/${id}/status`, {
                method: 'PATCH',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ status })
            });
            if (r.ok) window.app.loadPresupuestos();
        } catch (e) { console.error('Error cambiando estado:', e); }
    },

    async deletePresupuesto(id) {
        if (!confirm('¿Eliminar este presupuesto?')) return;
        try {
            await fetch(`/api/presupuestos/${id}`, { method: 'DELETE' });
            window.app.loadPresupuestos();
        } catch (e) { console.error('Error eliminando presupuesto:', e); }
    },

    convertirAIngreso(p) {
        if (!confirm(`¿Convertir "${p.title}" a ingreso por ${window.app.formatMonto(p.amount)}?`)) return;
        window.app.openFinanzaModal('ingreso', {
            description: p.title,
            amount:      p.amount,
            client:      p.client_name,
            category:    'Servicios',
            date:        window.app.todayStr()
        });
    },

};
