/**
 * dateHelpers.js
 * Funciones de fecha y periodo extraídas de main.js.
 * Lógica EXACTA del original — sin cambios de comportamiento.
 */

/**
 * Devuelve un label de grupo de fecha para una entrada de log.
 * Resultado: "Hoy", "Ayer", o fecha larga localizada en es-AR.
 * @param {string} dateStr  Fecha/datetime en formato ISO.
 * @returns {string}
 */
export function getDateGroupLabel(dateStr) {
    const date = new Date(dateStr);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime())     return 'Hoy';
    if (d.getTime() === yesterday.getTime()) return 'Ayer';
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Devuelve un texto relativo al momento actual.
 * Ej: "ahora", "hace 5 min", "hace 3h", "ayer", o fecha corta.
 * @param {string} dateStr  Fecha/datetime en formato ISO.
 * @returns {string}
 */
export function getRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60)     return 'ahora';
    if (diff < 3600)   return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400)  return `hace ${Math.floor(diff / 3600)}h`;
    if (diff < 172800) return 'ayer';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

/**
 * Devuelve un array de los últimos 12 meses (inclusive el actual),
 * ordenados de más antiguo a más reciente.
 * Cada entrada: { key: "YYYY-MM", label: "ene. 25" }
 * @returns {{ key: string, label: string }[]}
 */
export function getLast12Months() {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
        });
    }
    return months;
}

/**
 * Filtra un array de movimientos financieros según el periodo seleccionado.
 * @param {{ date: string }[]} items  Array de ingresos o gastos.
 * @param {'mes'|'anio'|'todo'} periodo
 * @returns {{ date: string }[]}
 */
export function finanzasPeriodoFiltrar(items, periodo) {
    const now = new Date();
    return items.filter(item => {
        if (periodo === 'todo') return true;
        const [y, m] = item.date.split('-').map(Number);
        if (periodo === 'mes')  return y === now.getFullYear() && m === now.getMonth() + 1;
        if (periodo === 'anio') return y === now.getFullYear();
        return true;
    });
}

/**
 * Devuelve el tab de finanzas actualmente activo leyendo el DOM.
 * Si no hay ninguno activo, devuelve 'ingresos' como valor por defecto.
 * Stand-alone: no depende del objeto app.
 * @returns {'ingresos'|'gastos'}
 */
export function activeFinTab() {
    return document.querySelector('.fin-tab:not([data-cattab]).active')?.dataset.tab || 'ingresos';
}
