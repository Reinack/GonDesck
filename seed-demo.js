const db = require('./server/database');

// Obtener usuarios y clientes existentes
const usuarios = db.prepare('SELECT username FROM users').all().map(u => u.username);
const clientes = db.prepare('SELECT name FROM clients').all().map(c => c.name);

if (usuarios.length === 0) {
    console.log('No hay usuarios. Creá al menos un usuario primero desde la app.');
    process.exit(1);
}

const titulos = [
    'Diseñar landing page',
    'Configurar servidor de producción',
    'Reunión con cliente para relevamiento',
    'Corregir bugs en módulo de pagos',
    'Actualizar documentación técnica',
    'Implementar autenticación con 2FA',
    'Revisar propuesta comercial',
    'Optimizar consultas a la base de datos',
    'Crear campaña en redes sociales',
    'Migrar base de datos a nuevo servidor',
    'Diseñar identidad visual',
    'Instalar certificado SSL',
    'Capacitar al equipo en nueva herramienta',
    'Auditoría de seguridad',
    'Integrar pasarela de cobro',
    'Redactar contrato de servicios',
    'Testear flujo de onboarding',
    'Subir app a producción',
    'Hacer backup mensual',
    'Configurar Google Analytics',
    'Revisar y aprobar diseños UX',
    'Armar presentación para inversores',
    'Actualizar dependencias del proyecto',
    'Soporte técnico cliente prioritario',
    'Planificar sprint siguiente',
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
    'Publicar contenido semanal en Instagram y LinkedIn.',
    'Sin tiempo de inactividad, con rollback plan.',
    'Logo, paleta de colores y tipografías.',
    'Renovar certificado vencido en producción.',
    'Taller de 2 horas sobre el nuevo CRM.',
    'Revisión de permisos, contraseñas y accesos.',
    'Conectar con API de MercadoPago.',
    'Incluir cláusulas de confidencialidad y SLA.',
    'Verificar que todos los pasos funcionen correctamente.',
    'Deploy en servidor y verificar logs.',
    'Backup de base de datos y archivos.',
    'Configurar eventos y conversiones.',
    'Revisión final antes de enviar al cliente.',
    'Preparar deck de 10 slides con métricas clave.',
    'Ejecutar npm audit y actualizar paquetes.',
    'Resolver incidentes pendientes del cliente.',
    'Definir historias de usuario y estimaciones.',
];

const estados = ['pendiente', 'pendiente', 'pendiente', 'en_progreso', 'en_progreso', 'completada'];
const prioridades = ['alta', 'alta', 'media', 'media', 'media', 'baja'];

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function fechaAleatoria() {
    const hoy = new Date();
    const dias = Math.floor(Math.random() * 60) - 15; // entre -15 y +45 días
    hoy.setDate(hoy.getDate() + dias);
    return hoy.toISOString().split('T')[0];
}

const insert = db.prepare(`
    INSERT INTO tasks (title, description, assigned_to, client, due_date, status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction(() => {
    for (let i = 0; i < 25; i++) {
        const cliente = clientes.length > 0 && Math.random() > 0.3 ? randomFrom(clientes) : null;
        insert.run(
            titulos[i],
            descripciones[i],
            randomFrom(usuarios),
            cliente,
            fechaAleatoria(),
            randomFrom(estados),
            randomFrom(prioridades)
        );
    }
});

insertMany();
console.log('✓ 25 tareas de demo creadas exitosamente.');
console.log(`  Usuarios: ${usuarios.join(', ')}`);
console.log(`  Clientes: ${clientes.length > 0 ? clientes.join(', ') : 'ninguno'}`);
