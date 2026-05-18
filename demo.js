const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.resolve(__dirname, './data/gondesck.db'));

// ── Limpiar ──────────────────────────────────────────
db.prepare('DELETE FROM tasks').run();
db.prepare('DELETE FROM users').run();
db.prepare('DELETE FROM notifications').run();
console.log('Datos anteriores eliminados.');

// ── 10 Usuarios ──────────────────────────────────────
const usuarios = [
    { username: 'admin',      role: 'admin' },
    { username: 'Gonzalo',    role: 'admin' },
    { username: 'Sebastian',  role: 'user'  },
    { username: 'Kevin',      role: 'user'  },
    { username: 'Facundo',    role: 'user'  },
    { username: 'Maria',      role: 'user'  },
    { username: 'Lucas',      role: 'user'  },
    { username: 'Sofia',      role: 'user'  },
    { username: 'Diego',      role: 'user'  },
    { username: 'Valentina',  role: 'user'  },
];

const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
const hash = bcrypt.hashSync('demo1234', 10);
for (const u of usuarios) {
    insertUser.run(u.username, hash, u.role);
}
console.log(`${usuarios.length} usuarios creados (contraseña: demo1234)`);

// ── 30 Tareas ─────────────────────────────────────────
const asignables = usuarios.filter(u => u.role === 'user').map(u => u.username);

const titulos = [
    'Diseñar landing page principal',
    'Configurar servidor de producción',
    'Reunión de relevamiento con cliente',
    'Corregir bugs en módulo de pagos',
    'Actualizar documentación técnica',
    'Implementar autenticación con 2FA',
    'Revisar propuesta comercial',
    'Optimizar consultas a la base de datos',
    'Diseñar identidad visual de marca',
    'Instalar certificado SSL',
    'Crear campaña de email marketing',
    'Desarrollar API de integración',
    'Revisar contrato con proveedor',
    'Configurar pipeline de CI/CD',
    'Armar presentación para inversores',
    'Migrar base de datos a nueva versión',
    'Crear módulo de reportes PDF',
    'Revisar y ajustar presupuesto Q3',
    'Implementar sistema de notificaciones',
    'Diseñar flujo de onboarding',
    'Publicar app en App Store',
    'Integrar pasarela de pagos Stripe',
    'Realizar auditoría de seguridad',
    'Configurar backups automáticos',
    'Redactar términos y condiciones',
    'Optimizar rendimiento del frontend',
    'Crear panel de métricas',
    'Capacitar al equipo en nueva herramienta',
    'Revisar feedback de usuarios beta',
    'Lanzar versión 2.0 del producto',
];

const descripciones = [
    'Incluir secciones hero, beneficios y formulario de contacto.',
    'Verificar configuración de variables de entorno y dominio.',
    'Levantar requerimientos funcionales y no funcionales.',
    'Revisar logs de errores y aplicar parches necesarios.',
    'Actualizar README y guías de instalación.',
    'Implementar Google Authenticator como segunda capa.',
    'Ajustar precios y alcance del proyecto.',
    'Agregar índices y revisar queries lentas.',
    'Logo, paleta de colores y tipografías.',
    'Renovar certificado vencido en producción.',
    'Diseñar secuencia de bienvenida para nuevos clientes.',
    'Documentar endpoints y casos de uso.',
    'Verificar cláusulas de SLA y penalidades.',
    'Automatizar tests y despliegues en staging.',
    'Preparar deck con métricas de crecimiento.',
    'Asegurar compatibilidad con schema actualizado.',
    'Exportar datos en formato PDF con filtros.',
    'Ajustar proyección de gastos operativos.',
    'Push notifications en tiempo real via WebSockets.',
    'Mapear pasos desde registro hasta primera acción.',
    'Cumplir con requisitos de Apple Review.',
    'Configurar webhooks y manejo de errores.',
    'Revisar vulnerabilidades OWASP Top 10.',
    'Programar backups diarios en S3.',
    'Redactar política de privacidad incluida.',
    'Reducir tiempo de carga a menos de 2 segundos.',
    'Dashboard con KPIs de conversión y retención.',
    'Taller de 2 horas sobre flujo de trabajo.',
    'Consolidar respuestas y priorizar mejoras.',
    'Coordinar deploy y comunicar a usuarios.',
];

const prioridades = ['alta', 'media', 'media', 'media', 'baja'];
const estados = ['pendiente', 'pendiente', 'pendiente', 'en_progreso', 'completada'];
const clientes = ['Somos Alma', 'Com de Tu Destino', 'Cóctel Paradise', '', '', ''];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fechaAleatoria() {
    const hoy = new Date();
    const dias = Math.floor(Math.random() * 120) - 20; // -20 a +100 días
    hoy.setDate(hoy.getDate() + dias);
    return hoy.toISOString().split('T')[0];
}

const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, assigned_to, client, due_date, status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < 30; i++) {
    insertTask.run(
        titulos[i],
        descripciones[i],
        rand(asignables),
        rand(clientes),
        fechaAleatoria(),
        rand(estados),
        rand(prioridades)
    );
}
console.log('30 tareas creadas.');
console.log('\n✓ Demo lista. Entrá con cualquier usuario / demo1234');

db.close();
