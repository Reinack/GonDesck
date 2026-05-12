const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const pool = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// JSON error handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ error: 'JSON malformado' });
    }
    next();
});
app.use(session({
    secret: process.env.SESSION_SECRET || 'gonflow-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const bcrypt = require('bcryptjs');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'No autorizado' });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
};

// Log Activity Helper
const logActivity = async (req, action, details = null) => {
    try {
        await pool.query('INSERT INTO activity_logs (user_id, username, action, details) VALUES ($1, $2, $3, $4)', [req.session.userId || null, req.session.username || 'Sistema', action, details ? JSON.stringify(details) : null]);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// API Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            await logActivity({ session: req.session }, 'Inicio de sesión');
            res.json({ success: true, username: user.username, role: user.role });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', async (req, res) => {
    await logActivity(req, 'Cierre de sesión');
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, username: req.session.username, role: req.session.role });
    } else {
        res.json({ authenticated: false });
    }
});

// Protected API Routes
app.get('/api/logs', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM notifications WHERE is_read = 0 AND username = $1 ORDER BY created_at DESC', [req.session.username]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/notifications/all', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM notifications WHERE username = $1 ORDER BY created_at DESC LIMIT 50', [req.session.username]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications/read', isAuthenticated, async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = 1 WHERE username = $1', [req.session.username]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/clients', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clients', isAuthenticated, isAdmin, async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        const result = await pool.query('INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) RETURNING id', [name, email, phone]);
        await logActivity(req, 'Creación de cliente', { nombre: name });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/clients/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const clientResult = await pool.query('SELECT name FROM clients WHERE id = $1', [id]);
        const client = clientResult.rows[0];
        await pool.query('DELETE FROM clients WHERE id = $1', [id]);
        await logActivity(req, 'Eliminación de cliente', { nombre: client?.name || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Management Routes
app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
        // Only return basic info
        const result = await pool.query('SELECT id, username, role FROM users ORDER BY username ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id', [username, hashedPassword, role || 'user']);
        await logActivity(req, 'Creación de usuario', { username, role });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id/password', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
        const userToUpdate = userResult.rows[0];
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
        await logActivity(req, 'Restablecimiento de contraseña', { usuario: userToUpdate?.username || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, role } = req.body;
    try {
        // Check if username is already taken by another user
        const existing = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Nombre de usuario ya existe' });
        }
        const oldUserResult = await pool.query('SELECT username, role FROM users WHERE id = $1', [id]);
        const oldUser = oldUserResult.rows[0];
        await pool.query('UPDATE users SET username = $1, role = $2 WHERE id = $3', [username, role, id]);
        await logActivity(req, 'Actualización de usuario', { usuario_antiguo: oldUser.username, nuevo: username, rol: role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting yourself
        if (parseInt(id) === req.session.userId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        }
        const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
        const user = userResult.rows[0];
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        await logActivity(req, 'Eliminación de usuario', { usuario: user?.username || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
        let result;
        if (req.session.role === 'admin') {
            result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
        } else {
            result = await pool.query('SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC', [req.session.username]);
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks', isAuthenticated, async (req, res) => {
    const { title, description, assigned_to, client, due_date, status, priority, notes } = req.body;
    try {
        const result = await pool.query(`
            INSERT INTO tasks (title, description, assigned_to, client, due_date, status, priority, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [title, description, assigned_to, client, due_date, status || 'pendiente', priority || 'media', notes]);
        await logActivity(req, 'Creación de tarea', { titulo: title, asignado_a: assigned_to, cliente: client });
        // Notificar al usuario asignado
        if (assigned_to && assigned_to !== req.session.username) {
            try {
                await pool.query('INSERT INTO notifications (username, message) VALUES ($1, $2)', [
                    assigned_to,
                    `Se te asignó una nueva tarea: "${title}"${client ? ` (Cliente: ${client})` : ''} — vence el ${due_date}`
                ]);
            } catch (err) { console.error('Error creando notificación:', err); }
        }
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_to, client, due_date, status, priority, notes } = req.body;
    try {
        const oldTaskResult = await pool.query('SELECT assigned_to FROM tasks WHERE id = $1', [id]);
        const oldTask = oldTaskResult.rows[0];
        await pool.query(`
            UPDATE tasks SET title = $1, description = $2, assigned_to = $3, client = $4, due_date = $5, status = $6, priority = $7, notes = $8
            WHERE id = $9
        `, [title, description, assigned_to, client, due_date, status, priority, notes, id]);

        let action = 'Actualización de tarea';
        if (status === 'completada') {
            action = 'Tarea Cerrada/Completada';
            // Notificar a todos los admins
            try {
                const adminsResult = await pool.query("SELECT username FROM users WHERE role = 'admin'");
                for (const admin of adminsResult.rows) {
                    await pool.query('INSERT INTO notifications (username, message) VALUES ($1, $2)', [
                        admin.username,
                        `La tarea "${title}" fue completada por ${req.session.username}`
                    ]);
                }
            } catch (err) { console.error('Error creating notification:', err); }
        }
        // Si cambió el asignado, notificar al nuevo
        if (assigned_to && oldTask && assigned_to !== oldTask.assigned_to && assigned_to !== req.session.username) {
            try {
                await pool.query('INSERT INTO notifications (username, message) VALUES ($1, $2)', [
                    assigned_to,
                    `Se te reasignó la tarea: "${title}"${client ? ` (Cliente: ${client})` : ''} — vence el ${due_date}`
                ]);
            } catch (err) { console.error('Error creando notificación de reasignación:', err); }
        }
        
        await logActivity(req, action, {
            titulo: title,
            asignado_a: assigned_to,
            estado: status,
            ...(client ? { cliente: client } : {})
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tasks/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const taskResult = await pool.query('SELECT title, assigned_to FROM tasks WHERE id = $1', [id]);
        const task = taskResult.rows[0];
        await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
        await logActivity(req, 'Eliminación de tarea', { titulo: task?.title || id, asignado_a: task?.assigned_to || '-' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
        const is_admin = req.session.role === 'admin';
        const user_filter = is_admin ? '' : 'WHERE assigned_to = $1';
        const params = is_admin ? [] : [req.session.username];

        const totalResult = await pool.query(`SELECT COUNT(*) as count FROM tasks ${user_filter}`, params);
        const pendienteResult = await pool.query(`SELECT COUNT(*) as count FROM tasks ${is_admin ? "WHERE status = 'pendiente'" : "WHERE status = 'pendiente' AND assigned_to = $1"}`, params);
        const progresoResult = await pool.query(`SELECT COUNT(*) as count FROM tasks ${is_admin ? "WHERE status = 'en_progreso'" : "WHERE status = 'en_progreso' AND assigned_to = $1"}`, params);
        const completadaResult = await pool.query(`SELECT COUNT(*) as count FROM tasks ${is_admin ? "WHERE status = 'completada'" : "WHERE status = 'completada' AND assigned_to = $1"}`, params);

        const stats = {
            total: parseInt(totalResult.rows[0].count),
            pendiente: parseInt(pendienteResult.rows[0].count),
            en_progreso: parseInt(progresoResult.rows[0].count),
            completada: parseInt(completadaResult.rows[0].count)
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
    console.log(`GonFlow server running on http://localhost:${PORT}`);
});
