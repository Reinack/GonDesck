// ── Clients Module ───────────────────────────────────────────────────────────
// Extracted from main.js. All `this.xxx` references use `app` (= window.app).
// Cross-module calls use window.app.methodName().

async function loadClients() {
    const app = window.app;
    try {
        const response = await fetch('/api/clients');
        if (!response.ok) return;
        const clients = await response.json();
        app.clients = clients;
        app.renderClients(clients);
        app.updateClientSelectors(clients);
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

function renderClients(clients) {
    const app = window.app;
    if (!app.clientList) return;
    app.clientList.innerHTML = '';
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

        const safeClient = app.safeJson(client);

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
        app.clientList.appendChild(card);
    });

    if (clients.length === 0) {
        app.clientList.innerHTML = '<p class="no-tasks">No hay clientes registrados.</p>';
    }
}

async function handleClientSubmit() {
    const app = window.app;
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

        app.clientModal.classList.remove('active');
        app.loadClients();
    } catch (error) {
        console.error('Error guardando cliente:', error);
    }
}

async function deleteClient(id) {
    const app = window.app;
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
        await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        app.loadClients();
    } catch (error) {
        console.error('Error eliminando cliente:', error);
    }
}

function openClientModal(client = null) {
    const app = window.app;
    app.clientModal.classList.add('active');
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
        app.clientForm.reset();
        document.getElementById('client-id').value = '';
        logoPreview.style.display = 'none';
        logoPlaceholder.style.display = 'flex';
    }
}

function openClientProfile(client) {
    const app = window.app;
    const body = document.getElementById('profile-modal-body');
    const logoHtml = client.logo_url
        ? `<img src="${client.logo_url}" alt="${client.name}" class="profile-logo-large" style="cursor:zoom-in;" onclick="event.stopPropagation();app.openLightbox('${client.logo_url}')">`
        : `<div class="profile-logo-placeholder-large"><i class="fas fa-building"></i></div>`;

    const instagramUrl = client.instagram_url
        ? (client.instagram_url.startsWith('http') ? client.instagram_url : `https://instagram.com/${client.instagram_url.replace('@', '')}`)
        : null;

    const clientTasks = app.tasks.filter(t => t.client === client.name);
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
}

function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    lb.style.display = 'flex';
}

function updateClientSelectors(clients) {
    const app = window.app;
    if (!app.taskClientSelect || !app.filterClient) return;
    const options = clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    app.taskClientSelect.innerHTML = '<option value="">Sin cliente</option>' + options;
    app.filterClient.innerHTML = '<option value="all">Todos los clientes</option>' + options;
}

export const clientsModule = {
    loadClients,
    renderClients,
    handleClientSubmit,
    deleteClient,
    openClientModal,
    openClientProfile,
    openLightbox,
    updateClientSelectors
};
