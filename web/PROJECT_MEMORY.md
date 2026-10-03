# MEMORIA DE PROYECTO: BARBERAZO (FRONTEND)

> **Propósito:** Documento de transferencia de contexto completo para modelos de IA o desarrolladores. Contiene el estado del proyecto, arquitectura, reglas de negocio, convenciones de código y tareas pendientes para continuar el desarrollo sin alucinaciones ni pérdida de contexto.

---

## 1. Identidad y Alcance del Proyecto
* **Nombre:** Barberazo (Sistema de Gestión de Turnos para Barbería).
* **Materia / Contexto:** Desarrollo de Software (DSW) - 3er año universitario.
* **Objetivo:** Sistema web para reserva de turnos, gestión de barberos, servicios, agenda del local, inasistencias, cancelaciones, sanciones por strikes, multas simuladas con Mercado Pago y reseñas.
* **Directiva Pedagógica Obligatoria (Apuntes del Profesor):**
  * El código **debe programarse siguiendo el estilo exacto de los apuntes de la cátedra**, ubicados en:
    📂 **`web/otro/apuntes frontend/`** (1. JS e intro a React, 2. Funcionamiento de React, 3. Formularios avanzados y rutas).
  * **Cero sobreingeniería:** No usar patrones raros, librerías complejas ni sintaxis esotérica. Todo debe ser código estándar y claro que un alumno de 3er año pueda defender y explicarle línea por línea al profesor en un coloquio.
  * Componentes funcionales simples, hooks estándar (`useState`, `useEffect`, `useContext`, `useNavigate`), formularios controlados con inmutabilidad (`(prev) => ...`) y funciones manejadoras nombradas con `handle...`.

---

## 2. Regla de Oro de Nomenclatura (Bilingüe)
1. **Código en INGLÉS:** Nombres de variables, estados, funciones, parámetros, propiedades de objetos y comentarios técnicos deben estar en **INGLÉS** (ej. `appointments`, `fines`, `services`, `employees`, `clients`, `workingDays`, `addAppointment`, `payFine`).
2. **Interfaz de Usuario (UI) en ESPAÑOL:** Todos los textos visibles por el usuario (botones, títulos, tablas, chips, modales, alertas, snackbars de notificación) deben estar **100% en ESPAÑOL**.

---

## 3. Stack Tecnológico y Arquitectura
* **Frontend:** React 18 + Vite.
* **Librería de Componentes:** Material UI (`@mui/material`, `@mui/icons-material`).
* **Enrutamiento:** React Router v6 (`BrowserRouter`, `Routes`, `Route`, `Navigate`).
* **Notificaciones:** `notistack` (`enqueueSnackbar`).
* **Gestión de Estado:** Context API:
  * `AuthContext.jsx`: Sesión del usuario, token, login, registro con verificación en 2 pasos, logout y roles (`cliente`, `empleado`, `dueno`).
  * `DataContext.jsx`: Estado global de negocio persistido en `localStorage` (`services`, `employees`, `clients`, `diasTrabajo` / `workingDays`, `appointments`, `fines`).
* **Futuro Backend (previsto):** Node.js + Express + MySQL + Mercado Pago SDK (actualmente el front funciona de forma autónoma con datos mock y persistencia local).

---

## 4. Usuarios Demo para Pruebas (Credenciales)
| Rol | Email | Password | Estado inicial | Descripción |
|:---|:---|:---:|:---:|:---|
| **Dueño** | `dueno@barberazo.com` | `123` | `Activo` | Acceso total administrativo (`/dueno/*`). |
| **Empleado** | `empleado@barberazo.com` | `123` | `Activo` | Agenda personal, consulta de clientes/servicios (`/empleado/*`). |
| **Cliente Activo** | `cliente@barberazo.com` | `123` | `Activo` (0 strikes) | Tiene 1 turno agendado activo (`/cliente/*`). |
| **Cliente Multado** | `multado@barberazo.com` | `123` | `Multado` (3 strikes) | Bloqueado para reservar; debe pagar multa en `/cliente/multas`. |

