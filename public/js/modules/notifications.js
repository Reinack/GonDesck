// ── Notifications Module ──────────────────────────────────────────────────────
// Extracted from main.js. Uses window.app for cross-module access.

export const notificationsModule = {

    startNotificationPoller() {
        this.loadNotifications();
        setInterval(() => window.app.loadNotifications(), 30000);
    },

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) return;
            const notifications = await response.json();
            window.app.updateNotificationBadge(notifications.length);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        }
    },

    updateNotificationBadge(count) {
        const el = window.app.notificationCount;
        if (!el) return;
        if (count > 0) {
            el.textContent = count;
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    },

    toggleNotifPanel() {
        const panel = document.getElementById('notif-panel');
        if (!panel) return;
        const isOpen = panel.classList.toggle('open');
        if (isOpen) window.app.renderNotifPanel();
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
            window.app.updateNotificationBadge(0);
            document.getElementById('notif-panel')?.classList.remove('open');
        } catch (error) {
            console.error('Error al leer notificaciones:', error);
        }
    },

};
