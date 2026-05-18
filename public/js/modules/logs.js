// modules/logs.js
// Extracted from main.js — Activity Logs functions

export const logsModule = {

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
            logsModule.renderLogs(logs);
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
        const logsList = window.app.logsList;
        if (!logsList) return;
        logsList.innerHTML = '';

        if (logs.length === 0) {
            logsList.innerHTML = '<p class="log-empty">No hay actividad registrada.</p>';
            logsModule.renderLogsStats([]);
            return;
        }

        logsModule.renderLogsStats(logs);

        let lastGroup = null;
        logs.forEach(log => {
            const meta  = logsModule.getLogActionMeta(log.action);
            const group = logsModule.getDateGroupLabel(log.created_at);
            const rel   = logsModule.getRelativeTime(log.created_at);
            const abs   = new Date(log.created_at).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
            const initials = (log.username || '?').substring(0, 2).toUpperCase();

            if (group !== lastGroup) {
                const sep = document.createElement('div');
                sep.className = 'log-date-group';
                sep.textContent = group;
                logsList.appendChild(sep);
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
            logsList.appendChild(entry);
        });
    },

    renderLogsStats(logs) {
        const el = document.getElementById('logs-stats');
        if (!el) return;
        const creates  = logs.filter(l => logsModule.getLogActionMeta(l.action).type === 'create').length;
        const updates  = logs.filter(l => logsModule.getLogActionMeta(l.action).type === 'update').length;
        const deletes  = logs.filter(l => logsModule.getLogActionMeta(l.action).type === 'delete').length;
        const sessions = logs.filter(l => logsModule.getLogActionMeta(l.action).type === 'auth').length;
        el.innerHTML = `
            <div class="logs-stat-chip"><i class="fas fa-plus" style="color:#34D399;"></i> ${creates}</div>
            <div class="logs-stat-chip"><i class="fas fa-pen" style="color:#FBBF24;"></i> ${updates}</div>
            <div class="logs-stat-chip"><i class="fas fa-trash" style="color:#F87171;"></i> ${deletes}</div>
            <div class="logs-stat-chip"><i class="fas fa-right-to-bracket" style="color:#60A5FA;"></i> ${sessions}</div>
        `;
    },

};
