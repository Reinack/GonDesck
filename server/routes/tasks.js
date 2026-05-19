const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/utils');
const { isAuthenticated } = require('../middleware/auth');

// GET all tasks
router.get('/', isAuthenticated, async (req, res) => {
    try {
        let result;
        if (req.session.role === 'admin') {
            result = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
        } else {
            result = await db.query('SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC', [req.session.username]);
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new task
router.post('/', isAuthenticated, async (req, res) => {
    const { title, description, assigned_to, client, due_date, status, priority, notes, project_id } = req.body;
    try {
        const result = await db.query(`
            INSERT INTO tasks (title, description, assigned_to, client, due_date, status, priority, notes, project_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, [title, description, assigned_to, client, due_date, status || 'pendiente', priority || 'media', notes, project_id || null]);
        await logActivity(req, 'Creación de tarea', { titulo: title, asignado_a: assigned_to, cliente: client });
        // Notificar al usuario asignado
        if (assigned_to && assigned_to !== req.session.username) {
            try {
                await db.query('INSERT INTO notifications (username, message) VALUES ($1, $2)', [
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

// PUT update task
router.put('/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_to, client, due_date, status, priority, notes, project_id } = req.body;
    try {
        const oldTaskResult = await db.query('SELECT assigned_to FROM tasks WHERE id = $1', [id]);
        const oldTask = oldTaskResult.rows[0];
        await db.query(`
            UPDATE tasks SET title = $1, description = $2, assigned_to = $3, client = $4, due_date = $5, status = $6, priority = $7, notes = $8, project_id = $9
            WHERE id = $10
        `, [title, description, assigned_to, client, due_date, status, priority, notes, project_id || null, id]);

        let action = 'Actualización de tarea';
        if (status === 'completada') {
            action = 'Tarea Cerrada/Completada';
            // Notificar a todos los admins
            try {
                await db.query(
                    `INSERT INTO notifications (username, message) SELECT username, $1 FROM users WHERE role = 'admin'`,
                    [`La tarea "${title}" fue completada por ${req.session.username}`]
                );
            } catch (err) { console.error('Error creating notification:', err); }
        }
        // Si cambió el asignado, notificar al nuevo
        if (assigned_to && oldTask && assigned_to !== oldTask.assigned_to && assigned_to !== req.session.username) {
            try {
                await db.query('INSERT INTO notifications (username, message) VALUES ($1, $2)', [
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

// DELETE task
router.delete('/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        const taskResult = await db.query('SELECT title, assigned_to FROM tasks WHERE id = $1', [id]);
        const task = taskResult.rows[0];
        await db.query('DELETE FROM tasks WHERE id = $1', [id]);
        await logActivity(req, 'Eliminación de tarea', { titulo: task?.title || id, asignado_a: task?.assigned_to || '-' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET task stats
router.get('/stats/all', isAuthenticated, async (req, res) => {
    try {
        const is_admin = req.session.role === 'admin';
        const where  = is_admin ? '' : 'WHERE assigned_to = $1';
        const params = is_admin ? [] : [req.session.username];
        const rows   = (await db.query(`SELECT status, COUNT(*) as count FROM tasks ${where} GROUP BY status`, params)).rows;
        const byStatus = {};
        rows.forEach(r => { byStatus[r.status] = parseInt(r.count); });
        const total = rows.reduce((s, r) => s + parseInt(r.count), 0);
        res.json({ total, pendiente: byStatus['pendiente'] || 0, en_progreso: byStatus['en_progreso'] || 0, completada: byStatus['completada'] || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
