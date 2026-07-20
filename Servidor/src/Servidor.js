// Inicia el servidor y las tareas programadas.

import { CrearAplicacion } from "./Aplicacion.js";
import {
  ConfiguracionEntorno,
  ValidarConfiguracionMinima,
} from "./Configuracion/ConfiguracionEntorno.js";
import { IniciarTareasInspecciones } from "./Tareas/TareasInspecciones.js";
ValidarConfiguracionMinima();
const Aplicacion = CrearAplicacion();
Aplicacion.listen(ConfiguracionEntorno.Puerto, () =>
  console.log(
    `SGL Trujillo disponible en el puerto ${ConfiguracionEntorno.Puerto}.`,
  ),
);
IniciarTareasInspecciones();