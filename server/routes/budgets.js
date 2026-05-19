const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../helpers/utils');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../public/uploads');
const uploadPdf = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            cb(null, `pres-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`);
        }
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se permiten archivos PDF'));
    }
});

// GET all budgets
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM presupuestos ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new budget
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { title, client_name, amount, description, status, date, valid_until, notes } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO presupuestos (title, client_name, amount, description, status, date, valid_until, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [title, client_name, parseFloat(amount), description || null, status || 'borrador', date, valid_until || null, notes || null]
        );
        await logActivity(req, 'Creación de presupuesto', { titulo: title, cliente: client_name, monto: amount });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update budget
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, client_name, amount, description, status, date, valid_until, notes } = req.body;
    try {
        await db.query(
            `UPDATE presupuestos SET title=$1, client_name=$2, amount=$3, description=$4,
             status=$5, date=$6, valid_until=$7, notes=$8 WHERE id=$9`,
            [title, client_name, parseFloat(amount), description || null, status, date, valid_until || null, notes || null, id]
        );
        await logActivity(req, 'Actualización de presupuesto', { titulo: title, estado: status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update budget status
router.patch('/:id/status', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['borrador','enviado','aceptado','rechazado','vencido'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    try {
        const r = await db.query('SELECT title FROM presupuestos WHERE id=$1', [id]);
        await db.query('UPDATE presupuestos SET status=$1 WHERE id=$2', [status, id]);
        await logActivity(req, 'Cambio de estado de presupuesto', { titulo: r.rows[0]?.title, estado: status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE budget
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const r = await db.query('SELECT title, client_name FROM presupuestos WHERE id=$1', [id]);
        await db.query('DELETE FROM presupuestos WHERE id=$1', [id]);
        await logActivity(req, 'Eliminación de presupuesto', { titulo: r.rows[0]?.title, cliente: r.rows[0]?.client_name });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload PDF to budget
router.post('/:id/pdf', isAuthenticated, isAdmin, uploadPdf.single('pdf'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo PDF' });
    const pdfUrl = `/uploads/${req.file.filename}`;
    try {
        // Eliminar PDF anterior si existe
        const old = await db.query('SELECT pdf_url FROM presupuestos WHERE id=$1', [id]);
        const oldUrl = old.rows[0]?.pdf_url;
        if (oldUrl) {
            const oldPath = path.join(uploadDir, path.basename(oldUrl));
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        await db.query('UPDATE presupuestos SET pdf_url=$1 WHERE id=$2', [pdfUrl, id]);
        res.json({ success: true, pdf_url: pdfUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE budget PDF
router.delete('/:id/pdf', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const r = await db.query('SELECT pdf_url FROM presupuestos WHERE id=$1', [id]);
        const url = r.rows[0]?.pdf_url;
        if (url) {
            const filePath = path.join(uploadDir, path.basename(url));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await db.query('UPDATE presupuestos SET pdf_url=NULL WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
