const db = require('./server/database');
const bcrypt = require('bcryptjs');

const newPassword = 'admin123';
const hashedPassword = bcrypt.hashSync(newPassword, 10);

try {
    const info = db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, 'admin');
    if (info.changes > 0) {
        console.log('Contraseña de admin restablecida a: ' + newPassword);
    } else {
        console.log('No se encontró el usuario admin.');
    }
} catch (e) {
    console.error('Error al restablecer la contraseña:', e);
}

process.exit();
