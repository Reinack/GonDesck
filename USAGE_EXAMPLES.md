# Ejemplos de Uso de las API Routes

## Autenticación

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```
Response:
```json
{
  "success": true,
  "username": "admin",
  "role": "admin"
}
```

### Check Auth
```bash
curl -X GET http://localhost:3000/api/check-auth
```

### Logout
```bash
curl -X POST http://localhost:3000/api/logout
```

---

## Tasks

### Obtener todas las tareas
```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Crear tarea
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "title": "Diseñar logo",
    "description": "Logo para cliente XYZ",
    "assigned_to": "maria",
    "client": "XYZ Corp",
    "due_date": "2026-06-01",
    "status": "pendiente",
    "priority": "alta",
    "notes": "Usar colores corporativos"
  }'
```

### Actualizar tarea
```bash
curl -X PUT http://localhost:3000/api/tasks/123 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "title": "Diseñar logo v2",
    "status": "en_progreso",
    "assigned_to": "maria"
  }'
```

### Marcar tarea como completada
```bash
curl -X PUT http://localhost:3000/api/tasks/123 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "status": "completada"
  }'
```

### Eliminar tarea
```bash
curl -X DELETE http://localhost:3000/api/tasks/123 \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Obtener estadísticas de tareas
```bash
curl -X GET http://localhost:3000/api/tasks/stats/all \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

---

## Users (Admin Only)

### Obtener todos los usuarios
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

### Crear usuario
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "username": "juanperez",
    "password": "segura123",
    "role": "user"
  }'
```

### Actualizar usuario
```bash
curl -X PUT http://localhost:3000/api/users/5 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "username": "juan.perez",
    "role": "admin"
  }'
```

### Resetear contraseña
```bash
curl -X PUT http://localhost:3000/api/users/5/password \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "password": "nuevapassword123"
  }'
```

### Subir foto de perfil
```bash
curl -X POST http://localhost:3000/api/users/5/photo \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -F "photo=@/path/to/photo.jpg"
```

### Eliminar usuario
```bash
curl -X DELETE http://localhost:3000/api/users/5 \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

---

## Clients

### Obtener clientes
```bash
curl -X GET http://localhost:3000/api/clients \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Crear cliente
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "name": "Acme Corporation",
    "email": "info@acme.com",
    "phone": "+1-555-0123"
  }'
```

### Actualizar cliente
```bash
curl -X PUT http://localhost:3000/api/clients/10 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "name": "Acme Corp",
    "instagram_url": "https://instagram.com/acmecorp",
    "description": "Empresa de tecnología"
  }'
```

### Subir logo
```bash
curl -X POST http://localhost:3000/api/clients/10/logo \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -F "logo=@/path/to/logo.png"
```

### Eliminar cliente
```bash
curl -X DELETE http://localhost:3000/api/clients/10 \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

---

## Projects

### Obtener proyectos
```bash
curl -X GET http://localhost:3000/api/proyectos \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Crear proyecto
```bash
curl -X POST http://localhost:3000/api/proyectos \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "name": "Rediseño Web",
    "client_name": "Acme Corp",
    "description": "Actualizar sitio web",
    "status": "en_curso",
    "start_date": "2026-05-01",
    "end_date": "2026-07-01",
    "budget": 15000,
    "color": "#FF6B6B"
  }'
```

### Actualizar proyecto
```bash
curl -X PUT http://localhost:3000/api/proyectos/2 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "status": "completado",
    "budget": 16000
  }'
```

### Eliminar proyecto
```bash
curl -X DELETE http://localhost:3000/api/proyectos/2 \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

---

## Pipeline (Sales)

### Obtener deals
```bash
curl -X GET http://localhost:3000/api/pipeline \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Crear deal
```bash
curl -X POST http://localhost:3000/api/pipeline \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "title": "Propuesta freelance",
    "contact_name": "Carlos García",
    "amount": 5000,
    "probability": 75,
    "stage": "propuesta",
    "expected_close": "2026-06-15",
    "source": "LinkedIn",
    "assigned_to": "maria"
  }'
```

### Mover a siguiente etapa
```bash
curl -X PATCH http://localhost:3000/api/pipeline/7/stage \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "stage": "negociando"
  }'
```

### Marcar como ganado
```bash
curl -X PATCH http://localhost:3000/api/pipeline/7/stage \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "stage": "ganado"
  }'
