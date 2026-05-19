// ── Finance Module ────────────────────────────────────────────────────────────
// Extracted from main.js. Uses window.app for cross-module access.

export const financeModule = {

    // ── Data loading ─────────────────────────────────────────────
    async loadFinanzas() {
        try {
            const [resI, resG, resC] = await Promise.all([
                fetch('/api/finanzas/ingresos'),
                fetch('/api/finanzas/gastos'),
                fetch('/api/finanzas/categorias')
            ]);
            if (!resI.ok || !resG.ok) return;
            window.app.ingresos      = await resI.json();
            window.app.gastos        = await resG.json();
            window.app.finCategories = resC.ok ? await resC.json() : [];
            window.app.updateSearchCatOptions(window.app.activeFinTab());
            window.app.renderFinanzas();
        } catch (error) { console.error('Error cargando finanzas:', error); }
    },

    // ── Helpers ──────────────────────────────────────────────────
    activeFinTab() {
        return document.querySelector('.fin-tab:not([data-cattab]).active')?.dataset.tab || 'ingresos';
    },

    finanzasPeriodoFiltrar(items, periodo) {
        const now = new Date();
        return items.filter(item => {
            if (periodo === 'todo') return true;
            const [y, m] = item.date.split('-').map(Number);
            if (periodo === 'mes')  return y === now.getFullYear() && m === now.getMonth() + 1;
            if (periodo === 'anio') return y === now.getFullYear();
            return true;
        });
    },

    getLast12Months() {
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
                label: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
            });
        }
        return months;
    },

    updateSearchCatOptions(tab) {
        const tipo = tab === 'ingresos' ? 'ingreso' : 'gasto';
        const cats = window.app.finCategories.filter(c => c.tipo === tipo);
        const sel  = document.getElementById('fin-search-cat');
        if (!sel) return;
        sel.innerHTML = '<option value="">Todas las categorías</option>' +
            cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    },

    updateFinanzaCategoryOptions(tipo) {
        const cats = window.app.finCategories.filter(c => c.tipo === tipo).map(c => c.name);
        const fallback = tipo === 'ingreso'
            ? ['Servicios','Productos','Suscripción','Honorarios','Otro']
            : ['Marketing','Infraestructura','Personal','Herramientas','Suscripciones','Impuestos','Otro'];
        const list = cats.length ? cats : fallback;
        document.getElementById('fin-category').innerHTML = list.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    // ── Rendering ────────────────────────────────────────────────
    renderFinanzas() {
        const periodo    = document.getElementById('fin-filter-periodo')?.value || 'mes';
        const ingPeriodo = window.app.finanzasPeriodoFiltrar(window.app.ingresos, periodo);
        const gasPeriodo = window.app.finanzasPeriodoFiltrar(window.app.gastos,   periodo);

        const totalIng = ingPeriodo.reduce((s, i) => s + Number(i.amount), 0);
        const totalGas = gasPeriodo.reduce((s, i) => s + Number(i.amount), 0);
        const balance  = totalIng - totalGas;
        document.getElementById('fin-total-ingresos').textContent = window.app.formatMonto(totalIng);
        document.getElementById('fin-total-gastos').textContent   = window.app.formatMonto(totalGas);
        document.getElementById('fin-balance').textContent        = window.app.formatMonto(balance);

        const balanceIcon = document.getElementById('fin-balance-icon');
        if (balanceIcon) balanceIcon.className = 'stat-icon balance' + (balance < 0 ? ' negative' : '');

        const clientSel = document.getElementById('fin-search-client');
        if (clientSel) {
            const usedClients = [...new Set(ingPeriodo.map(i => i.client).filter(Boolean))].sort();
            const prev = clientSel.value;
            clientSel.innerHTML = '<option value="">Todos los clientes</option>' +
                usedClients.map(c => `<option value="${c}">${c}</option>`).join('');
            if (prev) clientSel.value = prev;
        }

        window.app.applyFinSearch(ingPeriodo, gasPeriodo);

        if (document.getElementById('fin-charts-panel')?.style.display !== 'none') {
            window.app.renderFinCharts();
        }
    },

    applyFinSearch(ingBase, gasBase) {
        const periodo = document.getElementById('fin-filter-periodo')?.value || 'mes';
        ingBase = ingBase || window.app.finanzasPeriodoFiltrar(window.app.ingresos, periodo);
        gasBase = gasBase || window.app.finanzasPeriodoFiltrar(window.app.gastos,   periodo);

        const text   = (document.getElementById('fin-search-text')?.value || '').toLowerCase().trim();
        const cat    = document.getElementById('fin-search-cat')?.value || '';
        const client = document.getElementById('fin-search-client')?.value || '';
        const from   = document.getElementById('fin-search-from')?.value || '';
        const to     = document.getElementById('fin-search-to')?.value || '';

        const applyFilters = (items, includeClient) => items.filter(item => {
            if (text   && !item.description.toLowerCase().includes(text)) return false;
            if (cat    && item.category !== cat) return false;
            if (from   && item.date < from) return false;
            if (to     && item.date > to)   return false;
            if (includeClient && client && item.client !== client) return false;
            return true;
        });

        window.app.renderFinanzaList('fin-ingresos-list', applyFilters(ingBase, true),  'ingreso');
        window.app.renderFinanzaList('fin-gastos-list',   applyFilters(gasBase, false), 'gasto');
    },

    clearFinSearch() {
        ['fin-search-text','fin-search-cat','fin-search-client','fin-search-from','fin-search-to']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        window.app.applyFinSearch();
    },

    renderFinanzaList(containerId, items, tipo) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (items.length === 0) {
            container.innerHTML = `<div class="fin-empty"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:0.75rem;display:block;opacity:0.4;"></i>No hay ${tipo === 'ingreso' ? 'ingresos' : 'gastos'} en este periodo.</div>`;
            return;
        }
        container.innerHTML = items.map(item => `
            <div class="fin-item">
                <div class="fin-item-icon ${tipo}"><i class="fas fa-arrow-${tipo === 'ingreso' ? 'up' : 'down'}"></i></div>
                <div class="fin-item-info">
                    <div class="fin-item-desc">${item.description}</div>
                    <div class="fin-item-meta">
                        <span><i class="far fa-calendar"></i> ${item.date}</span>
                        <span class="fin-cat-badge">${item.category}</span>
                        ${item.client ? `<span style="color:var(--gold-light);"><i class="fas fa-user-tie"></i> ${item.client}</span>` : ''}
                    </div>
                </div>
                <div class="fin-item-amount ${tipo}">${window.app.formatMonto(item.amount)}</div>
                <div class="fin-item-actions">
                    <button class="btn btn-icon" onclick="app.openFinanzaModal('${tipo}', ${window.app.safeJson(item)})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon" style="color:var(--priority-high);" onclick="app.deleteFinanza('${tipo}', ${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    },

    // ── Modals ───────────────────────────────────────────────────
    openFinanzaModal(tipo = 'ingreso', item = null) {
        window.app.finanzaModal.classList.add('active');
        document.getElementById('finanza-modal-title').textContent = item ? 'Editar Movimiento' : 'Nuevo Movimiento';
        document.getElementById('finanza-id').value = item ? item.id : '';

        const typeBtns = document.querySelectorAll('.fin-type-btn');
        typeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === tipo);
            btn.onclick = () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.app.updateFinanzaCategoryOptions(btn.dataset.type);
                document.getElementById('fin-client-group').style.display = btn.dataset.type === 'ingreso' ? 'block' : 'none';
            };
        });

        window.app.updateFinanzaCategoryOptions(tipo);
        document.getElementById('fin-client-group').style.display = tipo === 'ingreso' ? 'block' : 'none';

        const clientSelect  = document.getElementById('fin-client');
        const clientOptions = window.app.clients ? window.app.clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('') : '';
        clientSelect.innerHTML = '<option value="">Sin cliente</option>' + clientOptions;

        if (item) {
            document.getElementById('fin-description').value = item.description;
            document.getElementById('fin-amount').value      = item.amount;
            document.getElementById('fin-date').value        = item.date;
            document.getElementById('fin-category').value    = item.category;
            if (item.client) document.getElementById('fin-client').value = item.client;
        } else {
            window.app.finanzaForm.reset();
            document.getElementById('finanza-id').value = '';
            document.getElementById('fin-date').value   = window.app.todayStr();
            typeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === tipo));
            window.app.updateFinanzaCategoryOptions(tipo);
        }
    },

    async handleFinanzaSubmit() {
        const id   = document.getElementById('finanza-id').value;
        const tipo = document.querySelector('.fin-type-btn.active')?.dataset.type || 'ingreso';
        const data = {
            description: document.getElementById('fin-description').value,
            amount:      document.getElementById('fin-amount').value,
            date:        document.getElementById('fin-date').value,
            category:    document.getElementById('fin-category').value,
        };
        if (tipo === 'ingreso') data.client = document.getElementById('fin-client').value;

        const endpoint = tipo === 'ingreso' ? 'ingresos' : 'gastos';
        const method   = id ? 'PUT' : 'POST';
        const url      = id ? `/api/finanzas/${endpoint}/${id}` : `/api/finanzas/${endpoint}`;
        try {
            const response = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
            if (response.ok) { window.app.closeModal(); window.app.loadFinanzas(); }
            else { const err = await response.json(); alert('Error: ' + (err.error || 'Error desconocido')); }
        } catch (error) { console.error('Error guardando movimiento:', error); }
    },

    async deleteFinanza(tipo, id) {
        if (!confirm(`¿Eliminar este ${tipo}?`)) return;
        const endpoint = tipo === 'ingreso' ? 'ingresos' : 'gastos';
        try {
            await fetch(`/api/finanzas/${endpoint}/${id}`, { method: 'DELETE' });
            window.app.loadFinanzas();
        } catch (error) { console.error('Error eliminando movimiento:', error); }
    },

    // ── Categories ───────────────────────────────────────────────
    openCatModal() {
        document.getElementById('cat-modal').classList.add('active');
        document.getElementById('cat-new-name').value = '';
        document.querySelectorAll('[data-cattab]').forEach(b => b.classList.toggle('active', b.dataset.cattab === 'ingreso'));
        document.getElementById('cat-list-ingreso').style.display = 'flex';
        document.getElementById('cat-list-gasto').style.display   = 'none';
        window.app.renderCatLists();
    },

    renderCatLists() {
        ['ingreso','gasto'].forEach(tipo => {
            const cats = window.app.finCategories.filter(c => c.tipo === tipo);
            const container = document.getElementById(`cat-list-${tipo}`);
            if (!container) return;
            if (cats.length === 0) {
                container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem;">Sin categorías.</p>';
                return;
            }
            container.innerHTML = cats.map(c => `
                <div class="cat-item">
                    <span>${c.name}</span>
                    ${c.is_default ? '<span class="cat-default-badge">default</span>' : ''}
                    ${!c.is_default ? `<button class="btn btn-icon" style="color:var(--priority-high);padding:0.3rem 0.45rem;" onclick="app.deleteCat(${c.id})"><i class="fas fa-trash"></i></button>` : '<span style="width:30px;"></span>'}
                </div>
            `).join('');
        });
    },

    async handleAddCat() {
        const nameInput = document.getElementById('cat-new-name');
        const name = nameInput.value.trim();
        if (!name) return;
        const tipo = document.querySelector('[data-cattab].active')?.dataset.cattab || 'ingreso';
        try {
            const r = await fetch('/api/finanzas/categorias', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ name, tipo })
            });
            if (r.ok) {
                const cat = await r.json();
                window.app.finCategories.push({ id: cat.id, name, tipo, is_default: 0 });
                nameInput.value = '';
                window.app.renderCatLists();
                window.app.updateSearchCatOptions(window.app.activeFinTab());
                window.app.updateFinanzaCategoryOptions(tipo);
            } else {
                const err = await r.json();
                alert(err.error || 'Error al agregar categoría');
            }
        } catch (error) { console.error('Error agregando categoría:', error); }
    },

    async deleteCat(id) {
        if (!confirm('¿Eliminar esta categoría?')) return;
        try {
            const r = await fetch(`/api/finanzas/categorias/${id}`, { method: 'DELETE' });
            if (r.ok) {
                window.app.finCategories = window.app.finCategories.filter(c => c.id !== id);
                window.app.renderCatLists();
                window.app.updateSearchCatOptions(window.app.activeFinTab());
                window.app.updateFinanzaCategoryOptions(
                    document.querySelector('[data-cattab].active')?.dataset.cattab || 'ingreso'
                );
            } else {
                const err = await r.json();
                alert(err.error || 'Error al eliminar');
            }
        } catch (error) { console.error('Error eliminando categoría:', error); }
    },

    // ── Charts ───────────────────────────────────────────────────
    destroyFinCharts() {
        Object.values(window.app.finCharts).forEach(c => c && c.destroy());
        window.app.finCharts = {};
    },

    renderFinCharts() {
        if (!window.Chart) return;
        window.app.destroyFinCharts();

        const PALETTE   = ['#D4A843','#34D399','#60A5FA','#F87171','#A78BFA','#FB923C','#FBBF24','#22D3EE','#4ADE80','#F472B6','#818CF8','#FCA5A5'];
        const gridColor  = 'rgba(255,255,255,0.06)';
        const tickColor  = '#6B7280';
        const fontFamily = 'Inter, sans-serif';
        const tooltipMonto = (ctx) => ` ${ctx.label}: $${Number(ctx.raw).toLocaleString('es-AR', {minimumFractionDigits:2})}`;

        const periodo  = document.getElementById('fin-filter-periodo')?.value || 'mes';
        const ingFilt  = window.app.finanzasPeriodoFiltrar(window.app.ingresos, periodo);
        const gasFilt  = window.app.finanzasPeriodoFiltrar(window.app.gastos,   periodo);
        const months   = window.app.getLast12Months();

        const ingByMonth = {}, gasByMonth = {};
        months.forEach(m => { ingByMonth[m.key] = 0; gasByMonth[m.key] = 0; });
        window.app.ingresos.forEach(i => { const k = i.date.substring(0,7); if (k in ingByMonth) ingByMonth[k] += Number(i.amount); });
        window.app.gastos.forEach(g   => { const k = g.date.substring(0,7); if (k in gasByMonth) gasByMonth[k] += Number(g.amount); });

        // Bar — evolución mensual
        const ctxBar = document.getElementById('chart-evolucion');
        if (ctxBar) {
            window.app.finCharts.bar = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: months.map(m => m.label),
                    datasets: [
                        { label: 'Ingresos', data: months.map(m => ingByMonth[m.key]), backgroundColor: 'rgba(52,211,153,0.65)', borderColor: '#34D399', borderWidth: 1, borderRadius: 4 },
                        { label: 'Gastos',   data: months.map(m => gasByMonth[m.key]), backgroundColor: 'rgba(248,113,113,0.65)', borderColor: '#F87171', borderWidth: 1, borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: tickColor, font: { family: fontFamily, size: 11 } } } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 }, callback: v => '$' + Number(v).toLocaleString('es-AR') } }
                    }
                }
            });
        }

        const buildDoughnut = (canvasId, items, chartKey) => {
            const byCat = {};
            items.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + Number(x.amount); });
            const keys = Object.keys(byCat);
            const ctx  = document.getElementById(canvasId);
            if (!ctx) return;
            window.app.finCharts[chartKey] = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: keys, datasets: [{ data: keys.map(k => byCat[k]), backgroundColor: PALETTE, borderColor: '#1F2937', borderWidth: 2 }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: tickColor, font: { family: fontFamily, size: 11 }, padding: 10, boxWidth: 12 } },
                        tooltip: { callbacks: { label: tooltipMonto } }
                    }
                }
            });
        };
        buildDoughnut('chart-gastos-cat',   gasFilt, 'gastos');
        buildDoughnut('chart-ingresos-cat', ingFilt, 'ingresos');

        // Line — balance acumulado
        const ctxLine = document.getElementById('chart-balance');
        if (ctxLine) {
            let acumulado = 0;
            const balanceData = months.map(m => {
                acumulado += (ingByMonth[m.key] || 0) - (gasByMonth[m.key] || 0);
                return acumulado;
            });
            window.app.finCharts.balance = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: months.map(m => m.label),
                    datasets: [{ label: 'Balance acumulado', data: balanceData, borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,0.10)', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#60A5FA', fill: true, tension: 0.3 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 }, callback: v => '$' + Number(v).toLocaleString('es-AR') } }
                    }
                }
            });
        }
    },

};
