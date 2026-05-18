const express = require('express');
const router = express.Router();
const db = require('../database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET activity logs (admin only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 500');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Notifications ────────────────────────────────────────────────

// GET unread notifications (GET /api/notifications)
router.get('/notifications', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notifications WHERE is_read = 0 AND username = $1 ORDER BY created_at DESC', [req.session.username]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all notifications for user (GET /api/notifications/all)
router.get('/notifications/all', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notifications WHERE username = $1 ORDER BY created_at DESC LIMIT 50', [req.session.username]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST mark notifications as read (POST /api/notifications/read)
router.post('/notifications/read', isAuthenticated, async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = 1 WHERE username = $1', [req.session.username]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
