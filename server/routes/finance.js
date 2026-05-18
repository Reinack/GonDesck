const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/logger');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// ── Categories ───────────────────────────────────────────────────

// GET all categories
router.get('/categorias', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM fin_categories ORDER BY tipo, name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new category
router.post('/categorias', isAuthenticated, isAdmin, async (req, res) => {
    const { name, tipo } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!['ingreso','gasto'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });
    try {
        const result = await db.query(
            'INSERT INTO fin_categories (name, tipo) VALUES ($1, $2) RETURNING id',
            [name.trim(), tipo]
        );
        res.json({ id: result.rows[0].id, name: name.trim(), tipo });
    } catch (error) {
        if (error.message && error.message.includes('UNIQUE')) return res.status(400).json({ error: 'Esa categoría ya existe' });
        res.status(500).json({ error: error.message });
    }
});

// DELETE category
router.delete('/categorias/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const r = await db.query('SELECT is_default FROM fin_categories WHERE id=$1', [id]);
        if (!r.rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
        if (r.rows[0].is_default) return res.status(400).json({ error: 'No se pueden eliminar categorías predeterminadas' });
        await db.query('DELETE FROM fin_categories WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Income ───────────────────────────────────────────────────────

// GET all income entries
router.get('/ingresos', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ingresos ORDER BY date DESC, created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create income entry
router.post('/ingresos', isAuthenticated, isAdmin, async (req, res) => {
    const { description, amount, client, category, date } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO ingresos (description, amount, client, category, date) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [description, parseFloat(amount), client || null, category, date]
        );
        await logActivity(req, 'Registro de ingreso', { descripcion: description, monto: amount });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update income entry
router.put('/ingresos/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { description, amount, client, category, date } = req.body;
    try {
        await db.query(
            'UPDATE ingresos SET description=$1, amount=$2, client=$3, category=$4, date=$5 WHERE id=$6',
            [description, parseFloat(amount), client || null, category, date, id]
        );
        await logActivity(req, 'Actualización de ingreso', { descripcion: description });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE income entry
router.delete('/ingresos/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const r = await db.query('SELECT description FROM ingresos WHERE id=$1', [id]);
        await db.query('DELETE FROM ingresos WHERE id=$1', [id]);
        await logActivity(req, 'Eliminación de ingreso', { descripcion: r.rows[0]?.description || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Expenses ──────────────────────────────────────────────────────

// GET all expense entries
router.get('/gastos', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM gastos ORDER BY date DESC, created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create expense entry
router.post('/gastos', isAuthenticated, isAdmin, async (req, res) => {
    const { description, amount, category, date } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO gastos (description, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING id',
            [description, parseFloat(amount), category, date]
        );
        await logActivity(req, 'Registro de gasto', { descripcion: description, monto: amount });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update expense entry
router.put('/gastos/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { description, amount, category, date } = req.body;
    try {
        await db.query(
            'UPDATE gastos SET description=$1, amount=$2, category=$3, date=$4 WHERE id=$5',
            [description, parseFloat(amount), category, date, id]
        );
        await logActivity(req, 'Actualización de gasto', { descripcion: description });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE expense entry
router.delete('/gastos/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const r = await db.query('SELECT description FROM gastos WHERE id=$1', [id]);
        await db.query('DELETE FROM gastos WHERE id=$1', [id]);
        await logActivity(req, 'Eliminación de gasto', { descripcion: r.rows[0]?.description || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
