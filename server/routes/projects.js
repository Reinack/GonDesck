const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/utils');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET all projects
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM proyectos ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new project
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { name, client_name, description, status, start_date, end_date, budget, color } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO proyectos (name, client_name, description, status, start_date, end_date, budget, color)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
            [name, client_name||null, description||null, status||'en_curso', start_date||null, end_date||null, parseFloat(budget)||0, color||'#60A5FA']
        );
        await logActivity(req, 'Creación de proyecto', { nombre: name });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update project
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { name, client_name, description, status, start_date, end_date, budget, color } = req.body;
    try {
        await db.query(
            `UPDATE proyectos SET name=$1, client_name=$2, description=$3, status=$4,
             start_date=$5, end_date=$6, budget=$7, color=$8 WHERE id=$9`,
            [name, client_name||null, description||null, status, start_date||null, end_date||null, parseFloat(budget)||0, color||'#60A5FA', req.params.id]
        );
        await logActivity(req, 'Actualización de proyecto', { nombre: name });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE project
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const r = await db.query('SELECT name FROM proyectos WHERE id=$1', [req.params.id]);
        await db.query('UPDATE tasks SET project_id=NULL WHERE project_id=$1', [req.params.id]);
        await db.query('DELETE FROM proyectos WHERE id=$1', [req.params.id]);
        await logActivity(req, 'Eliminación de proyecto', { nombre: r.rows[0]?.name });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
