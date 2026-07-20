// Define las rutas públicas del ciudadano y los pagos.

import { Router } from "express";
import {
  EsquemaRuc,
  EsquemaCodigo,
  EsquemaCrearSolicitud,
  EsquemaCrearPago,
  EsquemaId,
} from "../Validadores/Esquemas.js";
import { ValidarCuerpo, ValidarParametro } from "../Middleware/Validacion.js";
import { RecibirPlano } from "../Middleware/SubidaArchivos.js";
import { AutorizarRoles } from "../Middleware/Autenticacion.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
export function CrearRutasPublicas(
  Controladores,
  Autenticar,
  AutenticarOpcional,
) {
  const R = Router();
  R.get(
    "/negocios/ruc/:ruc",
    ValidarParametro("ruc", EsquemaRuc),
    Controladores.Solicitudes.ConsultarRuc,
  );
  R.post(
    "/solicitudes",
    AutenticarOpcional,
    ValidarCuerpo(EsquemaCrearSolicitud),
    Controladores.Solicitudes.CrearSolicitud,
  );
  R.get(
    "/solicitudes/:codigo",
    ValidarParametro("codigo", EsquemaCodigo),
    Controladores.Solicitudes.ConsultarSeguimiento,
  );
  R.post(
    "/solicitudes/:id/plano",
    ValidarParametro("id", EsquemaId),
    AutenticarOpcional,
    RecibirPlano,
    Controladores.Solicitudes.SubirPlano,
  );
  R.get(
    "/solicitudes/:id/plano/descargar",
    ValidarParametro("id", EsquemaId),
    AutenticarOpcional,
    Controladores.Solicitudes.DescargarPlano,
  );
  R.post(
    "/solicitudes/:id/checkout",
    ValidarParametro("id", EsquemaId),
    AutenticarOpcional,
    ValidarCuerpo(EsquemaCrearPago),
    Controladores.Pagos.CrearPago,
  );
  R.post("/pagos/webhook", Controladores.Pagos.ProcesarWebhook);
  R.post(
    "/pagos/:id/confirmarDemostracion",
    ValidarParametro("id", EsquemaId),
    AutenticarOpcional,
    Controladores.Pagos.ConfirmarDemostracion,
  );
  R.post(
    "/pagos/:id/confirmarPresencial",
    Autenticar,
    AutorizarRoles(RolesUsuario.Cajera),
    ValidarParametro("id", EsquemaId),
    Controladores.Pagos.ConfirmarPresencial,
  );
  R.get(
    "/boletas/:solicitudId/descargar",
    ValidarParametro("solicitudId", EsquemaId),
    Controladores.Pagos.DescargarBoleta,
  );
  R.get(
    "/licencias/ruc/:ruc",
    ValidarParametro("ruc", EsquemaRuc),
    Controladores.Licencias.ConsultarPorRuc,
  );
  R.get(
    "/licencias/:solicitudId/descargar",
    ValidarParametro("solicitudId", EsquemaId),
    Controladores.Licencias.Descargar,
  );
  return R;
}