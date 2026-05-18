const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('./database');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const { isAuthenticated, isAdmin } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const usersRoutes = require('./routes/users');
const clientsRoutes = require('./routes/clients');
const projectsRoutes = require('./routes/projects');
const pipelineRoutes = require('./routes/pipeline');
const meetingsRoutes = require('./routes/meetings');
const kbRoutes = require('./routes/knowledge-base');
const budgetsRoutes = require('./routes/budgets');
const financeRoutes = require('./routes/finance');
const logsRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Error handler for malformed JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ error: 'JSON malformado' });
    }
    next();
});

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'gonflow-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// API Routes - Organized by domain
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/proyectos', projectsRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/reuniones', meetingsRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/presupuestos', budgetsRoutes);
app.use('/api/finanzas', financeRoutes);
app.use('/api/logs', logsRoutes);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Centralized error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`GonFlow server running on http://localhost:${PORT}`);
});
