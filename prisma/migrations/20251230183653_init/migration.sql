-- CreateTable
CREATE TABLE `canal` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_sucursal` BIGINT NULL,
    `tipo` TEXT NULL,
    `numero_telefonico` TEXT NULL,

    INDEX `id_sucursal`(`id_sucursal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_prospectos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_sucursal` BIGINT NULL,
    `nombre` TEXT NULL,
    `telefono` TEXT NULL,
    `fuente` TEXT NULL,
    `etapa` TEXT NULL,

    INDEX `id_sucursal`(`id_sucursal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensaje` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_lead` BIGINT NULL,
    `rol` TEXT NULL,
    `contenido` TEXT NULL,
    `tipo` ENUM('texto', 'imagen', 'boton', 'archivo') NULL DEFAULT 'texto',
    `fecha_envio` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `id_lead`(`id_lead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prompt` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_sucursal` BIGINT NOT NULL,
    `titulo` VARCHAR(255) NULL,
    `prompt_final` TEXT NOT NULL,
    `fecha_creacion` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_prompt_sucursal1_idx`(`id_sucursal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prompt_atributos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_prompt` BIGINT NOT NULL,
    `clave_variable` VARCHAR(100) NULL,
    `pregunta` TEXT NULL,
    `respuesta` TEXT NOT NULL,

    INDEX `id_prompt`(`id_prompt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sucursal` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nombre_negocio` TEXT NULL,
    `giro` TEXT NULL,
    `ciudad` TEXT NULL,
    `horarios` TEXT NULL,
    `url_redes_sociales` TEXT NULL,
    `estado` VARCHAR(15) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_sucursal` BIGINT NULL,
    `tipo` TEXT NULL,
    `estado` TEXT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `fecha_creacion` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    INDEX `id_sucursal`(`id_sucursal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intencion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_sucursal` BIGINT NOT NULL,
    `clave` TEXT NULL,
    `nombre` VARCHAR(45) NULL,
    `descripcion` VARCHAR(45) NULL,
    `tipo_accion` VARCHAR(45) NULL,
    `config` JSON NULL,
    `activo` TINYINT NULL,

    INDEX `fk_intent_prompt_sucursal1_idx`(`id_sucursal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `canal` ADD CONSTRAINT `canales_ibfk_1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lead_prospectos` ADD CONSTRAINT `lead_prospectos_ibfk_1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `mensaje` ADD CONSTRAINT `mensajes_ibfk_1` FOREIGN KEY (`id_lead`) REFERENCES `lead_prospectos`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `prompt` ADD CONSTRAINT `fk_prompt_sucursal1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `prompt_atributos` ADD CONSTRAINT `prompt_atributos_ibfk_1` FOREIGN KEY (`id_prompt`) REFERENCES `prompt`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `asistentes_ibfk_1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `intencion` ADD CONSTRAINT `fk_intent_prompt_sucursal1` FOREIGN KEY (`id_sucursal`) REFERENCES `sucursal`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
