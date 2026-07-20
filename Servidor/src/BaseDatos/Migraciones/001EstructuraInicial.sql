-- Crea la estructura inicial de datos del sistema.

CREATE TABLE IF NOT EXISTS configuraciones (
  id BIGSERIAL PRIMARY KEY,
  clave VARCHAR(80) NOT NULL UNIQUE,
  valor VARCHAR(300) NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'TEXTO',
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_actualizacion_id BIGINT
);
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  dni VARCHAR(8) UNIQUE,
  nombres VARCHAR(120) NOT NULL,
  apellido_paterno VARCHAR(80) NOT NULL DEFAULT '',
  apellido_materno VARCHAR(80) NOT NULL DEFAULT '',
  correo_institucional VARCHAR(160) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(40) NOT NULL CHECK (rol IN ('SUPER_ADMINISTRADOR','ADMINISTRADOR','INSPECTOR','CAJERA')),
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  hora_entrada TIME NOT NULL DEFAULT '08:00',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS solo_un_super_administrador ON usuarios ((rol)) WHERE rol='SUPER_ADMINISTRADOR';
CREATE UNIQUE INDEX IF NOT EXISTS solo_un_administrador_habilitado ON usuarios ((rol)) WHERE rol='ADMINISTRADOR' AND habilitado=TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS solo_un_inspector_habilitado ON usuarios ((rol)) WHERE rol='INSPECTOR' AND habilitado=TRUE;
CREATE TABLE IF NOT EXISTS negocios (
  id BIGSERIAL PRIMARY KEY,
  ruc VARCHAR(11) NOT NULL UNIQUE,
  razon_social VARCHAR(220) NOT NULL,
  domicilio_fiscal VARCHAR(300) NOT NULL,
  ubigeo VARCHAR(6) NOT NULL,
  correo VARCHAR(160) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS solicitudes (
  id BIGSERIAL PRIMARY KEY,
  negocio_id BIGINT NOT NULL REFERENCES negocios(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('NUEVA','RENOVACION')),
  opcion_renovacion VARCHAR(30),
  origen VARCHAR(20) NOT NULL DEFAULT 'CIUDADANO' CHECK (origen IN ('CIUDADANO','CAJERA')),
  estado VARCHAR(50) NOT NULL DEFAULT 'PAGADO_PENDIENTE',
  codigo_pago VARCHAR(50) NOT NULL UNIQUE,
  codigo_inspeccion VARCHAR(8) NOT NULL UNIQUE,
  monto_oficial NUMERIC(10,2) NOT NULL DEFAULT 180.00,
  plano_ruta VARCHAR(500),
  plano_tipo VARCHAR(100),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS solicitudes_negocio_estado ON solicitudes(negocio_id,estado);
CREATE INDEX IF NOT EXISTS solicitudes_codigo_consulta ON solicitudes(codigo_pago,codigo_inspeccion);
CREATE TABLE IF NOT EXISTS pagos (
  id BIGSERIAL PRIMARY KEY,
  solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id),
  medio_pago VARCHAR(30) NOT NULL,
  monto_oficial NUMERIC(10,2) NOT NULL,
  monto_cobrado NUMERIC(10,2) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  referencia_externa VARCHAR(160),
  clave_idempotencia VARCHAR(160) NOT NULL UNIQUE,
  respuesta_proveedor JSONB,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_confirmacion TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS pagos_solicitud ON pagos(solicitud_id);
CREATE UNIQUE INDEX IF NOT EXISTS pago_confirmado_unico ON pagos(solicitud_id) WHERE estado='CONFIRMADO';
CREATE TABLE IF NOT EXISTS boletas (
  id BIGSERIAL PRIMARY KEY,
  solicitud_id BIGINT NOT NULL UNIQUE REFERENCES solicitudes(id),
  numero_boleta VARCHAR(40) NOT NULL UNIQUE,
  ruta_archivo VARCHAR(500) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS feriados (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS inspecciones (
  id BIGSERIAL PRIMARY KEY,
  solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id),
  inspector_id BIGINT REFERENCES usuarios(id),
  numero_visita SMALLINT NOT NULL CHECK (numero_visita IN (1,2)),
  estado VARCHAR(40) NOT NULL DEFAULT 'PENDIENTE',
  fecha_programada DATE,
  hora_programada TIME,
  orden_dia INTEGER,
  prioridad_reprogramada BOOLEAN NOT NULL DEFAULT FALSE,
  observaciones TEXT,
  fecha_realizacion TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(solicitud_id,numero_visita)
);
CREATE UNIQUE INDEX IF NOT EXISTS inspeccion_cupo_unico ON inspecciones(fecha_programada,orden_dia) WHERE fecha_programada IS NOT NULL AND estado='PENDIENTE';
CREATE INDEX IF NOT EXISTS inspecciones_fecha_estado ON inspecciones(fecha_programada,estado);
CREATE INDEX IF NOT EXISTS inspecciones_fifo ON inspecciones(fecha_creacion,id);
CREATE TABLE IF NOT EXISTS licencias (
  id BIGSERIAL PRIMARY KEY,
  solicitud_id BIGINT NOT NULL UNIQUE REFERENCES solicitudes(id),
  negocio_id BIGINT NOT NULL REFERENCES negocios(id),
  numero_licencia VARCHAR(60) NOT NULL UNIQUE,
  expediente VARCHAR(60) NOT NULL,
  ruta_archivo VARCHAR(500) NOT NULL,
  fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_vencimiento TIMESTAMPTZ NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS licencias_negocio_vencimiento ON licencias(negocio_id,fecha_vencimiento DESC);
CREATE TABLE IF NOT EXISTS cajas (
  id BIGSERIAL PRIMARY KEY,
  cajera_id BIGINT NOT NULL REFERENCES usuarios(id),
  fecha DATE NOT NULL,
  fondo_inicial NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA','CERRADA')),
  efectivo_fisico_cierre NUMERIC(10,2),
  efectivo_esperado_cierre NUMERIC(10,2),
  diferencia NUMERIC(10,2),
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  UNIQUE(cajera_id,fecha)
);
CREATE TABLE IF NOT EXISTS transacciones_caja (
  id BIGSERIAL PRIMARY KEY,
  caja_id BIGINT NOT NULL REFERENCES cajas(id),
  solicitud_id BIGINT REFERENCES solicitudes(id),
  pago_id BIGINT REFERENCES pagos(id),
  medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('YAPE','PLIN','EFECTIVO')),
  monto NUMERIC(10,2) NOT NULL CHECK (monto>0),
  referencia VARCHAR(160),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transacciones_caja_fecha ON transacciones_caja(caja_id,fecha_creacion);
CREATE UNIQUE INDEX IF NOT EXISTS transacciones_caja_pago_unico ON transacciones_caja(pago_id) WHERE pago_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS sangrias (
  id BIGSERIAL PRIMARY KEY,
  caja_id BIGINT NOT NULL REFERENCES cajas(id),
  monto NUMERIC(10,2) NOT NULL CHECK (monto>0),
  motivo VARCHAR(300) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGSERIAL PRIMARY KEY,
  destinatario VARCHAR(160) NOT NULL,
  asunto VARCHAR(220) NOT NULL,
  contenido TEXT NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  intentos INTEGER NOT NULL DEFAULT 0,
  ultimo_error TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_envio TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS alertas_administracion (
  id BIGSERIAL PRIMARY KEY,
  cajera_id BIGINT REFERENCES usuarios(id),
  caja_id BIGINT REFERENCES cajas(id),
  tipo VARCHAR(60) NOT NULL,
  mensaje VARCHAR(500) NOT NULL,
  detalles JSONB,
  atendida BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_atencion TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS alertas_administracion_pendientes ON alertas_administracion(atendida,fecha_creacion DESC);
CREATE TABLE IF NOT EXISTS auditorias (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id),
  nombre_usuario VARCHAR(220) NOT NULL,
  accion VARCHAR(120) NOT NULL,
  entidad VARCHAR(80) NOT NULL,
  entidad_id VARCHAR(80),
  detalles JSONB,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION impedir_cambios_auditoria() RETURNS TRIGGER AS $$ BEGIN RAISE EXCEPTION 'Los registros de auditoría no pueden modificarse ni eliminarse'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS auditoria_solo_insercion ON auditorias;
CREATE TRIGGER auditoria_solo_insercion BEFORE UPDATE OR DELETE ON auditorias FOR EACH ROW EXECUTE FUNCTION impedir_cambios_auditoria();