```

---

## Meetings

### Obtener reuniones
```bash
curl -X GET http://localhost:3000/api/reuniones \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Crear reunión
```bash
curl -X POST http://localhost:3000/api/reuniones \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "title": "Kick-off meeting",
    "client_name": "Acme Corp",
    "type": "virtual",
    "link": "https://meet.google.com/xyz",
    "date": "2026-05-25",
    "time": "14:00",
    "duration": 60,
    "topics": "Requerimientos del proyecto",
    "status": "programada"
  }'
```

### Cambiar estado a realizada
```bash
curl -X PATCH http://localhost:3000/api/reuniones/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "status": "realizada"
  }'
```

---

## Knowledge Base

### Obtener artículos
```bash
curl -X GET http://localhost:3000/api/kb \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Crear artículo
```bash
curl -X POST http://localhost:3000/api/kb \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "title": "Cómo usar Git",
    "content": "# Git Basics\n\n## Clone\n...",
    "category": "Desarrollo"
  }'
```

### Actualizar artículo
```bash
curl -X PUT http://localhost:3000/api/kb/3 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "title": "Git y GitHub",
    "content": "Contenido actualizado"
  }'
```

### Subir PDF
```bash
curl -X POST http://localhost:3000/api/kb/3/pdf \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -F "pdf=@/path/to/guide.pdf"
```

---

## Budgets

### Obtener presupuestos
```bash
curl -X GET http://localhost:3000/api/presupuestos \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

### Crear presupuesto
```bash
curl -X POST http://localhost:3000/api/presupuestos \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "title": "Presupuesto Web",
    "client_name": "Acme Corp",
    "amount": 12000,
    "description": "Diseño y desarrollo sitio web",
    "date": "2026-05-18",
    "valid_until": "2026-05-25",
    "status": "borrador"
  }'
```

### Enviar presupuesto
```bash
curl -X PATCH http://localhost:3000/api/presupuestos/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "status": "enviado"
  }'
```

### Marcar como aceptado
```bash
curl -X PATCH http://localhost:3000/api/presupuestos/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "status": "aceptado"
  }'
```

### Subir PDF
```bash
curl -X POST http://localhost:3000/api/presupuestos/1/pdf \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -F "pdf=@/path/to/budget.pdf"
```

---

## Finance

### Obtener categorías
```bash
curl -X GET http://localhost:3000/api/finanzas/categorias \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

### Crear categoría de ingreso
```bash
curl -X POST http://localhost:3000/api/finanzas/categorias \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "name": "Servicios",
    "tipo": "ingreso"
  }'
```

### Registrar ingreso
```bash
curl -X POST http://localhost:3000/api/finanzas/ingresos \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "description": "Pago proyecto web",
    "amount": 5000,
    "client": "Acme Corp",
    "category": "Servicios",
    "date": "2026-05-18"
  }'
```

### Obtener gastos
```bash
curl -X GET http://localhost:3000/api/finanzas/gastos \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

### Registrar gasto
```bash
curl -X POST http://localhost:3000/api/finanzas/gastos \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION" \
  -d '{
    "description": "Dominio anual",
    "amount": 120,
    "category": "Infraestructura",
    "date": "2026-05-18"
  }'
```

---

## Logs & Notifications

### Obtener logs (Admin)
```bash
curl -X GET http://localhost:3000/api/logs \
  -H "Cookie: connect.sid=YOUR_ADMIN_SESSION"
```

### Obtener notificaciones no leídas
```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Obtener todas las notificaciones
```bash
curl -X GET http://localhost:3000/api/notifications/all \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Marcar notificaciones como leídas
```bash
curl -X POST http://localhost:3000/api/notifications/read \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

---

## Tips y Trucos

### Con cURL y jq
```bash
# Login y guardar session
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"admin","password":"pass"}'

# Usar cookies en siguiente request
curl -X GET http://localhost:3000/api/tasks \
  -b cookies.txt | jq '.'
```

### Con Postman
1. Importar collection desde ejemplos
2. Configurar variable `base_url = http://localhost:3000`
3. Pre-request Script para auth
4. Tests para validar respuestas

### Con Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true
});

// Login
const { data } = await api.post('/login', {
  username: 'admin',
  password: 'password'
});

// Get tasks
const tasks = await api.get('/tasks');
console.log(tasks.data);
```

---

## Códigos de Estado Comunes

| Código | Significado |
|--------|------------|
| 200 | OK - Operación exitosa |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No logueado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Server Error - Error interno |

---

Última actualización: May 18, 2026
