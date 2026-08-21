CREATE TABLE `cliente`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL,
    `apellido` VARCHAR(50) NOT NULL,
    `telefono` INT NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `contraseña` VARCHAR(30) NOT NULL,
    `estado` VARCHAR(15) NOT NULL,
    `strikes` SMALLINT NOT NULL,
    `multas` INT NOT NULL
);
CREATE TABLE `empleado`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL,
    `apellido` VARCHAR(50) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `contraseña` VARCHAR(30) NOT NULL,
    `telefono` INT NOT NULL,
    `esAdmin` BOOLEAN NOT NULL
);
CREATE TABLE `turno`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `estado` VARCHAR(30) NOT NULL,
    `fechaReserva` DATETIME NOT NULL
);
CREATE TABLE `turnos_servicios`(
    `id_turno` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_servicio` INT NOT NULL,
    PRIMARY KEY(`id_servicio`)
);
CREATE TABLE `servicio`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `duracion` TIMESTAMP NOT NULL,
    `precio` DECIMAL(8, 2) NOT NULL,
    `estado` BOOLEAN NOT NULL
);
CREATE TABLE `reseña`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `descripcion` VARCHAR(255) NOT NULL,
    `puntuacion` SMALLINT NOT NULL
);
CREATE TABLE `multa`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `monto` DECIMAL(8, 2) NOT NULL,
    `fecha` DATETIME NOT NULL,
    `estado` BOOLEAN NOT NULL
);
CREATE TABLE `diaTrabajo`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `fecha` DATE NOT NULL,
    `estado` BOOLEAN NOT NULL,
    `horarioInicio` TIME NOT NULL,
    `horarioFin` TIME NOT NULL
);
CREATE TABLE `horarioTrabajo`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `inicio` TIME NOT NULL,
    `fin` TIME NOT NULL
);
CREATE TABLE `cancelacion`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `fechaHora` DATETIME NOT NULL
);
ALTER TABLE
    `turno` ADD CONSTRAINT `turno_id_foreign` FOREIGN KEY(`id`) REFERENCES `reseña`(`id`);
ALTER TABLE
    `multa` ADD CONSTRAINT `multa_id_foreign` FOREIGN KEY(`id`) REFERENCES `cliente`(`multas`);
ALTER TABLE
    `turnos_servicios` ADD CONSTRAINT `turnos_servicios_id_servicio_foreign` FOREIGN KEY(`id_servicio`) REFERENCES `servicio`(`id`);
ALTER TABLE
    `turnos_servicios` ADD CONSTRAINT `turnos_servicios_id_turno_foreign` FOREIGN KEY(`id_turno`) REFERENCES `turno`(`id`);