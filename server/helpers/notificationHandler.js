const db = require('../database');

const sendNotification = async (username, message) => {
    try {
        await db.query(
            'INSERT INTO notifications (username, message) VALUES ($1, $2)',
            [username, message]
        );
    } catch (error) {
        console.error('Error sending notification to', username, ':', error);
    }
};

const notifyTaskAssignment = async (username, taskTitle, client, dueDate) => {
    if (!username) return;
    const message = `Se te asignó una nueva tarea: "${taskTitle}"${client ? ` (Cliente: ${client})` : ''} — vence el ${dueDate}`;
    await sendNotification(username, message);
};

const notifyTaskReassignment = async (username, taskTitle, client, dueDate) => {
    if (!username) return;
    const message = `Se te reasignó la tarea: "${taskTitle}"${client ? ` (Cliente: ${client})` : ''} — vence el ${dueDate}`;
    await sendNotification(username, message);
};

const notifyTaskCompletion = async (taskTitle, completedBy) => {
    try {
        await db.query(
            `INSERT INTO notifications (username, message) SELECT username, $1 FROM users WHERE role = 'admin'`,
            [`La tarea "${taskTitle}" fue completada por ${completedBy}`]
        );
    } catch (error) {
        console.error('Error notifying admins of task completion:', error);
    }
};

const broadcastNotification = async (message, excludeUsername = null) => {
    try {
        const query = excludeUsername
            ? `INSERT INTO notifications (username, message) SELECT username, $1 FROM users WHERE username != $2`
            : `INSERT INTO notifications (username, message) SELECT username, $1 FROM users`;

        const params = excludeUsername ? [message, excludeUsername] : [message];
        await db.query(query, params);
    } catch (error) {
        console.error('Error broadcasting notification:', error);
    }
};

module.exports = {
    sendNotification,
    notifyTaskAssignment,
    notifyTaskReassignment,
    notifyTaskCompletion,
    broadcastNotification
};
