# Propuesta de proyecto — Barberazo: sistema de gestión de turnos para barbería

**Equipo:** Pedro Ravanelli, Lucas Martino y Mateo Bertin.
**Materia:** Desarrollo de Software, Ingeniería en Sistemas (2026).

## 1. Contexto y problema

Las barberías suelen gestionar reservas por teléfono o mensajes, sin control unificado de agenda, personal ni asistencia. Esto genera turnos superpuestos, ausencias sin penalización y pérdida de historial de clientes. Se propone desarrollar *Barberazo*, un sistema web fullstack que centralice reservas, empleados, servicios, multas y reseñas, con acceso diferenciado por rol (dueño, empleado y cliente).

## 2. Objetivo general

Implementar un sistema funcional contra base de datos MySQL que cumpla los requisitos de la cátedra: arquitectura en capas con patrón Repository, tres CRUD simples, dos CRUD dependientes, dos listados con filtro y detalle, y dos casos de uso complejos.

## 3. Objetivos específicos

- **Módulo Catálogo y Calendario** (Pedro Ravanelli): ABM de servicios y habilitación de días y horarios de trabajo.
- **Módulo Empleados y Clientes** (Mateo Bertin): alta atómica de barberos con validación de turnos pendientes antes de la baja lógica, gestión de clientes con bloqueo/desbloqueo y panel filtrado por estado con visualización de strikes.
- **Módulo Turnos y Multas** (Lucas Martino): reserva con validación de un turno activo por cliente y no superposición de horarios, registro de asistencias e inasistencias con generación automática de multa al tercer strike, y reseñas habilitadas solo para turnos asistidos.

## 4. Reglas de negocio principales

Turnos de 60 minutos; un turno en estado Solicitado por cliente a la vez; cancelación con menos de 24 horas suma un strike; tres strikes generan multa de $3000 y estado Multado; el pago rehabilita al cliente.

## 5. Arquitectura y tecnología

Frontend en React 18 con Vite 5, Material UI 5 y React Router 6; backend en Node.js con Express 5, autenticación JWT y contraseñas con bcrypt; base de datos MySQL 8 (`dsw`). El backend se organiza en capas —rutas, controladores, servicios y repositorios con SQL puro— y todas las respuestas mantienen el formato estándar `{success, message, data}`.

## 6. Metodología de trabajo

El equipo de tres integrantes trabaja en paralelo sobre ramas independientes (`servicios-fechas`, `empleados-clientes`, `turnos-agenda`), cada una con archivos propios de repositorio, servicio, controlador y vistas, sin modificar el punto de montaje de rutas compartido. Cada rama se integra a `main` mediante pull request, obteniendo al final un sistema 100% fullstack listo para defender la regularidad.
