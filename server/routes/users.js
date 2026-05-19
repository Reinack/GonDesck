const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');
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

// GET all users
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Only return basic info
        const result = await db.query('SELECT id, username, role, photo_url FROM users ORDER BY username ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new user
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await db.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id', [username, hashedPassword, role || 'user']);
        await logActivity(req, 'Creación de usuario', { username, role });
        res.json({ id: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update user
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, role } = req.body;
    try {
        // Check if username is already taken by another user
        const existing = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Nombre de usuario ya existe' });
        }
        const oldUserResult = await db.query('SELECT username, role FROM users WHERE id = $1', [id]);
        const oldUser = oldUserResult.rows[0];
        await db.query('UPDATE users SET username = $1, role = $2 WHERE id = $3', [username, role, id]);
        await logActivity(req, 'Actualización de usuario', { usuario_antiguo: oldUser.username, nuevo: username, rol: role });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE user
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting yourself
        if (parseInt(id) === req.session.userId) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        }
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [id]);
        const user = userResult.rows[0];
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        await logActivity(req, 'Eliminación de usuario', { usuario: user?.username || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT reset password for user
router.put('/:id/password', isAuthenticated, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [id]);
        const userToUpdate = userResult.rows[0];
        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
        await logActivity(req, 'Restablecimiento de contraseña', { usuario: userToUpdate?.username || id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload user photo
router.post('/:id/photo', isAuthenticated, upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const photoUrl = `/uploads/${req.file.filename}`;
    try {
        await db.query('UPDATE users SET photo_url=$1 WHERE id=$2', [photoUrl, id]);
        res.json({ success: true, photo_url: photoUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
