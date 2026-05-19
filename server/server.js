const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const fs = require('fs');

// ── Initialize App ───────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'gonflow-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ── Import Route Modules ─────────────────────────────────────────
const authRouter    = require('./routes/auth');
const tasksRouter   = require('./routes/tasks');
const usersRouter   = require('./routes/users');
const clientsRouter = require('./routes/clients');
const projectsRouter= require('./routes/projects');
const pipelineRouter= require('./routes/pipeline');
const meetingsRouter= require('./routes/meetings');
const kbRouter      = require('./routes/knowledge-base');
const budgetsRouter = require('./routes/budgets');
const financeRouter = require('./routes/finance');
const logsRouter    = require('./routes/logs');
const errorHandler  = require('./middleware/errorHandler');

// ── Register Route Modules ───────────────────────────────────────
app.use('/api', authRouter);            // /api/login, /api/logout, /api/check-auth
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/proyectos', projectsRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/reuniones', meetingsRouter);
app.use('/api/kb', kbRouter);
app.use('/api/presupuestos', budgetsRouter);
app.use('/api/finanzas', financeRouter);
app.use('/api', logsRouter);            // /api/logs, /api/notifications

// ── Static Files ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── Centralized Error Handler (must be last) ─────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`GonFlow server running on http://localhost:${PORT}`);
});
