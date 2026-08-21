# 💈 Barberazo - Sistema Fullstack de Gestión de Turnos

Sistema integral para la gestión de turnos, clientes, empleados y servicios de barbería desarrollado para la cátedra de Desarrollo de Software (2026).

---

## 📁 Estructura del Repositorio

- **`/api`**: Backend desarrollado en Node.js, Express y MySQL siguiendo el patrón arquitectónico MVC.
- **`/web`**: Frontend desarrollado en React.js, Vite, Material UI y React Router.

---

## 🚀 Puesta en Marcha Rápida

### 1. Base de Datos (MySQL)
1. Abrir MySQL Workbench y ejecutar el script [api/database/init_barberazo.sql](api/database/init_barberazo.sql).
2. Se creará la base de datos `dsw` con todas las tablas y usuarios de prueba.

### 2. Backend (`/api`)
```bash
cd api
npm install
# Configurar api/.env con las credenciales de tu MySQL
npm run dev
```
El servidor arrancará en `http://localhost:3000`.

### 3. Frontend (`/web`)
```bash
cd web
npm install
npm run dev
```
La aplicación web se abrirá en `http://localhost:5173`.

---

## 🔑 Usuarios de Prueba

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Dueño / Admin** | `dueno@barberazo.com` | `123456` |
| **Empleado** | `empleado@barberazo.com` | `123456` |
| **Cliente Activo** | `cliente@barberazo.com` | `123456` |
| **Cliente Multado** | `multado@barberazo.com` | `123456` |
