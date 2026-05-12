const pool = require('./server/database');

const bcrypt = require('bcryptjs');

(async () => {
    try {
        // Crear usuario administrador si no existe
        const adminPassword = bcrypt.hashSync('admin123', 10);
        try {
            await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', ['admin', adminPassword, 'admin']);
            console.log('Usuario administrador creado: admin / admin123');
        } catch (e) {
            console.log('El usuario administrador ya existe.');
        }

        const tasks = [
            {
                title: 'Diseñar Identidad Visual GonDesck',
                description: 'Crear el logo y definir la paleta de colores para la startup.',
                assigned_to: 'Alex',
                due_date: '2026-05-15',
                status: 'en_progreso',
                priority: 'alta'
            },
            {
                title: 'Desarrollo del Dashboard',
                description: 'Implementar las tarjetas de estadísticas y los gráficos de progreso.',
                assigned_to: 'Maria',
                due_date: '2026-05-20',
                status: 'pendiente',
                priority: 'media'
            },
            {
                title: 'Configurar Servidor de Producción',
                description: 'Desplegar la aplicación en el servidor VPS de la startup.',
                assigned_to: 'Juan',
                due_date: '2026-05-12',
                status: 'completada',
                priority: 'alta'
            },
            {
                title: 'Reunión de Feedback',
                description: 'Presentar los avances al equipo y recolectar feedback.',
                assigned_to: 'Todos',
                due_date: '2026-05-14',
                status: 'pendiente',
                priority: 'baja'
            }
        ];

        for (const task of tasks) {
            await pool.query(`
                INSERT INTO tasks (title, description, assigned_to, due_date, status, priority)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [task.title, task.description, task.assigned_to, task.due_date, task.status, task.priority]);
        }

        console.log('Base de datos poblada con éxito.');
    } catch (error) {
        console.error('Error poblando la base de datos:', error);
    } finally {
        process.exit();
    }
})();
