-- ============================================
-- FINANZAS PERSONALES - Script de base de datos
-- Ejecutar en phpMyAdmin o MySQL CLI
-- ============================================

CREATE DATABASE IF NOT EXISTS finanzas_personales
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finanzas_personales;

-- --------------------------------------------
-- USUARIOS
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nick VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------
-- INGRESOS
-- frecuencia: unico | semanal | quincenal | mensual
-- activo: 1=activo, 0=finalizado
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS ingresos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  frecuencia ENUM('unico','semanal','quincenal','mensual') NOT NULL DEFAULT 'unico',
  valor DECIMAL(15,2) NOT NULL,
  fecha DATE NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- --------------------------------------------
-- GASTOS
-- frecuencia: unico | diario | semanal | mensual
-- dia_del_mes: usado cuando frecuencia = mensual (1-31)
-- activo: 1=activo, 0=finalizado
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS gastos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  frecuencia ENUM('unico','diario','semanal','mensual') NOT NULL DEFAULT 'unico',
  valor DECIMAL(15,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  dia_del_mes TINYINT UNSIGNED NULL DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- --------------------------------------------
-- DEUDAS / OBLIGACIONES
-- Misma estructura que gastos
-- dia_del_mes: para pagos el día X de cada mes
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS deudas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  frecuencia ENUM('unico','diario','semanal','mensual') NOT NULL DEFAULT 'mensual',
  valor DECIMAL(15,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  dia_del_mes TINYINT UNSIGNED NULL DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- --------------------------------------------
-- REGISTROS AUTOMATICOS
-- Aquí se materializan los gastos/deudas recurrentes
-- tipo: gasto | deuda
-- referencia_id: id del gasto o deuda origen
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS registros_automaticos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('gasto','deuda') NOT NULL,
  referencia_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  fecha_aplicada DATE NOT NULL,
  UNIQUE KEY unique_registro (tipo, referencia_id, fecha_aplicada),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- --------------------------------------------
-- Índices para consultas frecuentes
-- --------------------------------------------
CREATE INDEX idx_ingresos_usuario_fecha ON ingresos(usuario_id, fecha);
CREATE INDEX idx_gastos_usuario_activo ON gastos(usuario_id, activo);
CREATE INDEX idx_deudas_usuario_activo ON deudas(usuario_id, activo);
CREATE INDEX idx_registros_usuario_fecha ON registros_automaticos(usuario_id, fecha_aplicada);
