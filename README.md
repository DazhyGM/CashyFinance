# Finanzas Personales 💰

Sistema local de control financiero personal. Vue 3 + Node/Express + MySQL (XAMPP).

---

## Requisitos previos

- [XAMPP](https://www.apachefriends.org/) instalado (solo necesitas MySQL)
- [Node.js](https://nodejs.org/) v18 o superior
- npm (viene con Node)

---

## 1. Base de datos

1. Abre XAMPP y enciende solo **MySQL**
2. Entra a **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Crea una nueva base de datos llamada `finanzas_personales` (o ejecuta el script)
4. Ve a la pestaña **SQL** y pega el contenido de `finanzas.sql`
5. Ejecuta → listo ✓

---

## 2. Backend (Node + Express)

```bash
# Entra a la carpeta del servidor
cd server

# Instala dependencias
npm install

# Crea tu archivo .env copiando el ejemplo
copy .env.example .env
# (En macOS/Linux: cp .env.example .env)

# Edita .env si tu MySQL tiene contraseña
# Por defecto XAMPP no tiene contraseña, así que DB_PASSWORD queda vacío

# Inicia el servidor
npm run dev
```

El servidor corre en `http://localhost:3001`
Verifica que funciona en `http://localhost:3001/api/health`

---

## 3. Frontend (Vue 3 + Vite)

```bash
# En otra terminal, entra a la carpeta del cliente
cd client

# Instala dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev
```

La app corre en `http://localhost:5173`

---

## Estructura del proyecto

```
finanzas/
├── finanzas.sql          ← Script de base de datos
├── server/               ← Backend Node + Express
│   ├── index.js          ← Entrada del servidor
│   ├── db.js             ← Conexión MySQL
│   ├── recurrencia.js    ← Motor de gastos automáticos
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── ingresos.js
│       ├── gastos.js
│       ├── deudas.js
│       └── dashboard.js
└── client/               ← Frontend Vue 3
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.js
        ├── App.vue
        ├── api/index.js      ← Axios configurado
        ├── router/index.js
        ├── stores/auth.js    ← Pinia store
        ├── styles/main.css
        ├── components/
        │   ├── AppLayout.vue       ← Sidebar + layout
        │   └── MovimientoModal.vue ← Modal nuevo/editar
        └── views/
            ├── Login.vue
            ├── Dashboard.vue
            ├── Movimientos.vue
            └── Historial.vue
```

---

## Uso diario

1. Enciende **MySQL** en XAMPP
2. Terminal 1: `cd server && npm run dev`
3. Terminal 2: `cd client && npm run dev`
4. Abre `http://localhost:5173`

---

## Cómo funciona la recurrencia

Al cargar el dashboard del mes actual, el sistema automáticamente genera
todos los registros pendientes de gastos y deudas recurrentes:

- **Diario**: crea un registro por cada día desde la fecha de inicio hasta hoy
- **Semanal**: cada 7 días desde la fecha de inicio
- **Mensual sin día específico**: el mismo día del mes cada mes
- **Mensual con día específico**: el día elegido (ej: día 20) de cada mes

Los registros se guardan en `registros_automaticos` con una clave única
por (tipo, referencia_id, fecha), así nunca se duplican.

Al inicio de cada mes el dashboard arranca en cero automáticamente
porque filtra por el mes activo. El historial de meses anteriores
siempre está disponible en la vista Historial.
