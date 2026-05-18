const db = require('../database');

// Log Activity Helper
const logActivity = async (req, action, details = null) => {
    try {
        await db.query(
            'INSERT INTO activity_logs (user_id, username, action, details) VALUES ($1, $2, $3, $4)',
            [req.session.userId || null, req.session.username || 'Sistema', action, details ? JSON.stringify(details) : null]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = {
    logActivity
};
