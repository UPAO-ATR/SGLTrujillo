// Define las rutas protegidas de inspecciones.

import { Router } from "express";
import {
  EsquemaResultadoInspeccion,
  EsquemaObservaciones,
  EsquemaPrepararDemostracion,
  EsquemaId,
} from "../Validadores/Esquemas.js";
import { ValidarCuerpo, ValidarParametro } from "../Middleware/Validacion.js";
import { AutorizarRoles } from "../Middleware/Autenticacion.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
export function CrearRutasInspecciones(C, A) {
  const R = Router();
  R.use(A);
  R.get(
    "/",
    AutorizarRoles(RolesUsuario.Inspector, RolesUsuario.Administrador),
    C.Listar,
  );
  R.post(
    "/tareas/reprogramar",
    AutorizarRoles(RolesUsuario.Administrador),
    C.EjecutarReprogramacion,
  );
  R.post(
    "/demostracion/prepararHoy",
    AutorizarRoles(RolesUsuario.Administrador),
    ValidarCuerpo(EsquemaPrepararDemostracion),
    C.PrepararDemostracion,
  );
  R.get(
    "/:id",
    AutorizarRoles(RolesUsuario.Inspector, RolesUsuario.Administrador),
    ValidarParametro("id", EsquemaId),
    C.ObtenerDetalle,
  );
  R.patch(
    "/:id",
    AutorizarRoles(RolesUsuario.Inspector),
    ValidarParametro("id", EsquemaId),
    ValidarCuerpo(EsquemaResultadoInspeccion),
    C.RegistrarResultado,
  );
  R.post(
    "/:id/observaciones",
    AutorizarRoles(RolesUsuario.Inspector),
    ValidarParametro("id", EsquemaId),
    ValidarCuerpo(EsquemaObservaciones),
    C.RegistrarObservaciones,
  );
  return R;
}