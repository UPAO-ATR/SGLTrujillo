// Crea y comparte la conexión con PostgreSQL.

import pg from "pg";
import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
const { Pool } = pg;
export const GrupoConexiones = new Pool({
  connectionString: ConfiguracionEntorno.UrlBaseDatos,
  ssl:
    ConfiguracionEntorno.Entorno === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export async function Consultar(Texto, Parametros = []) {
  return GrupoConexiones.query(Texto, Parametros);
}
export async function VerificarBaseDatos() {
  const Inicio = Date.now();
  await GrupoConexiones.query("SELECT 1");
  return { Conectada: true, TiempoRespuestaMs: Date.now() - Inicio };
}
export async function ConTransaccion(Trabajo) {
  const Cliente = await GrupoConexiones.connect();
  try {
    await Cliente.query("BEGIN");
    const Resultado = await Trabajo(Cliente);
    await Cliente.query("COMMIT");
    return Resultado;
  } catch (Error) {
    await Cliente.query("ROLLBACK");
    throw Error;
  } finally {
    Cliente.release();
  }
}