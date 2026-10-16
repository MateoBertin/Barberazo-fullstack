# Modelo de datos — Barberazo

Fuente: `api/database/init_barberazo.sql` (base `dsw`, MySQL 8). Este diagrama se renderiza automáticamente en GitHub.

```mermaid
erDiagram
    usuarios ||--o| clientes : "tiene perfil"
    usuarios ||--o| empleados : "tiene perfil"
    usuarios ||--o{ codigos_verificacion : "recibe"
    clientes ||--o{ turnos : "reserva"
    clientes ||--o{ multas : "recibe"
    clientes ||--o{ resenas : "escribe"
    empleados ||--o{ turnos : "atiende"
    empleados ||--o{ horarios_empleados : "tiene"
    empleados ||--o{ dias_trabajo : "tiene"
    servicios ||--o{ turnos : "corresponde a"
    turnos ||--o| multas : "origina"
    turnos ||--o{ resenas : "recibe"

    usuarios {
        int id_usuario PK
        varchar email UK
        varchar password
        enum rol "ADMIN, EMPLEADO, CLIENTE"
        datetime fecha_registro
    }
    clientes {
        int id_cliente PK
        int id_usuario FK
        varchar nombre
        varchar apellido
        varchar telefono
        int contador_strikes
        enum estado "REGISTRADO, ACTIVO, BLOQUEADO, MULTADO"
    }
    empleados {
        int id_empleado PK
        int id_usuario FK
        varchar nombre
        varchar apellido
        varchar telefono
        varchar especialidad
        enum estado "ACTIVO, INACTIVO"
    }
    servicios {
        int id_servicio PK
        varchar nombre
        text descripcion
        decimal precio
        int duracion_minutos "siempre 60"
        enum estado "HABILITADO, DESHABILITADO"
    }
    horarios_empleados {
        int id_horario PK
        int id_empleado FK
        enum dia_semana "LUNES..DOMINGO"
        time hora_inicio
        time hora_fin
    }
    dias_trabajo {
        int id_dia_trabajo PK
        int id_empleado FK "nullable"
        date fecha
        time hora_inicio
        time hora_fin
        enum estado "HABILITADO, DESHABILITADO"
        varchar motivo
    }
    turnos {
        int id_turno PK
        int id_cliente FK
        int id_empleado FK
        int id_servicio FK
        datetime fecha_hora
        enum estado "SOLICITADO, CANCELADO, CANCELADO EMPLEADO, ASISTIDO, NO ASISTIDO"
    }
    multas {
        int id_multa PK
        int id_cliente FK
        int id_turno FK "nullable"
        decimal monto "3000 al 3er strike"
        varchar motivo
        enum estado_pago "PENDIENTE, PAGADO"
        datetime fecha_emision
    }
    resenas {
        int id_resena PK
        int id_cliente FK
        int id_turno FK
        int calificacion "1..5"
        text comentario
        datetime fecha_resena
    }
    codigos_verificacion {
        int id_codigo PK
        int id_usuario FK
        varchar codigo "6 digitos"
        enum tipo "CONFIRMACION, RECUPERACION"
        datetime expira_en "5 minutos"
        bool usado
    }
```

## Decisiones de modelado

- **Usuarios separado de perfiles:** `usuarios` guarda credenciales y rol; `clientes` y `empleados` guardan datos propios. El alta crea ambas filas en una transacción.
- **Baja lógica en empleados:** `empleados.estado` (`ACTIVO`/`INACTIVO`) conserva el historial de turnos; bloquear la baja si hay turnos `SOLICITADO` futuros.
- **Strikes y multas:** `clientes.contador_strikes` acumula; al llegar a 3 se inserta en `multas` y el cliente pasa a `MULTADO`. El bloqueo manual (`BLOQUEADO`) nunca pisa `MULTADO`.
- **Reseñas atadas a turnos:** `resenas.id_turno` garantiza una reseña por turno asistido.
- **Verificación por código:** `codigos_verificacion` con expiración a 5 minutos para confirmación de registro (CUU2.1) y recupero de contraseña (CUU3.1).
