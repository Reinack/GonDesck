const pool = require('./server/database');

(async () => {
    try {
        const clients = [
            { name: 'Acme Corp', email: 'contacto@acme.com', phone: '+1 555-1234' },
            { name: 'Globex', email: 'info@globex.com', phone: '+1 555-5678' }
        ];

        for (const c of clients) {
            await pool.query('INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING', [c.name, c.email, c.phone]);
        }

        console.log('Clientes de ejemplo creados.');
    } catch (error) {
        console.error('Error creando clientes:', error);
    } finally {
        process.exit();
    }
})();
