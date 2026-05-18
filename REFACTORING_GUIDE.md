# Guía de Refactorización de Rutas

## Objetivo
Dividir el archivo `server.js` monolítico (937 líneas) en 10 módulos modulares y mantenibles.

## Problemas Resueltos

### Antes de la Refactorización
- Archivo `server.js` con 937 líneas
- Todas las rutas definidas en un solo archivo
- Difícil de mantener y debugear
- Imposible hacer testing individual de rutas
- Problemas de rendimiento en lecturas/escrituras

### Después de la Refactorización
- `server.js` con solo 109 líneas
- 10 módulos de rutas independientes
- Código limpio y organizado
- Cada router es testeable individualmente
- Mejor performance y escalabilidad

---

## Estructura de Módulos

### server.js - Punto de Entrada
```javascript
const express = require('express');
const app = express();

// Middleware global
app.use(cors());
app.use(express.json());
app.use(session({...}));

// Rutas de autenticación
app.post('/api/login', ...);
app.post('/api/logout', ...);
app.get('/api/check-auth', ...);

// Importar routers
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');
// ... más routers

// Registrar routers
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
// ... más registros

// Archivos estáticos
app.use(express.static(...));

// Start server
app.listen(PORT, ...);
```

### Cada Router (ej: routes/tasks.js)
```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/logger');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/tasks
router.get('/', isAuthenticated, async (req, res) => {
    // Lógica aquí
});

// POST /api/tasks
router.post('/', isAuthenticated, async (req, res) => {
    // Lógica aquí
});

// ... más rutas

module.exports = router;
```

---

## Beneficios de esta Arquitectura

### 1. Mantenibilidad
- Cada módulo tiene una responsabilidad clara
- Fácil encontrar y modificar rutas específicas
- Cambios localizados sin afectar otros módulos

### 2. Testing
- Posibilidad de testear cada router independientemente
- Fácil crear mocks de dependencias
- Tests más rápidos y precisos

### 3. Escalabilidad
- Agregar nuevos routers sin tocar server.js
- Estructura preparada para crecimiento
- Código modular y reutilizable

### 4. Rendimiento
- Carga selectiva de módulos
- Mejor gestión de memoria
- Cacheo eficiente

### 5. Colaboración
- Múltiples desarrolladores pueden trabajar simultáneamente
- Menos conflictos de merge en git
- Código más limpio para code review

---

## Cómo Agregar Nuevas Rutas

### Opción 1: Nuevo Router
Si necesitas rutas para un nuevo recurso:

1. Crea `server/routes/nuevo.js`:
```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/logger');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    // Tu lógica
});

module.exports = router;
```

2. En `server.js` agrega:
```javascript
const nuevoRouter = require('./routes/nuevo');
app.use('/api/nuevo', nuevoRouter);
```

### Opción 2: Extender Router Existente
Si necesitas agregar rutas a un router existente:

```javascript
// En routes/tasks.js, agrega al final:
router.get('/report', isAuthenticated, async (req, res) => {
    // Nueva ruta: GET /api/tasks/report
});
```

---

## Patrones Comunes

### Autenticación
```javascript
// Requiere login
router.get('/', isAuthenticated, async (req, res) => { });

// Requiere login + admin
router.post('/', isAuthenticated, isAdmin, async (req, res) => { });
```

### Logging de Actividades
```javascript
await logActivity(req, 'Acción realizada', {
    recurso: 'tarea',
    id: 123,
    dato: valor
});
```

### Manejo de Errores
```javascript
try {
    const result = await db.query('SELECT * FROM tabla');
    res.json(result.rows);
} catch (error) {
    res.status(500).json({ error: error.message });
}
```

### Validaciones
```javascript
const { id } = req.params;
const { name, email } = req.body;

if (!name) return res.status(400).json({ error: 'Nombre requerido' });
```

---

## Dependencias de Cada Router

| Router | Dependencias | Autenticación |
|--------|-------------|---------------|
| tasks | db, logActivity | isAuthenticated |
| users | db, bcrypt, multer, logActivity | isAuthenticated, isAdmin |
| clients | db, multer, logActivity | isAuthenticated, isAdmin |
| projects | db, logActivity | isAuthenticated, isAdmin |
| pipeline | db, logActivity | isAuthenticated |
| meetings | db, logActivity | isAuthenticated |
| knowledge-base | db, multer, logActivity | isAuthenticated, isAdmin |
| budgets | db, multer, logActivity | isAuthenticated, isAdmin |
| finance | db, logActivity | isAuthenticated, isAdmin |
| logs | db, (ninguna otra) | isAuthenticated, isAdmin |

