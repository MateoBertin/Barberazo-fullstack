# 💈 Plan de Implementación Dividido en 3 Partes (Regularidad DSW)

Para que **Pedro, Mateo y Lucas** puedan trabajar en simultáneo sin bloquearse ni generar conflictos en Git, el trabajo se divide en **3 módulos autónomos**. Cada parte cubre exactamente una porción de los requisitos de la cátedra (**3 CRUDs simples, 2 dependientes, 2 listados con filtro/detalle y 2 CUUs complejos**).

---

## 📐 Convención Técnica Común para los 3

Para cumplir con la exigencia de **Arquitectura en Capas + Patrón Repository** de la cátedra:

Cada módulo en el backend (`api/`) debe seguir esta estructura de archivos:
```text
api/
├── repositories/   -> Solo consultas SQL puras (pool.execute)
├── services/       -> Lógica y reglas de negocio (validaciones, cálculos)
├── controllers/    -> Manejo de req, res y códigos de estado HTTP
└── routes/         -> Definición de endpoints montados en index.js
```

Todas las respuestas de la API deben mantener el formato estándar que ya usa `auth`:
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... }
}
```

---

## 👤 PARTE 1: Módulo Catálogo, Servicios y Calendario
**Asignado a:** Pedro  
**Rama sugerida:** `feature/servicios-y-fechas`  
**Requisitos que cubre para la cátedra:**
* **CRUD Simple 1:** ABM Servicios (`servicios` - CUU7.1 / CUU7.2)
* **CRUD Simple 2:** ABM Días Laborales y Horarios (`dias_trabajo` - CUU6.1 / CUU6.2)

### 1.1 Backend (`api/`)
1. **Servicios:**
   * `api/repositories/servicioRepository.js`:
     * `findAll()`, `findById(id)`, `create(data)`, `update(id, data)`, `toggleStatus(id)`.
   * `api/services/servicioService.js`:
     * Validar que el nombre no esté duplicado, que el precio sea mayor a 0 y duración fija en 60 min.
   * `api/controllers/servicioController.js`:
     * Handlers para GET, POST, PUT, PATCH estado.
   * `api/routes/servicioRoutes.js`:
     * `GET /api/servicios` (público / clientes para wizard).
     * `POST /api/servicios` (protegido ADMIN).
     * `PUT /api/servicios/:id` (protegido ADMIN).
     * `PATCH /api/servicios/:id/estado` (protegido ADMIN).
2. **Días de Trabajo:**
   * `api/repositories/diaTrabajoRepository.js` y `api/routes/fechaRoutes.js`:
     * `GET /api/fechas` (días y horarios habilitados).
     * `PATCH /api/fechas/:fecha/toggle` (habilitar/deshabilitar fecha).

### 1.2 Frontend (`web/`)
* Modificar `web/src/pages/owner/ServicesPage.jsx` para que al agregar, editar o deshabilitar un servicio llame a `servicioService.js` (`/api/servicios`).
* Modificar `web/src/pages/owner/DatesPage.jsx` para persistir la habilitación/deshabilitación de fechas en `fechaService.js` (`/api/fechas`).

---

## 👤 PARTE 2: Módulo Empleados, Barberos y Clientes
**Asignado a:** Mateo  
**Rama sugerida:** `feature/empleados-y-clientes`  
**Requisitos que cubre para la cátedra:**
* **CRUD Dependiente 1:** ABM Empleados (depende de `usuarios` y especialidades de `servicios` - CUU10.1 / CUU10.2 / CUU10.3)
* **CRUD Simple 3:** Gestión de Clientes y Perfil (`clientes` - CUU2.1 / CUU9.1 / CUU9.2)
* **Listado con Filtro + Detalle 1:** Panel de clientes filtrado por estado (Activo, Bloqueado, Multado) con visualización de strikes.

### 2.1 Backend (`api/`)
1. **Empleados:**
   * `api/repositories/empleadoRepository.js`:
     * `findAll()` (con datos de usuario y especialidades), `create()`, `update()`, `delete()`.
   * `api/services/empleadoService.js`:
     * Alta atómica (crea usuario con rol `EMPLEADO` + registro en tabla `empleados`).
     * Validar antes de eliminar que no tenga turnos futuros asignados (**CUU10.3**).
   * `api/routes/empleadoRoutes.js`:
     * `GET /api/empleados` (para listar barberos).
     * `POST /api/empleados` (alta de barbero, solo ADMIN).
     * `PUT /api/empleados/:id` (edición, solo ADMIN).
     * `DELETE /api/empleados/:id` (baja si no tiene turnos pendientes).
2. **Clientes:**
   * `api/repositories/clienteRepository.js` y `api/routes/clienteRoutes.js`:
     * `GET /api/clientes` (listar todos con strikes y estado).
     * `PATCH /api/clientes/:id/bloqueo` (bloquear/desbloquear cliente **CUU5.1 / 5.2**).
     * `PUT /api/clientes/perfil` (editar perfil propio **CUU9.1**).

### 2.2 Frontend (`web/`)
* Conectar `web/src/pages/owner/EmployeesPage.jsx` con `empleadoService.js` (`/api/empleados`).
* Conectar `web/src/pages/owner/ClientsPage.jsx` con `clienteService.js` (`/api/clientes`).
* Conectar `web/src/pages/client/ClientProfilePage.jsx` con `clienteService.js` (`/api/clientes/perfil`).

---

## 👤 PARTE 3: Módulo Turnos, Asistencias, Multas y Reseñas
**Asignado a:** Lucas  
**Rama sugerida:** `feature/turnos-y-agenda`  
**Requisitos que cubre para la cátedra:**
* **CRUD Dependiente 2:** Turnos (depende de Cliente, Empleado, Servicio y Fecha)
* **CUU Complejo 1:** Registrar Turno con validación de 1 turno activo (**RN06**) y no superposición (**RN05**) (**CUU1.2**)
* **CUU Complejo 2:** Confirmación de asistencia / Registro de inasistencias con generación automática de multas al 3er strike (**CUU1.3 / RN13**)
* **Listado con Filtro + Detalle 2:** Consola de turnos (`TurnosManager.jsx`) con filtro por fecha, estado y barbero + modal de detalle.

### 3.1 Backend (`api/`)
1. **Turnos:**
   * `api/repositories/turnoRepository.js`:
     * `findWithFilters({ fecha, id_empleado, id_cliente, estado })`
     * `create(turnoData)`
     * `updateStatus(id, estado, motivo, canceladoPor)`
     * `countActiveByClient(idCliente)`
     * `isSlotOccupied(idEmpleado, fechaHora)`
   * `api/services/turnoService.js`:
     * **Regla RN06:** Rechazar si el cliente ya tiene un turno en estado `SOLICITADO`.
     * **Regla RN05:** Rechazar si el empleado ya está ocupado en ese horario.
     * **Regla RN13:** Si el cliente cancela con menos de 24 hs, sumar strike.
     * **Lógica Inasistencia:** Si el empleado marca `NO ASISTIDO`, sumar strike al cliente; si llega a 3 strikes, insertar registro en tabla `multas` y cambiar cliente a `MULTADO`.
   * `api/routes/turnoRoutes.js`:
     * `GET /api/turnos` (listado con filtros).
     * `POST /api/turnos` (reserva de turno).
     * `PATCH /api/turnos/:id/estado` (marcar ASISTIDO, NO ASISTIDO, CANCELADO).
2. **Reseñas y Multas:**
   * `api/routes/resenaRoutes.js`:
     * `GET /api/resenas` y `POST /api/resenas` (solo si turno fue `ASISTIDO`).

### 3.2 Frontend (`web/`)
* Conectar `web/src/components/booking/BookingWizard.jsx` con `turnoService.js` (`POST /api/turnos`).
* Conectar `web/src/components/turnos/TurnosManager.jsx` con `turnoService.js` (`GET /api/turnos` y `PATCH /api/turnos/:id/estado`).
* Conectar `web/src/components/reviews/ReviewModal.jsx` con `resenaService.js`.
* Conectar `web/src/pages/client/ClientFinesPage.jsx`.

---

## 🚀 Cómo ponerse a trabajar en paralelo

1. Cada integrante crea su rama desde `main`:
   ```bash
   git checkout -b feature/servicios-fechas    # Pedro
   git checkout -b feature/empleados-clientes  # Mateo
   git checkout -b feature/turnos-agenda      # Lucas
   ```
2. **Cero conflictos:**
   * Nadie toca `api/index.js` (ya tiene todas las rutas montadas en `main`).
   * Cada uno programa en sus propios archivos de repositorio, servicio, controlador y frontend.
3. Al terminar cada rama, hacen el Pull Request a `main` y ya tienen el TP 100% fullstack contra MySQL listo para defender la Regularidad.
