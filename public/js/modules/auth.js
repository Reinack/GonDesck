// ── Auth Module ──────────────────────────────────────────────────────────────
// Extracted from main.js. All `this.xxx` references use `app` (= window.app).
// Cross-module calls use window.app.methodName().

async function checkAuth() {
    const app = window.app;
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        if (data.authenticated) {
            app.setupUserProfile(data.username, data.role);
            app.startNotificationPoller();
            app.showApp();
        } else {
            app.showLogin();
        }
    } catch (error) {
        app.showLogin();
    }
}

async function handleLogin() {
    const app = window.app;
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    app.loginError.textContent = '';
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            app.setupUserProfile(data.username, data.role);
            app.startNotificationPoller();
            app.showApp();
        } else {
            app.loginError.textContent = data.error || 'Error al iniciar sesión';
        }
    } catch (error) {
        app.loginError.textContent = 'Error de conexión';
    }
}

async function handleLogout() {
    const app = window.app;
    await fetch('/api/logout', { method: 'POST' });
    app.showLogin();
}

function setupUserProfile(username, role) {
    const app = window.app;
    app.currentUser = username;
    const profileName = document.getElementById('user-profile-name');
    const avatar = document.getElementById('user-avatar');
    if (profileName) profileName.textContent = username;
    if (avatar) avatar.textContent = username.substring(0, 2).toUpperCase();
    if (role === 'admin') {
        document.body.classList.add('is-admin');
    } else {
        document.body.classList.remove('is-admin');
    }
}

function showApp() {
    const app = window.app;
    app.loginScreen.style.display = 'none';
    app.appContainer.style.display = 'flex';
    app.loadTasks();
    app.loadClients();
    app.loadUsers();
    app.loadProyectos();
}

function showLogin() {
    const app = window.app;
    app.loginScreen.style.display = 'flex';
    app.appContainer.style.display = 'none';
}

export const authModule = {
    checkAuth,
    handleLogin,
    handleLogout,
    setupUserProfile,
    showApp,
    showLogin
};
