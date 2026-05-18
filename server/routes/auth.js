const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { logActivity } = require('../helpers/utils');

router.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
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
        next(error);
    }
});

router.post('/logout', async (req, res, next) => {
    try {
        await logActivity(req, 'Cierre de sesión');
        req.session.destroy();
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

router.get('/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, username: req.session.username, role: req.session.role });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
