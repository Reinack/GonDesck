const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/utils');
const { isAuthenticated } = require('../middleware/auth');

// GET all pipeline deals
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM pipeline_deals ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new deal
router.post('/', isAuthenticated, async (req, res) => {
    const { title, contact_name, amount, probability, stage, expected_close, source, assigned_to, notes } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO pipeline_deals (title, contact_name, amount, probability, stage, expected_close, source, assigned_to, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
            [title, contact_name, parseFloat(amount)||0, parseInt(probability)||50, stage||'prospecto', expected_close||null, source||'Otro', assigned_to||null, notes||null]
        );
        await logActivity(req, 'Creación de deal', { titulo: title, contacto: contact_name });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update deal
router.put('/:id', isAuthenticated, async (req, res) => {
    const { title, contact_name, amount, probability, stage, expected_close, source, assigned_to, notes } = req.body;
    try {
        await db.query(
            `UPDATE pipeline_deals SET title=$1, contact_name=$2, amount=$3, probability=$4, stage=$5,
             expected_close=$6, source=$7, assigned_to=$8, notes=$9 WHERE id=$10`,
            [title, contact_name, parseFloat(amount)||0, parseInt(probability)||50, stage, expected_close||null, source||'Otro', assigned_to||null, notes||null, req.params.id]
        );
        await logActivity(req, 'Actualización de deal', { titulo: title, etapa: stage });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update deal stage
router.patch('/:id/stage', isAuthenticated, async (req, res) => {
    const { stage } = req.body;
    const valid = ['prospecto','contactado','propuesta','negociando','ganado','perdido'];
    if (!valid.includes(stage)) return res.status(400).json({ error: 'Etapa inválida' });
    try {
        const r = await db.query('SELECT title FROM pipeline_deals WHERE id=$1', [req.params.id]);
        await db.query('UPDATE pipeline_deals SET stage=$1 WHERE id=$2', [stage, req.params.id]);
        await logActivity(req, 'Movimiento en pipeline', { titulo: r.rows[0]?.title, etapa: stage });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE deal
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const r = await db.query('SELECT title FROM pipeline_deals WHERE id=$1', [req.params.id]);
        await db.query('DELETE FROM pipeline_deals WHERE id=$1', [req.params.id]);
        await logActivity(req, 'Eliminación de deal', { titulo: r.rows[0]?.title });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
