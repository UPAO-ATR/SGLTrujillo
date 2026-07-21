import { ClienteCodart } from "./Integraciones/Codart/ClienteCodart.js";
import { AlmacenArchivos } from "./Integraciones/Almacenamiento/AlmacenArchivos.js";
import { ClienteCorreo } from "./Integraciones/Correo/ClienteCorreo.js";
import { ServicioTiempo } from "./Servicios/ServicioTiempo.js";
import { ServicioProgramacion } from "./Servicios/ServicioProgramacion.js";
import { ServicioCaja } from "./Servicios/ServicioCaja.js";
import { ServicioTramites } from "./Servicios/ServicioTramites.js";
import { ServicioInspecciones } from "./Servicios/ServicioInspecciones.js";
import { ServicioAdministracion } from "./Servicios/ServicioAdministracion.js";
import { ServicioSuperAdministracion } from "./Servicios/ServicioSuperAdministracion.js";

const Correo = new ClienteCorreo();
const Tiempo = new ServicioTiempo(Correo);
const Programacion = new ServicioProgramacion(Tiempo);
const Caja = new ServicioCaja(Tiempo);
const Almacen = new AlmacenArchivos();
const Codart = new ClienteCodart();

export const Contenedor = Object.freeze({
  Correo,
  Tiempo,
  Programacion,
  Caja,
  Almacen,
  Codart,
  Tramites: new ServicioTramites({ Codart, Almacen, Tiempo, Caja, Programacion }),
  Inspecciones: new ServicioInspecciones({ Tiempo, Programacion, Almacen }),
  Administracion: new ServicioAdministracion(),
  SuperAdministracion: new ServicioSuperAdministracion()
});
