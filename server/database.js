const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Crear tablas
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT DEFAULT 'user'
            );

            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                email TEXT,
                phone TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                username TEXT,
                action TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                assigned_to TEXT,
                client TEXT,
                due_date TEXT,
                status TEXT DEFAULT 'pendiente',
                priority TEXT DEFAULT 'media',
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                message TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                username TEXT
            );
        `);

        // Migraciones
        try { await pool.query('ALTER TABLE tasks ADD COLUMN client TEXT'); } catch (e) {}
        try { await pool.query('ALTER TABLE tasks ADD COLUMN notes TEXT'); } catch (e) {}
        try { await pool.query('ALTER TABLE notifications ADD COLUMN username TEXT'); } catch (e) {}

        // Crear usuario admin si no existe
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) === 0) {
            const bcrypt = require('bcryptjs');
            const adminPassword = bcrypt.hashSync('admin123', 10);
            await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', ['admin', adminPassword, 'admin']);
            console.log('Usuario administrador creado: admin / admin123');
        }

        console.log('Database initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
})();

module.exports = pool;
