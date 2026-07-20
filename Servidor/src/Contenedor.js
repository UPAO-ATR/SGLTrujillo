// Construye las dependencias y conecta todas las capas del servidor.

import {
  GrupoConexiones,
  ConTransaccion,
} from "./BaseDatos/ConexionBaseDatos.js";
import { RepositorioUsuarios } from "./Repositorios/RepositorioUsuarios.js";
import { RepositorioNegocios } from "./Repositorios/RepositorioNegocios.js";
import { RepositorioSolicitudes } from "./Repositorios/RepositorioSolicitudes.js";
import { RepositorioPagos } from "./Repositorios/RepositorioPagos.js";
import { RepositorioInspecciones } from "./Repositorios/RepositorioInspecciones.js";
import { RepositorioLicencias } from "./Repositorios/RepositorioLicencias.js";
import { RepositorioBoletas } from "./Repositorios/RepositorioBoletas.js";
import { RepositorioConfiguracion } from "./Repositorios/RepositorioConfiguracion.js";
import { RepositorioCaja } from "./Repositorios/RepositorioCaja.js";
import { RepositorioAuditoria } from "./Repositorios/RepositorioAuditoria.js";
import { RepositorioNotificaciones } from "./Repositorios/RepositorioNotificaciones.js";
import { RepositorioAlertas } from "./Repositorios/RepositorioAlertas.js";
import { ClienteCodart } from "./Integraciones/Codart/ClienteCodart.js";
import { ClienteMercadoPago } from "./Integraciones/MercadoPago/ClienteMercadoPago.js";
import { AlmacenArchivos } from "./Integraciones/Almacenamiento/AlmacenArchivos.js";
import { ClienteCorreo } from "./Integraciones/Correo/ClienteCorreo.js";
import { ServicioAuditoria } from "./Servicios/ServicioAuditoria.js";
import { ServicioNotificaciones } from "./Servicios/ServicioNotificaciones.js";
import { ServicioAutenticacion } from "./Servicios/ServicioAutenticacion.js";
import { ServicioSolicitudes } from "./Servicios/ServicioSolicitudes.js";
import { ServicioInspecciones } from "./Servicios/ServicioInspecciones.js";
import { ServicioLicencias } from "./Servicios/ServicioLicencias.js";
import { ServicioPagos } from "./Servicios/ServicioPagos.js";
import { ServicioCaja } from "./Servicios/ServicioCaja.js";
import { ServicioAdministracion } from "./Servicios/ServicioAdministracion.js";
import { ServicioRespaldos } from "./Servicios/ServicioRespaldos.js";
import { ControladorAutenticacion } from "./Controladores/ControladorAutenticacion.js";
import { ControladorSolicitudes } from "./Controladores/ControladorSolicitudes.js";
import { ControladorPagos } from "./Controladores/ControladorPagos.js";
import { ControladorLicencias } from "./Controladores/ControladorLicencias.js";
import { ControladorInspecciones } from "./Controladores/ControladorInspecciones.js";
import { ControladorCaja } from "./Controladores/ControladorCaja.js";
import { ControladorAdministracion } from "./Controladores/ControladorAdministracion.js";
const BaseDatos = GrupoConexiones;
// Crea una sola instancia de cada repositorio.
const Repositorios = {
  RepositorioUsuarios: new RepositorioUsuarios(BaseDatos),
  RepositorioNegocios: new RepositorioNegocios(BaseDatos),
  RepositorioSolicitudes: new RepositorioSolicitudes(BaseDatos),
  RepositorioPagos: new RepositorioPagos(BaseDatos),
  RepositorioInspecciones: new RepositorioInspecciones(BaseDatos),
  RepositorioLicencias: new RepositorioLicencias(BaseDatos),
  RepositorioBoletas: new RepositorioBoletas(BaseDatos),
  RepositorioConfiguracion: new RepositorioConfiguracion(BaseDatos),
  RepositorioCaja: new RepositorioCaja(BaseDatos),
  RepositorioAuditoria: new RepositorioAuditoria(BaseDatos),
  RepositorioNotificaciones: new RepositorioNotificaciones(BaseDatos),
  RepositorioAlertas: new RepositorioAlertas(BaseDatos),
};
const Integraciones = {
  ClienteCodart: new ClienteCodart(),
  ClienteMercadoPago: new ClienteMercadoPago(),
  AlmacenArchivos: new AlmacenArchivos(),
  ClienteCorreo: new ClienteCorreo(),
};
const ServicioAuditoriaInstancia = new ServicioAuditoria(
  Repositorios.RepositorioAuditoria,
);
const ServicioNotificacionesInstancia = new ServicioNotificaciones(
  Repositorios.RepositorioNotificaciones,
  Integraciones.ClienteCorreo,
);
// Comparte las dependencias usadas por los servicios.
const Comun = {
  ...Repositorios,
  ...Integraciones,
  BaseDatos,
  ConTransaccion,
  ServicioAuditoria: ServicioAuditoriaInstancia,
  ServicioNotificaciones: ServicioNotificacionesInstancia,
};
const ServicioLicenciasInstancia = new ServicioLicencias(Comun);
const ServicioInspeccionesInstancia = new ServicioInspecciones({
  ...Comun,
  ServicioLicencias: ServicioLicenciasInstancia,
});
const ServicioPagosInstancia = new ServicioPagos({
  ...Comun,
  ServicioLicencias: ServicioLicenciasInstancia,
  ServicioInspecciones: ServicioInspeccionesInstancia,
});
const ServicioCajaInstancia = new ServicioCaja(Comun);
const ServicioAdministracionInstancia = new ServicioAdministracion({
  ...Comun,
  ServicioInspecciones: ServicioInspeccionesInstancia,
});
const ServicioRespaldosInstancia = new ServicioRespaldos(
  BaseDatos,
  Integraciones.AlmacenArchivos,
);
const ServicioSolicitudesInstancia = new ServicioSolicitudes(Comun);
const ServicioAutenticacionInstancia = new ServicioAutenticacion(
  Repositorios.RepositorioUsuarios,
  ServicioAuditoriaInstancia,
);
// Expone servicios e integraciones al resto del servidor.
export const Contenedor = {
  BaseDatos,
  ConTransaccion,
  ...Repositorios,
  ...Integraciones,
  ServicioAuditoria: ServicioAuditoriaInstancia,
  ServicioNotificaciones: ServicioNotificacionesInstancia,
  ServicioAutenticacion: ServicioAutenticacionInstancia,
  ServicioSolicitudes: ServicioSolicitudesInstancia,
  ServicioInspecciones: ServicioInspeccionesInstancia,
  ServicioLicencias: ServicioLicenciasInstancia,
  ServicioPagos: ServicioPagosInstancia,
  ServicioCaja: ServicioCajaInstancia,
  ServicioAdministracion: ServicioAdministracionInstancia,
  ServicioRespaldos: ServicioRespaldosInstancia,
};
// Conecta cada controlador con su servicio.
export const Controladores = {
  Autenticacion: new ControladorAutenticacion(ServicioAutenticacionInstancia),
  Solicitudes: new ControladorSolicitudes({ ...Contenedor }),
  Pagos: new ControladorPagos({ ...Contenedor }),
  Licencias: new ControladorLicencias({ ...Contenedor }),
  Inspecciones: new ControladorInspecciones({ ...Contenedor }),
  Caja: new ControladorCaja({ ...Contenedor }),
  Administracion: new ControladorAdministracion({ ...Contenedor }),
};