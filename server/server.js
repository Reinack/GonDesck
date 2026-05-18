const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('./database');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// ── Initialize App ───────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// JSON error handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ error: 'JSON malformado' });
    }
    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'gonflow-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ── Helpers ──────────────────────────────────────────────────────
const { logActivity } = require('./helpers/logger');
const { isAuthenticated, isAdmin } = require('./middleware/auth');

// ── Authentication Routes ────────────────────────────────────────

// POST login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            await logActivity(req, 'Inicio de sesión');
            res.json({ success: true, username: user.username, role: user.role });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST logout
app.post('/api/logout', async (req, res) => {
    await logActivity(req, 'Cierre de sesión');
    req.session.destroy();
    res.json({ success: true });
});

// GET check authentication
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, username: req.session.username, role: req.session.role });
    } else {
        res.json({ authenticated: false });
    }
});

// ── Import Route Modules ─────────────────────────────────────────
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');
const clientsRouter = require('./routes/clients');
const projectsRouter = require('./routes/projects');
const pipelineRouter = require('./routes/pipeline');
const meetingsRouter = require('./routes/meetings');
const kbRouter = require('./routes/knowledge-base');
const budgetsRouter = require('./routes/budgets');
const financeRouter = require('./routes/finance');
const logsRouter = require('./routes/logs');

// ── Register Route Modules ───────────────────────────────────────
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/proyectos', projectsRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/reuniones', meetingsRouter);
app.use('/api/kb', kbRouter);
app.use('/api/presupuestos', budgetsRouter);
app.use('/api/finanzas', financeRouter);
app.use('/api/', logsRouter); // Register logs module for /api/logs, /api/notifications

// ── Static Files ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`GonFlow server running on http://localhost:${PORT}`);
});
