// Ejecuta un respaldo manual de la base de datos y archivos.

import { GrupoConexiones } from "../BaseDatos/ConexionBaseDatos.js";
import { AlmacenArchivos } from "../Integraciones/Almacenamiento/AlmacenArchivos.js";
import { ServicioRespaldos } from "../Servicios/ServicioRespaldos.js";

try {
  const Servicio = new ServicioRespaldos(
    GrupoConexiones,
    new AlmacenArchivos(),
  );
  const Resultado = await Servicio.CrearRespaldo();
  console.log(`Respaldo creado: ${Resultado.Identificador}`);
} finally {
  await GrupoConexiones.end();
}