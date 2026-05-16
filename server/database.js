const useSQLite = !process.env.DATABASE_URL;

let db;

if (useSQLite) {
    // Local SQLite
    const Database = require('better-sqlite3');
    const path = require('path');
    const dbPath = path.resolve(__dirname, '../data/gondesck.db');
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(dbPath);

    // Crear tablas SQLite
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        );

        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            email TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT NOT NULL,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            assigned_to TEXT,
            client TEXT,
            due_date TEXT,
            status TEXT DEFAULT 'pendiente',
            priority TEXT DEFAULT 'media',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            username TEXT
        );
    `);

    // Migraciones SQLite
    try { db.prepare('ALTER TABLE tasks ADD COLUMN client TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE tasks ADD COLUMN notes TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE notifications ADD COLUMN username TEXT').run(); } catch (e) {}

    console.log('Database initialized (SQLite local)');

    // Wrapper para compatibilidad (promise-based para usar await)
    db.query = (sql, params = []) => {
        return Promise.resolve().then(() => {
            const stmt = db.prepare(sql);
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                return { rows: stmt.all(...params) };
            }
            const info = stmt.run(...params);
            return { rows: info.lastInsertRowid ? [{ id: info.lastInsertRowid }] : [] };
        });
    };

} else {
    // PostgreSQL (Neon/Render)
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Crear tablas PostgreSQL
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

                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    message TEXT NOT NULL,
                    is_read INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    username TEXT
                );
            `);

            try { await pool.query('ALTER TABLE tasks ADD COLUMN client TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE tasks ADD COLUMN notes TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE notifications ADD COLUMN username TEXT'); } catch (e) {}

            console.log('Database initialized (PostgreSQL)');
        } catch (err) {
            console.error('Error initializing PostgreSQL:', err);
        }
    })();

    db = pool;
}

module.exports = db;
