const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'No autorizado' });
};

const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de administrador' });
};

module.exports = { isAuthenticated, isAdmin };