---

## 5. Estado de las Fases del Plan de Implementación

### ✅ Fase 1: Autenticación y Control de Acceso (COMPLETADA)
* Rutas públicas (`/`, `/login`, `/registro`, `/recuperar-contrasena`).
* Registro con envío simulado de código de 6 dígitos con expiración de 5 minutos (`CUU2.1`).
* Login directo por email y contraseña (`CUU1.1`).
* Redirección automática según rol: `dueno` ➔ `/dueno/home`, `empleado` ➔ `/empleado/home`, `cliente` ➔ `/cliente/home`.
* Protección de rutas con `ProtectedRoute` y `RoleGuard`.

### ✅ Fase 2: Mantenimiento de Catálogos (COMPLETADA)
* Servicios (`/dueno/servicios`): ABM completo, duración en minutos, precio, descripción y toggle Habilitado/Deshabilitado (`CUU7.1`, `CUU7.2`).
* Empleados (`/dueno/empleados`): ABM completo, asignación de especialidades y jornadas de trabajo (`CUU10.1`, `CUU10.2`, `CUU10.3`, `CUU6.3`).
* Clientes (`/dueno/clientes`): Visualización de clientes, historial de strikes y bloqueo/desbloqueo (`CUU5.1`, `CUU5.2`). El rol empleado solo tiene acceso de lectura.

### ✅ Fase 3: Calendario y Fechas de Atención (COMPLETADA)
* Pantalla `/dueno/fechas` (`DatesPage.jsx`): Calendario mensual interactivo.
* Generador de 3 meses de días laborables (Martes a Sábado de 08:00 a 20:00). Domingos y Lunes bloqueados por ser días de descanso.
* Toggle de fecha: Habilitar (`CUU6.1`) o Deshabilitar con diálogo de advertencia de cancelación de turnos agendados (`CUU6.2`).

### ✅ Fase 4: Motor de Reservas, Turnos, Strikes y Mercado Pago (COMPLETADA)
* **Reserva de turnos (`BookingWizard.jsx` en `/cliente/home`):**
  * Asistente en pasos: Servicio ➔ Fecha ➔ Barbero ("Cualquiera disponible" o específico) ➔ Horario ➔ Confirmación (`CUU1.2`).
  * Regla estricta: **1 solo turno activo (`Solicitado`) a la vez por cliente**.
  * Si ya tiene turno activo, muestra la tarjeta de turno con botón de cancelación.
* **Regla de Cancelación (<24hs) (`CUU1.5`):**
  * Si cancela con más de 24 hs ➔ sin penalidad.
  * Si cancela con menos de 24 hs ➔ se aplica **+1 Strike**.
* **Gestión de Turnos (`TurnosManager.jsx` en `/dueno/home` y `/empleado/home`):**
  * Tabla con filtros (fecha, barbero, búsqueda de cliente).
  * Botones: "Asistió" (pasa a `Asistido`), "No Asistió" (`No-Asistido` + 1 Strike) (`CUU1.3`), "Cancelar" (`CUU1.6`).
* **Sistema de Strikes y Multas (`CUU4.1`):**
  * Al llegar a **3 Strikes**, el cliente pasa a estado `'Multado'` y se genera una multa pendiente de `$3.000`.
  * Pantalla `/cliente/multas` (`ClientFinesPage.jsx`) con barra de progreso de strikes.
  * Modal simulador de **Mercado Pago** (`MercadoPagoModal.jsx`): procesamiento con spinner de 1.5s, éxito, multa pasa a `'Pagada'`, strikes vuelven a `0` y la cuenta vuelve a estar `'Activa'`.

---

## 6. Refactor a Inglés COMPLETADO (Siguiente: FASE 5)

La **refactorización de variables a inglés** según `refactor_english_plan.md` está **completada y pusheada** (commits `052cd75` y `e2e9162`, build limpio):