---

## Archivos Helper Utilizados

### helpers/logger.js (Nuevo)
- `logActivity(req, action, details)` - Registra actividades de usuario

### helpers/fileHandler.js (Existente)
- `uploadImage` - Multer config para imágenes
- `uploadPdf` - Multer config para PDFs
- `deleteFile` - Eliminar archivo del servidor
- `getUploadUrl` - Generar URL de archivo

### middleware/auth.js (Existente)
- `isAuthenticated` - Middleware de autenticación
- `isAdmin` - Middleware de permisos admin

---

## Migración de Código Existente

Si tienes rutas en otro lugar, puedes migrarlas así:

### De app.get() a router.get()
```javascript
// Antes
app.get('/api/tareas', isAuthenticated, async (req, res) => {
    // lógica
});

// Después (en routes/tasks.js)
router.get('/', isAuthenticated, async (req, res) => {
    // lógica (misma)
});
```

### Nota sobre rutas base
- En `server.js`: `app.use('/api/tasks', tasksRouter)`
- En `routes/tasks.js`: `router.get('/')` equivale a `GET /api/tasks`

---

## Testing de Routers

### Con Jest/Supertest
```javascript
const request = require('supertest');
const app = require('../server');

describe('Tasks Router', () => {
    it('should get all tasks', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Cookie', 'connect.sid=...');
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
```

### Con Postman
1. Importar collection
2. Configurar variables de entorno
3. Ejecutar requests por router
4. Verificar respuestas

---

## Checklist para Nuevos Routers

Cuando crees un nuevo router, verifica:

- [ ] Archivo creado en `/server/routes/`
- [ ] Importa `express`, `router`, `db`
- [ ] Importa helpers necesarios (`logActivity`, multer, etc.)
- [ ] Importa middleware (`isAuthenticated`, `isAdmin`)
- [ ] Todas las rutas usan `router.method()` no `app.method()`
- [ ] Termina con `module.exports = router;`
- [ ] Registrado en `server.js` con `app.use()`
- [ ] Validación de sintaxis: `node -c routes/nuevo.js`
- [ ] Documentado en `ROUTES_SUMMARY.md`
- [ ] Testing completado

---

## Troubleshooting

### Error: Cannot find module
```
Error: Cannot find module './routes/tasks'
```
**Solución**: Verifica que el archivo existe y que el path es correcto.

### Error: isAuthenticated is not a function
```
Error: isAuthenticated is not a function
```
**Solución**: Verifica que importas correctamente:
```javascript
const { isAuthenticated, isAdmin } = require('../middleware/auth');
```

### Error: db.query is not a function
```
Error: db.query is not a function
```
**Solución**: Verifica que importas la instancia correcta:
```javascript
const db = require('../database');
```

### Las rutas no están disponibles
**Solución**: Verifica que registraste el router en `server.js`:
```javascript
app.use('/api/tasks', tasksRouter); // Importante el path base
```

---

## Performance Tips

1. **Lazy Loading**: Solo carga routers cuando sea necesario
2. **Caching**: Implementa caching para queries frecuentes
3. **Paginación**: Para listas grandes, implementa paginación
4. **Índices DB**: Asegura que las columnas usadas en WHERE tengan índices
5. **Connection Pooling**: Usa pool de conexiones en database.js

---

## Mantenimiento Futuro

### Cuando agregar un nuevo router
- Si hay > 30 rutas en un mismo resource
- Si el archivo > 500 líneas
- Si múltiples equipos necesitan trabajar en paralelo

### Cuando refactorizar un router
- Si tiene > 100 líneas
- Si hay duplicación de código
- Si hay mezcla de responsabilidades

### Deprecación de rutas
1. Documenta la ruta antigua como deprecated
2. Redirige a la nueva ruta con status 301
3. Mantén soporte por 2-3 versiones
4. Elimina después de notificar clientes

---

## Referencias Útiles

- [Express Router Docs](https://expressjs.com/en/api/router.html)
- [Node.js Modules](https://nodejs.org/api/modules.html)
- [RESTful API Design](https://restfulapi.net/)
- [Authentication Best Practices](https://owasp.org/www-community/authentication/)

---

Última actualización: May 18, 2026
Versión: 1.0
Autor: Refactoring Team
