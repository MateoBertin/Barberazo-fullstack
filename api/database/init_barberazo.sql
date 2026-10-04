-- =======================================================
-- SCRIPT DE INICIALIZACIÓN - SISTEMA BARBERAZO (BD: dsw)
-- Cátedra: Desarrollo de Software
-- =======================================================

CREATE DATABASE IF NOT EXISTS `dsw` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `dsw`;

-- Deshabilitar chequeo de claves foráneas para recreación limpia si es necesario
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `resenas`;
DROP TABLE IF EXISTS `multas`;
DROP TABLE IF EXISTS `turnos`;
DROP TABLE IF EXISTS `horarios_empleados`;
DROP TABLE IF EXISTS `dias_trabajo`;
DROP TABLE IF EXISTS `servicios`;
DROP TABLE IF EXISTS `empleados`;
DROP TABLE IF EXISTS `clientes`;
DROP TABLE IF EXISTS `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. TABLA USUARIOS
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('ADMIN','EMPLEADO','CLIENTE') NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. TABLA CLIENTES
CREATE TABLE `clientes` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `contador_strikes` int DEFAULT '0',
  `estado` enum('REGISTRADO','ACTIVO','BLOQUEADO','MULTADO') DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_cliente`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. TABLA EMPLEADOS
CREATE TABLE `empleados` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `estado` enum('ACTIVO','INACTIVO') DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_empleado`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. TABLA SERVICIOS
CREATE TABLE `servicios` (
  `id_servicio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `precio` decimal(10,2) NOT NULL,
  `duracion_minutos` int NOT NULL,
  `estado` enum('HABILITADO','DESHABILITADO') DEFAULT 'HABILITADO',
  PRIMARY KEY (`id_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. TABLA HORARIOS EMPLEADOS
CREATE TABLE `horarios_empleados` (
  `id_horario` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int NOT NULL,
  `dia_semana` enum('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  PRIMARY KEY (`id_horario`),
  KEY `id_empleado` (`id_empleado`),
  CONSTRAINT `horarios_empleados_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. TABLA DÍAS DE TRABAJO
CREATE TABLE `dias_trabajo` (
  `id_dia_trabajo` int NOT NULL AUTO_INCREMENT,
  `id_empleado` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `estado` enum('HABILITADO','DESHABILITADO') DEFAULT 'HABILITADO',
  `motivo` varchar(255) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_dia_trabajo`),
  UNIQUE KEY `uq_empleado_fecha` (`id_empleado`,`fecha`),
  CONSTRAINT `dias_trabajo_ibfk_1` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. TABLA TURNOS
CREATE TABLE `turnos` (
  `id_turno` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_empleado` int NOT NULL,
  `id_servicio` int NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `estado` enum('SOLICITADO','CANCELADO','CANCELADO EMPLEADO','ASISTIDO','NO ASISTIDO') DEFAULT 'SOLICITADO',
  PRIMARY KEY (`id_turno`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_empleado` (`id_empleado`),
  KEY `id_servicio` (`id_servicio`),
  CONSTRAINT `turnos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `turnos_ibfk_2` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`),
  CONSTRAINT `turnos_ibfk_3` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. TABLA MULTAS
CREATE TABLE `multas` (
  `id_multa` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_turno` int DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `estado_pago` enum('PENDIENTE','PAGADO') DEFAULT 'PENDIENTE',
  `fecha_emision` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_multa`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_turno` (`id_turno`),
  CONSTRAINT `multas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `multas_ibfk_2` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. TABLA RESEÑAS
CREATE TABLE `resenas` (
  `id_resena` int NOT NULL AUTO_INCREMENT,
  `id_cliente` int NOT NULL,
  `id_turno` int NOT NULL,
  `calificacion` int DEFAULT NULL,
  `comentario` text,
  `fecha_resena` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resena`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_turno` (`id_turno`),
  CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`),
  CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`),
  CONSTRAINT `resenas_chk_1` CHECK (((`calificacion` >= 1) and (`calificacion` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =======================================================
-- DATOS INICIALES DE PRUEBA (SEED DATA)
-- Contraseña para todos los usuarios de prueba: 123456
-- Hash Bcrypt: $2b$10$SD9veVUALgiK6OK2n/5YQOQjBI2Ja8kVbEszpRI4DrXCkqP2LYwO2
-- =======================================================

-- 1. Insertar Usuarios
INSERT INTO `usuarios` (`id_usuario`, `email`, `password`, `rol`) VALUES
(1, 'dueno@barberazo.com', '$2b$10$SD9veVUALgiK6OK2n/5YQOQjBI2Ja8kVbEszpRI4DrXCkqP2LYwO2', 'ADMIN'),
(2, 'empleado@barberazo.com', '$2b$10$SD9veVUALgiK6OK2n/5YQOQjBI2Ja8kVbEszpRI4DrXCkqP2LYwO2', 'EMPLEADO'),
(3, 'mateo@barberazo.com', '$2b$10$SD9veVUALgiK6OK2n/5YQOQjBI2Ja8kVbEszpRI4DrXCkqP2LYwO2', 'EMPLEADO'),
(4, 'cliente@barberazo.com', '$2b$10$SD9veVUALgiK6OK2n/5YQOQjBI2Ja8kVbEszpRI4DrXCkqP2LYwO2', 'CLIENTE'),
(5, 'multado@barberazo.com', '$2b$10$SD9veVUALgiK6OK2n/5YQOQjBI2Ja8kVbEszpRI4DrXCkqP2LYwO2', 'CLIENTE');

-- 2. Insertar Empleados
INSERT INTO `empleados` (`id_empleado`, `id_usuario`, `nombre`, `apellido`, `telefono`, `especialidad`, `estado`) VALUES
(1, 2, 'Nicolas Rodrigo', 'Gutierrez Fernandez', '341-5554321', 'Corte Tradicional, Arreglo de Barba', 'ACTIVO'),
(2, 3, 'Mateo', 'Bertín', '341-5556789', 'Tintura, Perfilado de Cejas', 'ACTIVO');

-- 3. Insertar Clientes
INSERT INTO `clientes` (`id_cliente`, `id_usuario`, `nombre`, `apellido`, `telefono`, `contador_strikes`, `estado`) VALUES
(1, 4, 'Gerónimo', 'Benavides', '341-5551234', 0, 'ACTIVO'),
(2, 5, 'Lucas', 'Multini Martino', '341-5559999', 3, 'MULTADO');

-- 4. Insertar Servicios Predeterminados
INSERT INTO `servicios` (`id_servicio`, `nombre`, `descripcion`, `precio`, `duracion_minutos`, `estado`) VALUES
(1, 'Corte Tradicional', 'Corte de cabello clásico o moderno con asesoramiento de estilo y acabado.', 4500.00, 60, 'HABILITADO'),
(2, 'Arreglo de Barba', 'Diseño, perfilado, rebajado de barba y toalla caliente.', 3000.00, 60, 'HABILITADO'),
(3, 'Combo Corte + Barba', 'Servicio completo de corte de cabello y arreglo de barba profesional.', 6500.00, 60, 'HABILITADO'),
(4, 'Tintura / Coloración', 'Aplicación de tintura, mechas o camuflaje de canas.', 8500.00, 60, 'HABILITADO'),
(5, 'Perfilado de Cejas', 'Depilación y diseño de cejas con navaja/pinza.', 2000.00, 60, 'HABILITADO');
