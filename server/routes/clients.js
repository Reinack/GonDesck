const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../helpers/utils');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../../public/uploads');
const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// GET all clients
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clients ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new client
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { name, email, phone } = req.body;
    try {
        const result = await db.query('INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) RETURNING id', [name, email, phone]);
        await logActivity(req, 'Creación de cliente', { nombre: name });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update client
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, instagram_url, description } = req.body;
    try {
        await db.query(
            'UPDATE clients SET name=$1, email=$2, phone=$3, instagram_url=$4, description=$5 WHERE id=$6',
            [name, email || null, phone || null, instagram_url || null, description || null, id]
        );
        await logActivity(req, 'Actualización de cliente', { nombre: name });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE client
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const clientResult = await db.query('SELECT name FROM clients WHERE id = $1', [id]);
        const client = clientResult.rows[0];
        await db.query('DELETE FROM clients WHERE id = $1', [id]);
        await logActivity(req, 'Eliminación de cliente', { nombre: client?.name || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload client logo
router.post('/:id/logo', isAuthenticated, isAdmin, upload.single('logo'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const logoUrl = `/uploads/${req.file.filename}`;
    try {
        await db.query('UPDATE clients SET logo_url=$1 WHERE id=$2', [logoUrl, id]);
        res.json({ success: true, logo_url: logoUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
