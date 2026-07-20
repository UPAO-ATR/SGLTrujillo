// Ejecuta las migraciones pendientes en el orden correcto.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GrupoConexiones } from "./ConexionBaseDatos.js";
const CarpetaActual = path.dirname(fileURLToPath(import.meta.url));
// Aplica únicamente las migraciones que todavía no fueron registradas.
export async function EjecutarMigraciones() {
  const Carpeta = path.join(CarpetaActual, "Migraciones");
  const Archivos = (await fs.readdir(Carpeta))
    .filter((Nombre) => Nombre.endsWith(".sql"))
    .sort();
  for (const Archivo of Archivos) {
    const Sql = await fs.readFile(path.join(Carpeta, Archivo), "utf8");
    await GrupoConexiones.query(Sql);
  }
}