import pg from "pg";
import { Configuracion } from "../Configuracion/Configuracion.js";

const { Pool } = pg;
const UsaSsl = Configuracion.Entorno === "production" || /neon\.tech|sslmode=/i.test(Configuracion.UrlBaseDatos);

export const PoolBaseDatos = new Pool({
  connectionString: Configuracion.UrlBaseDatos,
  ssl: UsaSsl ? { rejectUnauthorized: false } : false,
  options: `-c search_path=${Configuracion.Esquema},public`,
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export async function Consultar(Texto, Parametros = [], Cliente = PoolBaseDatos) {
  return Cliente.query(Texto, Parametros);
}

export async function Uno(Texto, Parametros = [], Cliente = PoolBaseDatos) {
  const Resultado = await Cliente.query(Texto, Parametros);
  return Resultado.rows[0] || null;
}

export async function Transaccion(Trabajo) {
  const Cliente = await PoolBaseDatos.connect();
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
