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
        CREATE TABLE IF NOT EXISTS proyectos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            client_name TEXT,
            description TEXT,
            status TEXT DEFAULT 'en_curso',
            start_date TEXT,
            end_date TEXT,
            budget REAL DEFAULT 0,
            color TEXT DEFAULT '#60A5FA',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pipeline_deals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            contact_name TEXT NOT NULL,
            amount REAL DEFAULT 0,
            probability INTEGER DEFAULT 50,
            stage TEXT DEFAULT 'prospecto',
            expected_close TEXT,
            source TEXT DEFAULT 'Otro',
            assigned_to TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reuniones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            client_name TEXT NOT NULL,
            type TEXT DEFAULT 'virtual',
            location TEXT,
            link TEXT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            duration INTEGER DEFAULT 60,
            topics TEXT,
            status TEXT DEFAULT 'programada',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

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

        CREATE TABLE IF NOT EXISTS ingresos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            client TEXT,
            category TEXT DEFAULT 'Otro',
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT DEFAULT 'Otro',
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS fin_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            tipo TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, tipo)
        );

        CREATE TABLE IF NOT EXISTS kb_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            author TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS presupuestos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            client_name TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'borrador',
            date TEXT NOT NULL,
            valid_until TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const defaultCats = [
        ['Servicios','ingreso'],['Productos','ingreso'],['Suscripción','ingreso'],['Honorarios','ingreso'],['Otro','ingreso'],
        ['Marketing','gasto'],['Infraestructura','gasto'],['Personal','gasto'],['Herramientas','gasto'],['Suscripciones','gasto'],['Impuestos','gasto'],['Otro','gasto']
    ];
    const insertCat = db.prepare('INSERT OR IGNORE INTO fin_categories (name, tipo, is_default) VALUES (?, ?, 1)');
    defaultCats.forEach(([name, tipo]) => insertCat.run(name, tipo));

    // Migraciones SQLite
    try { db.prepare('ALTER TABLE tasks ADD COLUMN client TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE tasks ADD COLUMN notes TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE notifications ADD COLUMN username TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE clients ADD COLUMN logo_url TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE clients ADD COLUMN instagram_url TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE clients ADD COLUMN description TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE users ADD COLUMN photo_url TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE presupuestos ADD COLUMN pdf_url TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE reuniones ADD COLUMN created_by TEXT').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE tasks ADD COLUMN project_id INTEGER').run(); } catch (e) {}
    try { db.prepare('ALTER TABLE kb_articles ADD COLUMN pdf_url TEXT').run(); } catch (e) {}

    // Auto-seed: crear admin si no hay usuarios
    const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get();
    if (userCount.n === 0) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
        console.log('Usuario admin creado automáticamente (admin/admin123)');
    }

    console.log('Database initialized (SQLite local)');

    // Wrapper para compatibilidad (promise-based para usar await)
    db.query = (sql, params = []) => {
        return Promise.resolve().then(() => {
            const stmt = db.prepare(sql.replace(/\$\d+/g, '?'));
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
                CREATE TABLE IF NOT EXISTS proyectos (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    client_name TEXT,
                    description TEXT,
                    status TEXT DEFAULT 'en_curso',
                    start_date TEXT,
                    end_date TEXT,
                    budget REAL DEFAULT 0,
                    color TEXT DEFAULT '#60A5FA',
                    created_at TIMESTAMP DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS pipeline_deals (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    contact_name TEXT NOT NULL,
                    amount REAL DEFAULT 0,
                    probability INTEGER DEFAULT 50,
                    stage TEXT DEFAULT 'prospecto',
                    expected_close TEXT,
                    source TEXT DEFAULT 'Otro',
                    assigned_to TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS reuniones (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    client_name TEXT NOT NULL,
                    type TEXT DEFAULT 'virtual',
                    location TEXT,
                    link TEXT,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    duration INTEGER DEFAULT 60,
                    topics TEXT,
                    status TEXT DEFAULT 'programada',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );

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

                CREATE TABLE IF NOT EXISTS ingresos (
                    id SERIAL PRIMARY KEY,
                    description TEXT NOT NULL,
                    amount REAL NOT NULL,
                    client TEXT,
                    category TEXT DEFAULT 'Otro',
                    date TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS gastos (
                    id SERIAL PRIMARY KEY,
                    description TEXT NOT NULL,
                    amount REAL NOT NULL,
                    category TEXT DEFAULT 'Otro',
                    date TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS fin_categories (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    tipo TEXT NOT NULL,
                    is_default INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(name, tipo)
                );

                CREATE TABLE IF NOT EXISTS kb_articles (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    category TEXT DEFAULT 'General',
                    author TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS presupuestos (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    client_name TEXT NOT NULL,
                    amount REAL NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'borrador',
                    date TEXT NOT NULL,
                    valid_until TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);

            const defaultCats = [
                ['Servicios','ingreso'],['Productos','ingreso'],['Suscripción','ingreso'],['Honorarios','ingreso'],['Otro','ingreso'],
                ['Marketing','gasto'],['Infraestructura','gasto'],['Personal','gasto'],['Herramientas','gasto'],['Suscripciones','gasto'],['Impuestos','gasto'],['Otro','gasto']
            ];
            for (const [name, tipo] of defaultCats) {
                await pool.query('INSERT INTO fin_categories (name, tipo, is_default) VALUES ($1, $2, 1) ON CONFLICT (name, tipo) DO NOTHING', [name, tipo]);
            }

            try { await pool.query('ALTER TABLE tasks ADD COLUMN client TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE tasks ADD COLUMN notes TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE notifications ADD COLUMN username TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE clients ADD COLUMN logo_url TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE presupuestos ADD COLUMN pdf_url TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE reuniones ADD COLUMN created_by TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE tasks ADD COLUMN project_id INTEGER'); } catch (e) {}
            try { await pool.query('ALTER TABLE kb_articles ADD COLUMN pdf_url TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE clients ADD COLUMN instagram_url TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE clients ADD COLUMN description TEXT'); } catch (e) {}
            try { await pool.query('ALTER TABLE users ADD COLUMN photo_url TEXT'); } catch (e) {}

            console.log('Database initialized (PostgreSQL)');
        } catch (err) {
            console.error('Error initializing PostgreSQL:', err);
        }
    })();

    db = pool;
}

module.exports = db;
