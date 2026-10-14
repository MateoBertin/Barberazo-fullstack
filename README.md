# 💈 Barberazo - Sistema Fullstack de Gestión de Turnos

Sistema para gestión de turnos, clientes, empleados y servicios de barbería. Materia Desarrollo de Software, Ingeniería en Sistemas (2026).

> Estado real (verificado en código): el backend implementa solo autenticación (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`). El resto (turnos, servicios, empleados, multas, reseñas, calendario) funciona hoy en el frontend con `localStorage` + fallback a mocks si el backend no está corriendo (`web/src/context/AuthContext.jsx`, `web/src/context/DataContext.jsx`).

---

## Stack

- **Frontend (`/web`):** React 18.2, Vite 5, Material UI 5.15, React Router 6.22, Emotion 11, notistack 3, lucide-react.
- **Backend (`/api`):** Node.js, Express 5, mysql2 (pool), jsonwebtoken, bcrypt, dotenv, cors. Dev: nodemon.
- **DB:** MySQL 8, base `dsw` (`utf8mb4`), script canónico `api/database/init_barberazo.sql`.

---

## Requisitos

- Node.js 18+ y npm.
- MySQL 8 + MySQL Workbench (o cliente compatible).

---

## Estructura del repositorio

```text
/
├── api/
│   ├── index.js                    # Express, PORT 3000, monta /api/auth
│   ├── config/db.js                # Pool mysql2, defaults: localhost:3306, dsw
│   ├── routes/authRoutes.js        # register, login, profile
│   ├── controllers/authController.js
│   ├── services/authService.js     # bcrypt + JWT, alta en usuarios + clientes
│   ├── middleware/authMiddleware.js # Bearer JWT
│   └── database/
│       ├── init_barberazo.sql      # Canónico: crea dsw, 9 tablas + seed
│       └── schema.sql              # Obsoleto: no usar (crea barberia mínima)
└── web/
    ├── vite.config.js              # Puerto 5173 + proxy /api -> localhost:3000
    └── src/
        ├── App.jsx                 # Rutas públicas y protegidas por rol
        ├── main.jsx                # ThemeProvider + AuthProvider + DataProvider
        ├── theme.js
        ├── pages/
        │   ├── LandingPage.jsx, LoginPage.jsx, RegisterPage.jsx
        │   ├── ForgotPasswordPage.jsx, ReviewsPage.jsx
        │   ├── client/ (ClientDashboard, ClientFinesPage, ClientProfilePage)
        │   ├── owner/ (OwnerDashboard, ServicesPage, EmployeesPage, ClientsPage, DatesPage)
        │   └── employee/ (EmployeeDashboard)
        ├── components/
        │   ├── common/ (Navbar, ProtectedRoute, RoleGuard)
        │   ├── booking/ (BookingWizard)
        │   ├── turnos/ (TurnosManager)
        │   ├── fines/ (MercadoPagoModal)
        │   └── reviews/ (ReviewModal)
        ├── services/
        │   ├── api.js              # VITE_API_URL o fallback localhost:3000/api + JWT
        │   └── authService.js      # Normaliza rol ADMIN->dueno, estados
        └── context/
            ├── AuthContext.jsx     # Sesión, MOCK_USERS fallback, registro con código
            └── DataContext.jsx     # Servicios, empleados, turnos, multas, reseñas en localStorage
```

---

## Puesta en marcha

### 1. Base de datos

1. Abrir MySQL Workbench.
2. Ejecutar `api/database/init_barberazo.sql`.
3. Se crea `dsw` con tablas `usuarios, clientes, empleados, servicios, horarios_empleados, dias_trabajo, turnos, multas, resenas` + seed.

No usar `schema.sql` (obsoleto).

### 2. Backend (`/api`)

```bash
cd api
npm install
# Windows: copy .env.example .env
# Linux/Mac: cp .env.example .env
# Editar .env y poner DB_NAME=dsw (.env.example trae barberia por error)
npm run dev
```

- Dev: `npm run dev` (nodemon). Prod: `npm start`.
- Verificar: `GET http://localhost:3000/` → `{"message":"API Barbería - Backend activo"}`.
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile` (requiere `Authorization: Bearer <token>`).

### 3. Frontend (`/web`)

```bash
cd web
npm install
npm run dev
```

- App en `http://localhost:5173`.
- Conexión al backend: `src/services/api.js` usa `VITE_API_URL` o `http://localhost:3000/api`. `vite.config.js` además proxea `/api` → `http://localhost:3000`.
- Opcional: crear `web/.env` con `VITE_API_URL=http://localhost:3000/api`.
- Build: `npm run build`. Preview: `npm run preview`.

El backend debe estar corriendo primero. Si no lo está, el login cae a `MOCK_USERS` locales (solo para desarrollo).

---

## Usuarios de prueba

Contraseña para todos (seed en `init_barberazo.sql`): `123456`.

| Rol | Email | Estado inicial |
| :--- | :--- | :--- |
| Dueño (ADMIN) | `dueno@barberazo.com` | Activo |
| Empleado | `empleado@barberazo.com` | Activo |
| Empleado | `mateo@barberazo.com` | Activo |
| Cliente | `cliente@barberazo.com` | Activo, 0 strikes |
| Cliente | `multado@barberazo.com` | Multado, 3 strikes |

Nota: el fallback local `MOCK_USERS` acepta `123` o `123456`. El dato válido contra MySQL es `123456`.

---

## Rutas principales (`web/src/App.jsx`)

- **Públicas:** `/`, `/login`, `/registro`, `/recuperar-contrasena`.
- **Cliente (`/cliente/*`, rol `cliente`):** `home`, `turnos`, `multas`, `perfil`.
- **Dueño (`/dueno/*`, rol `dueno`):** `home`, `servicios`, `empleados`, `clientes`, `fechas`, `resenas`.
- **Empleado (`/empleado/*`, rol `empleado`):** `home`, `servicios`, `clientes`, `resenas`.

Reglas visibles en código: turnos de 60 min, 1 turno `Solicitado` por cliente a la vez, cancelación <24h suma strike, 3 strikes generan multa de $3000 (`DataContext.jsx`).

---

## Variables de entorno

Backend (`api/.env`, ver `api/.env.example`):

| Var | Default en código | Uso |
| :--- | :--- | :--- |
| `PORT` | `3000` | Puerto Express |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` | `localhost` / `3306` / `root` | Conexión MySQL |
| `DB_NAME` | `dsw` | Debe ser `dsw`, no `barberia` |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | `24h` | Firma de tokens |

Frontend (`web/.env`, opcional):

| Var | Default | Uso |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL del backend |

---

## Scripts

```bash
# Backend
cd api && npm run dev    # desarrollo con nodemon
cd api && npm start      # producción con node

# Frontend
cd web && npm run dev    # desarrollo en :5173
cd web && npm run build  # build a web/dist
cd web && npm run preview # preview del build
```
