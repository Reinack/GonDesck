const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/logger');
const { isAuthenticated } = require('../middleware/auth');

// GET all meetings
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const isAdmin = req.session.role === 'admin';
        const result = isAdmin
            ? await db.query('SELECT * FROM reuniones ORDER BY date ASC, time ASC')
            : await db.query('SELECT * FROM reuniones WHERE created_by=$1 ORDER BY date ASC, time ASC', [req.session.username]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new meeting
router.post('/', isAuthenticated, async (req, res) => {
    const { title, client_name, type, location, link, date, time, duration, topics, status, notes } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO reuniones (title, client_name, type, location, link, date, time, duration, topics, status, notes, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [title, client_name, type || 'virtual', location || null, link || null, date, time, duration || 60, topics || null, status || 'programada', notes || null, req.session.username]
        );
        await logActivity(req, 'Creación de reunión', { titulo: title, cliente: client_name, fecha: date });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update meeting
router.put('/:id', isAuthenticated, async (req, res) => {
    const { title, client_name, type, location, link, date, time, duration, topics, status, notes } = req.body;
    try {
        const own = await db.query('SELECT created_by FROM reuniones WHERE id=$1', [req.params.id]);
        if (!own.rows[0]) return res.status(404).json({ error: 'No encontrada' });
        if (req.session.role !== 'admin' && own.rows[0].created_by !== req.session.username)
            return res.status(403).json({ error: 'No autorizado' });
        await db.query(
            `UPDATE reuniones SET title=$1, client_name=$2, type=$3, location=$4, link=$5,
             date=$6, time=$7, duration=$8, topics=$9, status=$10, notes=$11 WHERE id=$12`,
            [title, client_name, type, location || null, link || null, date, time, duration || 60, topics || null, status, notes || null, req.params.id]
        );
        await logActivity(req, 'Actualización de reunión', { titulo: title, estado: status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update meeting status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    const { status } = req.body;
    const valid = ['programada', 'realizada', 'cancelada'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    try {
        const r = await db.query('SELECT title, created_by FROM reuniones WHERE id=$1', [req.params.id]);
        if (!r.rows[0]) return res.status(404).json({ error: 'No encontrada' });
        if (req.session.role !== 'admin' && r.rows[0].created_by !== req.session.username)
            return res.status(403).json({ error: 'No autorizado' });
        await db.query('UPDATE reuniones SET status=$1 WHERE id=$2', [status, req.params.id]);
        await logActivity(req, 'Cambio de estado de reunión', { titulo: r.rows[0].title, estado: status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE meeting
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const r = await db.query('SELECT title, client_name, created_by FROM reuniones WHERE id=$1', [req.params.id]);
        if (!r.rows[0]) return res.status(404).json({ error: 'No encontrada' });
        if (req.session.role !== 'admin' && r.rows[0].created_by !== req.session.username)
            return res.status(403).json({ error: 'No autorizado' });
        await db.query('DELETE FROM reuniones WHERE id=$1', [req.params.id]);
        await logActivity(req, 'Eliminación de reunión', { titulo: r.rows[0].title, cliente: r.rows[0].client_name });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