1. **Etapa 4 (Calendario y Fechas de Trabajo) ✅:**
   * En `DataContext.jsx`: `diasTrabajo` ➔ `workingDays` (propiedades: `date`, `dayOfWeek`, `startTime`, `endTime`, `status`).
   * En `DatesPage.jsx`: estados y handlers en inglés (`selectedDay`, `handleToggleDayStatus`, `isConfirmOpen`, etc.), UI en español.
2. **Etapa 5 (Catálogos de Fase 2) ✅:**
   * En `ServicesPage.jsx`, `EmployeesPage.jsx` y `ClientsPage.jsx`: propiedades del modelo (`name`, `price`, `phone`, `description`) y estados locales de formularios en inglés (`openModal`, `formData`, `handleSave`, `handleDelete`).
3. **Etapa 6 (Limpieza y Verificación) ✅:**
   * Sin alias temporales en `DataContext.jsx` (salvo lecturas de migración de `localStorage` viejo en `normalize*`); `npm run build` limpio.
   * Excepciones conscientes fuera de alcance: `AuthContext` sigue en español (`nombre`, `telefono`, `estado`) y `TurnosManager` conserva el prop `modo` (lo usan las dashboards de Fase 4).

---

### FASE 5 (Módulos Secundarios) ✅ COMPLETADA
* **Perfil de Cliente (`/cliente/perfil`):** Edición de datos (`CUU9.1`, `updateProfile` + `updateClient`) y eliminación de cuenta (`CUU9.2`, `deleteAccount` + `removeClient` con doble confirmación).
* **Reseñas:** Calificación 1–5 estrellas + comentario para turnos `Asistido` (`CUU1.4`, `ReviewModal`, 1 reseña por turno) con historial en el dashboard; `reviews` + `addReview` en `DataContext` (`barberazo_reviews`); panel staff en `/dueno/resenas` (todas + promedios) y `/empleado/resenas` (propias) (`CUU8.1`, `ReviewsPage` con vista por rol).
* Alcance recortado: **sin sobreturnos** (se consideró innecesario).

---

## 7. Estructura de Archivos Clave
```
web/
├── src/
│   ├── App.jsx                        # Router principal con RoleGuard y ProtectedRoute
│   ├── main.jsx                       # Providers: ThemeProvider, SnackbarProvider, AuthProvider, DataProvider
│   ├── theme.js                       # Configuración de Material UI dark mode y acentos dorados/azules
│   ├── context/
│   │   ├── AuthContext.jsx            # Autenticación, usuarios mock y roles
│   │   └── DataContext.jsx            # Estado global (services, employees, clients, appointments, fines, diasTrabajo)
│   ├── components/
│   │   ├── common/Navbar.jsx          # Barra de navegación adaptada dinámicamente por rol
│   │   ├── booking/BookingWizard.jsx  # Asistente de reserva en 5 pasos y visualizador de turno activo
│   │   ├── turnos/TurnosManager.jsx   # Consola de gestión de turnos para Dueño y Empleado
│   │   └── fines/MercadoPagoModal.jsx # Checkout simulado con estética de Mercado Pago
│   └── pages/
│       ├── LandingPage.jsx            # Portada pública
│       ├── LoginPage.jsx              # Formulario de inicio de sesión
│       ├── RegisterPage.jsx           # Registro con verificación por código
│       ├── client/
│       │   ├── ClientDashboard.jsx    # Portal de cliente (renderiza BookingWizard)
│       │   └── ClientFinesPage.jsx    # Control de strikes y pago de multas
│       ├── owner/
│       │   ├── OwnerDashboard.jsx     # Portal de dueño (renderiza TurnosManager modo dueno)
│       │   ├── ServicesPage.jsx       # ABM Servicios
│       │   ├── EmployeesPage.jsx      # ABM Empleados y asignación de horarios
│       │   ├── ClientsPage.jsx        # Gestión y bloqueo de clientes
│       │   └── DatesPage.jsx          # Calendario de habilitación de fechas
│       └── employee/
│           └── EmployeeDashboard.jsx  # Portal de barbero (renderiza TurnosManager modo empleado)
├── implementation_plan.md             # Plan general del proyecto completo
└── refactor_english_plan.md           # Plan de traducción de variables a inglés
```
