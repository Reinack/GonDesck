/**
 * formatters.js
 * Funciones de formato y utilidades de serialización extraídas de main.js.
 * Lógica EXACTA del original — sin cambios de comportamiento.
 */

/**
 * Formatea un número como monto en pesos argentinos.
 * Ej: 1500 → "$1.500,00"
 * @param {number|string} n
 * @returns {string}
 */
export function formatMonto(n) {
    return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Serializa un objeto a JSON escapando las comillas dobles para uso
 * seguro dentro de atributos HTML (onclick="...").
 * Ej: { a: 1 } → '{"a":1}' con &quot; en lugar de "
 * @param {*} obj
 * @returns {string}
 */
export function safeJson(obj) {
    return JSON.stringify(obj).replace(/"/g, '&quot;');
}

/**
 * Devuelve la fecha de hoy en formato ISO YYYY-MM-DD.
 * @returns {string}
 */
export function todayStr() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Devuelve metadatos de icono/tipo/label para una acción de log.
 * Utilizado para renderizar el historial de actividad.
 * @param {string} action  Nombre de la acción tal como llega de la API.
 * @returns {{ icon: string, type: string, label: string }}
 */
export function getLogActionMeta(action) {
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
}
