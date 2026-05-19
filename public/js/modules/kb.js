// ── Knowledge Base Module ─────────────────────────────────────────────────────
// Extracted from main.js. Uses window.app for cross-module access.

export const kbModule = {

    async loadKb() {
        try {
            const r = await fetch('/api/kb');
            if (!r.ok) return;
            window.app.kbArticles = await r.json();
            window.app.renderKb();
        } catch (e) { console.error('Error cargando KB:', e); }
    },

    renderKb() {
        const search    = (document.getElementById('kb-search')?.value || '').toLowerCase().trim();
        const activeCat = document.querySelector('.kb-cat-item.active')?.dataset.cat || 'all';

        const catCounts = {};
        window.app.kbArticles.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });

        const catList = document.getElementById('kb-cat-list');
        if (catList) {
            const cats = Object.keys(catCounts).sort();
            catList.innerHTML = `
                <button class="kb-cat-item${activeCat === 'all' ? ' active' : ''}" data-cat="all">
                    <i class="fas fa-border-all"></i> Todos
                    <span class="kb-cat-count">${window.app.kbArticles.length}</span>
                </button>
                ${cats.map(c => `
                    <button class="kb-cat-item${activeCat === c ? ' active' : ''}" data-cat="${c}">
                        <i class="${window.app.kbCatIcon(c)}"></i> ${c}
                        <span class="kb-cat-count">${catCounts[c]}</span>
                    </button>`).join('')}`;
            catList.querySelectorAll('.kb-cat-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    catList.querySelectorAll('.kb-cat-item').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    window.app.renderKb();
                });
            });
        }

        const filtered = window.app.kbArticles.filter(a => {
            if (activeCat !== 'all' && a.category !== activeCat) return false;
            if (search && !a.title.toLowerCase().includes(search) && !a.content.toLowerCase().includes(search)) return false;
            return true;
        });

        const container = document.getElementById('kb-list');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="kb-empty"><i class="fas fa-book-open" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.3;"></i>${search ? 'Sin resultados para tu búsqueda.' : 'No hay artículos en esta categoría.'}</div>`;
            return;
        }

        const isAdmin = document.body.classList.contains('is-admin');
        container.innerHTML = filtered.map(a => {
            const excerpt  = a.content.replace(/[#*`]/g, '').substring(0, 150).trim() + (a.content.length > 150 ? '...' : '');
            const date     = new Date(a.updated_at).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' });
            const pdfBadge = a.pdf_url ? `<a href="${a.pdf_url}" target="_blank" class="pres-pdf-btn" onclick="event.stopPropagation()"><i class="fas fa-file-pdf"></i> PDF</a>` : '';
            const adminBtns = isAdmin ? `
                <div class="kb-card-admin-btns">
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;" title="Editar" onclick="event.stopPropagation();app.openKbModal(${window.app.safeJson(a)})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="padding:0.3rem 0.45rem;color:var(--priority-high);" title="Eliminar" onclick="event.stopPropagation();app.deleteKbArticle(${a.id})"><i class="fas fa-trash"></i></button>
                </div>` : '';
            return `
                <div class="kb-card" onclick="app.openKbDetail(${a.id})">
                    <div class="kb-card-header"><span class="kb-cat-badge">${a.category}</span>${pdfBadge}</div>
                    <div class="kb-card-title">${a.title}</div>
                    <div class="kb-card-excerpt">${excerpt}</div>
                    <div class="kb-card-footer">
                        <span class="kb-author"><i class="far fa-user"></i>${a.author || 'Sistema'}</span>
                        <div style="display:flex;align-items:center;gap:0.6rem;">
                            <span><i class="far fa-clock"></i>${date}</span>
                            ${adminBtns}
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    kbCatIcon(cat) {
        const icons = { 'Procesos':'fas fa-sitemap', 'FAQ':'fas fa-question-circle', 'Guías':'fas fa-map-signs', 'Plantillas':'fas fa-file-alt', 'Recursos':'fas fa-link', 'General':'fas fa-folder' };
        return icons[cat] || 'fas fa-tag';
    },

    kbParseContent(raw) {
        if (!raw) return '';
        return raw
            .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
            .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g,     '<code>$1</code>')
            .replace(/^---$/gm,      '<hr>')
            .replace(/^[-•] (.+)$/gm,'<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .split('\n').map(line => {
                if (/^<(h[123]|hr|ul|li)/.test(line.trim())) return line;
                if (line.trim() === '') return '';
                return `<p>${line}</p>`;
            }).join('\n');
    },

    openKbDetail(id) {
        const a = window.app.kbArticles.find(x => x.id === id);
        if (!a) return;
        window.app.kbCurrentArticle = a;
        document.getElementById('kb-detail-title').textContent = a.title;
        const date = new Date(a.updated_at).toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' });
        document.getElementById('kb-detail-meta').innerHTML = `
            <span><i class="fas fa-tag" style="color:#22D3EE;"></i> ${a.category}</span>
            <span><i class="far fa-user"></i> ${a.author || 'Sistema'}</span>
            <span><i class="far fa-clock"></i> ${date}</span>
            ${a.pdf_url ? `<a href="${a.pdf_url}" target="_blank" class="pres-pdf-btn"><i class="fas fa-file-pdf"></i> Ver PDF adjunto</a>` : ''}`;
        document.getElementById('kb-detail-body').innerHTML = window.app.kbParseContent(a.content);
        document.getElementById('kb-detail-modal').classList.add('active');
    },

    openKbModal(a = null) {
        document.getElementById('kb-modal').classList.add('active');
        document.getElementById('kb-modal-title').textContent = a ? 'Editar Artículo' : 'Nuevo Artículo';
        document.getElementById('kb-id').value       = a ? a.id : '';
        document.getElementById('kb-title').value    = a ? a.title : '';
        document.getElementById('kb-category').value = a ? a.category : '';
        document.getElementById('kb-content').value  = a ? a.content : '';
        document.getElementById('kb-pdf-file').value = '';
        window.app.showKbPdfState(a?.pdf_url || null);
        if (!a) document.getElementById('kb-form').reset();
    },

    showKbPdfState(pdfUrl) {
        const current     = document.getElementById('kb-pdf-current');
        const placeholder = document.getElementById('kb-pdf-placeholder');
        const viewBtn     = document.getElementById('kb-pdf-view');
        const nameEl      = document.getElementById('kb-pdf-name');
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

    async handleKbSubmit() {
        const id   = document.getElementById('kb-id').value;
        const data = {
            title:    document.getElementById('kb-title').value,
            content:  document.getElementById('kb-content').value,
            category: document.getElementById('kb-category').value || 'General',
        };
        const method = id ? 'PUT' : 'POST';
        const url    = id ? `/api/kb/${id}` : '/api/kb';
        try {
            const r      = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if (!r.ok) { const err = await r.json(); alert('Error: ' + (err.error || 'desconocido')); return; }
            const result  = await r.json();
            const kbId    = id || result.id;
            const pdfFile = document.getElementById('kb-pdf-file')?.files[0];
            if (pdfFile) {
                const form = new FormData();
                form.append('pdf', pdfFile);
                await fetch(`/api/kb/${kbId}/pdf`, { method: 'POST', body: form });
            }
            window.app.closeModal();
            window.app.loadKb();
        } catch (e) { console.error('Error guardando artículo:', e); }
    },

    async removeKbPdf() {
        const id      = document.getElementById('kb-id').value;
        const pdfFile = document.getElementById('kb-pdf-file');
        if (pdfFile.files[0]) { pdfFile.value = ''; window.app.showKbPdfState(null); return; }
        if (!id) { window.app.showKbPdfState(null); return; }
        try {
            await fetch(`/api/kb/${id}/pdf`, { method: 'DELETE' });
            window.app.showKbPdfState(null);
        } catch (e) { console.error('Error eliminando PDF de KB:', e); }
    },

    async deleteKbArticle(id) {
        if (!confirm('¿Eliminar este artículo?')) return;
        try {
            await fetch(`/api/kb/${id}`, { method: 'DELETE' });
            window.app.closeModal();
            window.app.loadKb();
        } catch (e) { console.error('Error eliminando artículo:', e); }
    },

};
