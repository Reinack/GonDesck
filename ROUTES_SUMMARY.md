# Routes Refactoring Summary

## Overview
El archivo `server.js` ha sido refactorizado dividiendo todas las rutas en 10 módulos separados ubicados en `/server/routes/`.

## Archivos de Rutas Creados

### 1. **tasks.js** - Gestión de Tareas
- `GET /api/tasks` - Obtener todas las tareas
- `POST /api/tasks` - Crear nueva tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea
- `GET /api/tasks/stats/all` - Obtener estadísticas de tareas

**Funcionalidades:**
- Filtrado por usuario/admin
- Notificaciones al asignar tareas
- Tracking de cambios de estado

---

### 2. **users.js** - Gestión de Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario
- `PUT /api/users/:id/password` - Resetear contraseña
- `POST /api/users/:id/photo` - Subir foto de perfil

**Funcionalidades:**
- Encriptación de contraseñas con bcryptjs
- Manejo de fotos de perfil
- Validación de nombres únicos

---

### 3. **clients.js** - Gestión de Clientes
- `GET /api/clients` - Obtener todos los clientes
- `POST /api/clients` - Crear nuevo cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente
- `POST /api/clients/:id/logo` - Subir logo de cliente

**Funcionalidades:**
- Información de contacto
- URLs de redes sociales
- Manejo de logos

---

### 4. **projects.js** - Gestión de Proyectos
- `GET /api/proyectos` - Obtener todos los proyectos
- `POST /api/proyectos` - Crear nuevo proyecto
- `PUT /api/proyectos/:id` - Actualizar proyecto
- `DELETE /api/proyectos/:id` - Eliminar proyecto

**Funcionalidades:**
- Estados de proyecto (en_curso, completado, etc.)
- Presupuesto y fechas
- Colores personalizados

---

### 5. **pipeline.js** - Pipeline de Ventas
- `GET /api/pipeline` - Obtener todos los deals
- `POST /api/pipeline` - Crear nuevo deal
- `PUT /api/pipeline/:id` - Actualizar deal
- `PATCH /api/pipeline/:id/stage` - Cambiar etapa del deal
- `DELETE /api/pipeline/:id` - Eliminar deal

**Etapas válidas:**
- prospecto
- contactado
- propuesta
- negociando
- ganado
- perdido

---

### 6. **meetings.js** - Gestión de Reuniones
- `GET /api/reuniones` - Obtener reuniones
- `POST /api/reuniones` - Crear reunión
- `PUT /api/reuniones/:id` - Actualizar reunión
- `PATCH /api/reuniones/:id/status` - Cambiar estado
- `DELETE /api/reuniones/:id` - Eliminar reunión

**Estados válidos:**
- programada
- realizada
- cancelada

---

### 7. **knowledge-base.js** - Base de Conocimiento
- `GET /api/kb` - Obtener artículos
- `GET /api/kb/:id` - Obtener un artículo
- `POST /api/kb` - Crear artículo
- `PUT /api/kb/:id` - Actualizar artículo
- `POST /api/kb/:id/pdf` - Subir PDF
- `DELETE /api/kb/:id/pdf` - Eliminar PDF
- `DELETE /api/kb/:id` - Eliminar artículo

---

### 8. **budgets.js** - Presupuestos
- `GET /api/presupuestos` - Obtener presupuestos
- `POST /api/presupuestos` - Crear presupuesto
- `PUT /api/presupuestos/:id` - Actualizar presupuesto
- `PATCH /api/presupuestos/:id/status` - Cambiar estado
- `DELETE /api/presupuestos/:id` - Eliminar presupuesto
- `POST /api/presupuestos/:id/pdf` - Subir PDF
- `DELETE /api/presupuestos/:id/pdf` - Eliminar PDF

**Estados válidos:**
- borrador
- enviado
- aceptado
- rechazado
- vencido

---

### 9. **finance.js** - Finanzas
Incluye 3 secciones principales:

#### Categorías (`/api/finanzas/categorias`)
- `GET` - Obtener categorías
- `POST` - Crear categoría
- `DELETE /:id` - Eliminar categoría

#### Ingresos (`/api/finanzas/ingresos`)
- `GET` - Obtener ingresos
- `POST` - Registrar ingreso
- `PUT /:id` - Actualizar ingreso
- `DELETE /:id` - Eliminar ingreso

#### Gastos (`/api/finanzas/gastos`)
- `GET` - Obtener gastos
- `POST` - Registrar gasto
- `PUT /:id` - Actualizar gasto
- `DELETE /:id` - Eliminar gasto

---

### 10. **logs.js** - Logs y Notificaciones
- `GET /api/logs` - Obtener logs de actividad (Admin)
- `GET /api/notifications` - Obtener notificaciones no leídas
- `GET /api/notifications/all` - Obtener todas las notificaciones
- `POST /api/notifications/read` - Marcar como leídas

---

## Estructura de Autenticación

### Middleware
- **isAuthenticated**: Valida que el usuario esté logueado
- **isAdmin**: Valida que el usuario sea administrador

### Rutas públicas (sin autenticación)
- `POST /api/login`
- `POST /api/logout`
- `GET /api/check-auth`

---

## Helpers Utilizados

### logger.js
```javascript
const { logActivity } = require('./helpers/logger');
```
Registra todas las actividades de usuarios en la base de datos.

### fileHandler.js
Incluye:
- `uploadImage` - Multer para imágenes
- `uploadPdf` - Multer para PDFs
- `deleteFile` - Eliminar archivos
- `getUploadUrl` - Generar URLs

---

## Cambios en server.js

### Antes
- Todas las rutas definidas directamente en server.js (937 líneas)
- Difícil mantenimiento y debugging
- Lógica mezclada

### Después
- Solo define autenticación y puntos de entrada (109 líneas)
- Importa 10 routers modulares
- Código limpio y organizado
- Más fácil de mantener y escalar

---

## Requisitos de Importación

Cada archivo router requiere:
```javascript
const express = require('express');
const router = express.Router();
const db = require('../database');
const { logActivity } = require('../helpers/logger');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
```

---

## Rutas de Uploads

Los archivos se guardan en: `/public/uploads/`

Formatos soportados:
- **Imágenes**: jpg, jpeg, png, gif (máx 5MB)
- **PDFs**: pdf (máx 15MB)

---

## Testing de Rutas

Ejemplo con curl:

```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Get tasks
curl -X GET http://localhost:3000/api/tasks \
  -H "Cookie: connect.sid=..." 

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{"title":"Nueva tarea","assigned_to":"usuario","status":"pendiente"}'
```

---

## Notas Importantes

1. **Todas las rutas heredan** las funcionalidades de autenticación y logging
2. **Los PDFs se guardan** en formato: `pres-{timestamp}-{random}.pdf`
3. **Las imágenes se guardan** en formato: `{timestamp}-{random}.{ext}`
4. **Validaciones de estado** están implementadas en cada router
5. **Las notificaciones** se crean automáticamente al asignar tareas

---

Generado: May 18, 2026
