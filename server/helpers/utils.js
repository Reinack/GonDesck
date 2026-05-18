const db = require('../database');

const logActivity = async (req, action, details = null) => {
    try {
        await db.query(
            'INSERT INTO activity_logs (user_id, username, action, details) VALUES ($1, $2, $3, $4)',
            [
                req.session?.userId || null,
                req.session?.username || 'Sistema',
                action,
                details ? JSON.stringify(details) : null
            ]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

const notifyUser = async (username, message) => {
    try {
        await db.query(
            'INSERT INTO notifications (username, message) VALUES ($1, $2)',
            [username, message]
        );
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

const notifyAdmins = async (message) => {
    try {
        await db.query(
            `INSERT INTO notifications (username, message) SELECT username, $1 FROM users WHERE role = 'admin'`,
            [message]
        );
    } catch (error) {
        console.error('Error sending admin notifications:', error);
    }
};

module.exports = {
    logActivity,
    notifyUser,
    notifyAdmins
};
