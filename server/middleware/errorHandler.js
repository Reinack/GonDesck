const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // JSON parsing errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'JSON malformado' });
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'Archivo muy grande' });
        }
        return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
    }

    // Custom validation errors
    if (err.status && err.message) {
        return res.status(err.status).json({ error: err.message });
    }

    // Default 500 error
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorHandler;
