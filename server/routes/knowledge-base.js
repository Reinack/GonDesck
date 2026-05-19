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

// GET all KB articles
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM kb_articles ORDER BY updated_at DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single KB article
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM kb_articles WHERE id=$1', [req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new KB article
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { title, content, category } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO kb_articles (title, content, category, author) VALUES ($1, $2, $3, $4) RETURNING id',
            [title, content, category || 'General', req.session.username]
        );
        await logActivity(req, 'Creación de artículo KB', { titulo: title, categoria: category });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update KB article
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { title, content, category } = req.body;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
        await db.query(
            'UPDATE kb_articles SET title=$1, content=$2, category=$3, updated_at=$4 WHERE id=$5',
            [title, content, category || 'General', now, req.params.id]
        );
        await logActivity(req, 'Actualización de artículo KB', { titulo: title });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload PDF to KB article
router.post('/:id/pdf', isAuthenticated, isAdmin, uploadPdf.single('pdf'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún PDF' });
    const pdfUrl = `/uploads/${req.file.filename}`;
    try {
        const old = await db.query('SELECT pdf_url FROM kb_articles WHERE id=$1', [id]);
        const oldUrl = old.rows[0]?.pdf_url;
        if (oldUrl) { const p = path.join(uploadDir, path.basename(oldUrl)); if (fs.existsSync(p)) fs.unlinkSync(p); }
        await db.query('UPDATE kb_articles SET pdf_url=$1 WHERE id=$2', [pdfUrl, id]);
        res.json({ success: true, pdf_url: pdfUrl });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE KB article PDF
router.delete('/:id/pdf', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const r = await db.query('SELECT pdf_url FROM kb_articles WHERE id=$1', [id]);
        const url = r.rows[0]?.pdf_url;
        if (url) { const p = path.join(uploadDir, path.basename(url)); if (fs.existsSync(p)) fs.unlinkSync(p); }
        await db.query('UPDATE kb_articles SET pdf_url=NULL WHERE id=$1', [id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// DELETE KB article
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const r = await db.query('SELECT title FROM kb_articles WHERE id=$1', [req.params.id]);
        await db.query('DELETE FROM kb_articles WHERE id=$1', [req.params.id]);
        await logActivity(req, 'Eliminación de artículo KB', { titulo: r.rows[0]?.title });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
