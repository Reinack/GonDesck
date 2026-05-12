const db = require('./server/database');
const users = db.prepare('SELECT * FROM users').all();
console.log('Usuarios:', users);
process.exit();
