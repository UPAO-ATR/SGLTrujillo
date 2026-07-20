// Ejecuta las migraciones desde la línea de comandos.

import { EjecutarMigraciones } from "../BaseDatos/EjecutorMigraciones.js";
import { GrupoConexiones } from "../BaseDatos/ConexionBaseDatos.js";
try {
  await EjecutarMigraciones();
  console.log("Migraciones ejecutadas.");
} finally {
  await GrupoConexiones.end();
}