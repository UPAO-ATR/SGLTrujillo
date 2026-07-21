import { Configuracion } from "../Configuracion/Configuracion.js";
import { PoolBaseDatos } from "./Conexion.js";

export async function EjecutarMigraciones() {
  const Esquema = Configuracion.Esquema;
  await PoolBaseDatos.query(`CREATE SCHEMA IF NOT EXISTS ${Esquema}`);
  await PoolBaseDatos.query(`SET search_path TO ${Esquema}, public`);
  await PoolBaseDatos.query(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS feriados (
      fecha DATE PRIMARY KEY,
      descripcion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id BIGSERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      clave_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('CAJERO','INSPECTOR','ADMINISTRADOR','SUPERADMINISTRADOR')),
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS un_inspector_activo ON usuarios (rol) WHERE rol='INSPECTOR' AND activo=TRUE;
    CREATE UNIQUE INDEX IF NOT EXISTS un_administrador_activo ON usuarios (rol) WHERE rol='ADMINISTRADOR' AND activo=TRUE;
    CREATE UNIQUE INDEX IF NOT EXISTS un_superadministrador_activo ON usuarios (rol) WHERE rol='SUPERADMINISTRADOR' AND activo=TRUE;

    CREATE TABLE IF NOT EXISTS negocios (
      id BIGSERIAL PRIMARY KEY,
      ruc VARCHAR(11) NOT NULL UNIQUE,
      razon_social TEXT NOT NULL,
      estado TEXT NOT NULL,
      condicion TEXT,
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS locales (
      id BIGSERIAL PRIMARY KEY,
      negocio_id BIGINT NOT NULL REFERENCES negocios(id),
      codigo TEXT NOT NULL,
      tipo TEXT NOT NULL,
      direccion TEXT NOT NULL,
      ubigeo VARCHAR(6) NOT NULL,
      activo BOOLEAN NOT NULL DEFAULT TRUE,
      UNIQUE (negocio_id, codigo, direccion)
    );

    CREATE TABLE IF NOT EXISTS cajas (
      id BIGSERIAL PRIMARY KEY,
      cajero_id BIGINT NOT NULL REFERENCES usuarios(id),
      fecha_operacion DATE NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('SOLICITADA_APERTURA','ABIERTA','SOLICITADA_CIERRE','CERRADA','RECHAZADA')),
      monto_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
      efectivo_esperado NUMERIC(10,2) NOT NULL DEFAULT 0,
      efectivo_contado NUMERIC(10,2),
      diferencia NUMERIC(10,2),
      abierta_en TIMESTAMPTZ,
      cerrada_en TIMESTAMPTZ,
      UNIQUE (cajero_id, fecha_operacion)
    );

    CREATE TABLE IF NOT EXISTS solicitudes_caja (
      id BIGSERIAL PRIMARY KEY,
      caja_id BIGINT REFERENCES cajas(id),
      cajero_id BIGINT NOT NULL REFERENCES usuarios(id),
      tipo TEXT NOT NULL CHECK (tipo IN ('APERTURA','INYECCION','CIERRE')),
      monto NUMERIC(10,2),
      monto_contado NUMERIC(10,2),
      estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
      detalle TEXT,
      creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resuelta_en TIMESTAMPTZ,
      administrador_id BIGINT REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS movimientos_caja (
      id BIGSERIAL PRIMARY KEY,
      caja_id BIGINT NOT NULL REFERENCES cajas(id),
      tipo TEXT NOT NULL,
      monto NUMERIC(10,2) NOT NULL,
      detalle TEXT,
      referencia TEXT,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tramites (
      id BIGSERIAL PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL CHECK (tipo IN ('SOLICITUD','RENOVACION')),
      negocio_id BIGINT NOT NULL REFERENCES negocios(id),
      local_id BIGINT NOT NULL REFERENCES locales(id),
      ruc VARCHAR(11) NOT NULL,
      dni VARCHAR(8) NOT NULL,
      nombre_cliente TEXT NOT NULL,
      correo TEXT NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE_PAGO','EN_PROCESO','EN_OBSERVACION','RECHAZADO','APROBADO','VENCIDO')),
      plano_clave TEXT,
      monto_oficial NUMERIC(10,2) NOT NULL DEFAULT 180,
      monto_demostracion NUMERIC(10,2) NOT NULL DEFAULT 3,
      cajero_id BIGINT NOT NULL REFERENCES usuarios(id),
      renovado_desde_id BIGINT REFERENCES tramites(id),
      comprobante_clave TEXT,
      numero_licencia TEXT,
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fecha_pago DATE,
      fecha_aprobacion DATE,
      fecha_vencimiento DATE
    );

    CREATE INDEX IF NOT EXISTS idx_tramites_ruc ON tramites(ruc);
    CREATE INDEX IF NOT EXISTS idx_tramites_local_estado ON tramites(local_id, estado);

    CREATE TABLE IF NOT EXISTS pagos (
      id BIGSERIAL PRIMARY KEY,
      tramite_id BIGINT NOT NULL UNIQUE REFERENCES tramites(id),
      caja_id BIGINT NOT NULL REFERENCES cajas(id),
      monto_efectivo NUMERIC(10,2) NOT NULL DEFAULT 0,
      monto_digital NUMERIC(10,2) NOT NULL DEFAULT 0,
      medio_digital TEXT CHECK (medio_digital IN ('YAPE','PLIN') OR medio_digital IS NULL),
      numero_operacion TEXT,
      total NUMERIC(10,2) NOT NULL,
      pagado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inspecciones (
      id BIGSERIAL PRIMARY KEY,
      tramite_id BIGINT NOT NULL REFERENCES tramites(id),
      numero SMALLINT NOT NULL CHECK (numero IN (1,2)),
      fecha_programada DATE NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','APROBADA','OBSERVADA','RECHAZADA')),
      observaciones TEXT,
      inspector_id BIGINT NOT NULL REFERENCES usuarios(id),
      realizada_en TIMESTAMPTZ,
      UNIQUE (tramite_id, numero)
    );

    CREATE INDEX IF NOT EXISTS idx_inspecciones_fecha ON inspecciones(fecha_programada, estado);

    CREATE TABLE IF NOT EXISTS notificaciones (
      id BIGSERIAL PRIMARY KEY,
      clave TEXT NOT NULL UNIQUE,
      tramite_id BIGINT REFERENCES tramites(id),
      destino TEXT NOT NULL,
      asunto TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fecha_programada DATE NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','ENVIADA','ERROR')),
      enviada_en TIMESTAMPTZ,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS alertas_admin (
      id BIGSERIAL PRIMARY KEY,
      tipo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      leida BOOLEAN NOT NULL DEFAULT FALSE,
      creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id BIGSERIAL PRIMARY KEY,
      usuario_id BIGINT REFERENCES usuarios(id),
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id TEXT,
      detalle JSONB,
      creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
