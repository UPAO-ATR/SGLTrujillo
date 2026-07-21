import { EjecutarMigraciones } from "../BaseDatos/Migraciones.js";
import { SembrarDatos } from "../BaseDatos/DatosIniciales.js";
import { PoolBaseDatos } from "../BaseDatos/Conexion.js";
import { ValidarConfiguracion } from "../Configuracion/Configuracion.js";

try {
  ValidarConfiguracion();
  await EjecutarMigraciones();
  await SembrarDatos();
  console.log("Esquema nuevo, usuarios y datos demostrativos preparados.");
} finally {
  await PoolBaseDatos.end();
}
