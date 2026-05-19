// ── Meetings Module ───────────────────────────────────────────────────────────
// Extracted from main.js. Uses window.app for cross-module access.

export const meetingsModule = {

    async loadReuniones() {
        try {
            const r = await fetch('/api/reuniones');
            if (!r.ok) return;
            window.app.reuniones = await r.json();
            window.app.renderReuniones();
            if (document.getElementById('reun-calendario')?.style.display !== 'none') window.app.renderReunCal();
        } catch (e) { console.error('Error cargando reuniones:', e); }
    },

    renderReuniones() {
        const search  = (document.getElementById('reun-search')?.value || '').toLowerCase().trim();
        const type    = document.getElementById('reun-filter-type')?.value   || 'all';
        const status  = document.getElementById('reun-filter-status')?.value || 'all';
        const from    = document.getElementById('reun-filter-from')?.value   || '';
        const to      = document.getElementById('reun-filter-to')?.value     || '';

        const filtered = window.app.reuniones.filter(r => {
            if (type   !== 'all' && r.type   !== type)   return false;
            if (status !== 'all' && r.status !== status) return false;
            if (from && r.date < from) return false;
            if (to   && r.date > to)   return false;
            if (search && !r.title.toLowerCase().includes(search) && !r.client_name.toLowerCase().includes(search)) return false;
            return true;
        });

        document.getElementById('reun-stat-total').textContent       = window.app.reuniones.length;
        document.getElementById('reun-stat-programadas').textContent  = window.app.reuniones.filter(r => r.status === 'programada').length;
        document.getElementById('reun-stat-realizadas').textContent   = window.app.reuniones.filter(r => r.status === 'realizada').length;

        const container = document.getElementById('reun-lista');
        if (!container) return;
        if (filtered.length === 0) {
            container.innerHTML = '<div class="reun-empty"><i class="fas fa-handshake" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>No hay reuniones con estos filtros.</div>';
            return;
        }

        const durLabel    = { 15:'15 min', 30:'30 min', 45:'45 min', 60:'1h', 90:'1h 30min', 120:'2h', 180:'3h' };
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
            else quickBtns = `
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
                    ${infoHtml}${topicsHtml}${notesHtml}
                    <div class="reun-card-footer">
                        <div class="reun-quick-btns">${quickBtns}</div>
                        <div style="display:flex;gap:0.4rem;">
                            <button class="btn btn-icon" onclick="app.openReunionModal(${window.app.safeJson(r)})"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-icon" style="color:var(--priority-high);" onclick="app.deleteReunion(${r.id})"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    renderReunCal() {
        const year  = window.app.reunCalDate.getFullYear();
        const month = window.app.reunCalDate.getMonth();
        const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        document.getElementById('reun-month-label').textContent = `${MONTHS[month]} ${year}`;

        const grid = document.getElementById('reun-cal-days');
        if (!grid) return;
        grid.innerHTML = '';

        const firstDay    = new Date(year, month, 1).getDay();
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
            if (dateStr === window.app.todayStr()) dayDiv.classList.add('today');
            dayDiv.innerHTML = `<span class="day-number">${i}</span>`;

            const dayReuns = window.app.reuniones.filter(r => r.date === dateStr);
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
                dayDiv.addEventListener('click', () => window.app.showReunCalDetail(dateStr, dayReuns));
            }
            grid.appendChild(dayDiv);
        }
        document.getElementById('reun-cal-detail').innerHTML = '';
    },

    showReunCalDetail(dateStr, reuns) {
        const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
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
                        <button class="btn btn-icon" style="flex-shrink:0;" onclick="app.openReunionModal(${window.app.safeJson(r)})"><i class="fas fa-edit"></i></button>
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
        window.app.toggleReunTypeFields(type);

        const dl = document.getElementById('reun-client-list');
        if (dl && window.app.clients) dl.innerHTML = window.app.clients.map(c => `<option value="${c.name}">`).join('');

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
            document.getElementById('reun-date').value = window.app.todayStr();
            document.querySelectorAll('.reun-type-btn').forEach(b => b.classList.toggle('active', b.dataset.rtype === 'virtual'));
            window.app.toggleReunTypeFields('virtual');
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
            if (r.ok) { window.app.closeModal(); window.app.loadReuniones(); }
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
            if (r.ok) window.app.loadReuniones();
        } catch (e) { console.error('Error cambiando estado:', e); }
    },

    async deleteReunion(id) {
        if (!confirm('¿Eliminar esta reunión?')) return;
        try {
            await fetch(`/api/reuniones/${id}`, { method: 'DELETE' });
            window.app.loadReuniones();
        } catch (e) { console.error('Error eliminando reunión:', e); }
    },

};
