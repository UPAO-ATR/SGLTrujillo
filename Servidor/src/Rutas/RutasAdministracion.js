// Define las rutas protegidas del administrador.

import { Router } from "express";
import { AutorizarRoles } from "../Middleware/Autenticacion.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
import { ValidarCuerpo, ValidarParametro } from "../Middleware/Validacion.js";
import {
  EsquemaCrearTrabajador,
  EsquemaConfiguracion,
  EsquemaCambiarHabilitacion,
  EsquemaCrearAdministrador,
  EsquemaFeriado,
  EsquemaDni,
  EsquemaId,
} from "../Validadores/Esquemas.js";
export function CrearRutasAdministracion(C, A) {
  const R = Router();
  R.use(A);
  R.get(
    "/inspectores",
    AutorizarRoles(RolesUsuario.Administrador),
    C.ListarInspectores,
  );
  R.get(
    "/cajeras",
    AutorizarRoles(RolesUsuario.Administrador),
    C.ListarCajeras,
  );
  R.get(
    "/trabajadores/dni/:dni",
    AutorizarRoles(RolesUsuario.Administrador, RolesUsuario.SuperAdministrador),
    ValidarParametro("dni", EsquemaDni),
    C.ConsultarDni,
  );
  R.post(
    "/trabajadores",
    AutorizarRoles(RolesUsuario.Administrador),
    ValidarCuerpo(EsquemaCrearTrabajador),
    C.CrearTrabajador,
  );
  R.patch(
    "/trabajadores/:id/habilitacion",
    AutorizarRoles(RolesUsuario.Administrador),
    ValidarParametro("id", EsquemaId),
    ValidarCuerpo(EsquemaCambiarHabilitacion),
    C.CambiarHabilitacion,
  );
  R.get(
    "/configuraciones",
    AutorizarRoles(RolesUsuario.Administrador),
    C.ListarConfiguraciones,
  );
  R.patch(
    "/configuraciones",
    AutorizarRoles(RolesUsuario.Administrador),
    ValidarCuerpo(EsquemaConfiguracion),
    C.ActualizarConfiguracion,
  );
  R.get(
    "/feriados",
    AutorizarRoles(RolesUsuario.Administrador),
    C.ListarFeriados,
  );
  R.post(
    "/feriados",
    AutorizarRoles(RolesUsuario.Administrador),
    ValidarCuerpo(EsquemaFeriado),
    C.GuardarFeriado,
  );
  R.get(
    "/alertas",
    AutorizarRoles(RolesUsuario.Administrador),
    C.ListarAlertas,
  );
  R.patch(
    "/alertas/:id/atendida",
    AutorizarRoles(RolesUsuario.Administrador),
    ValidarParametro("id", EsquemaId),
    C.MarcarAlertaAtendida,
  );
  R.get(
    "/auditoria",
    AutorizarRoles(RolesUsuario.Administrador, RolesUsuario.SuperAdministrador),
    C.ListarAuditoria,
  );
  R.post(
    "/administradores",
    AutorizarRoles(RolesUsuario.SuperAdministrador),
    ValidarCuerpo(EsquemaCrearAdministrador),
    C.CrearAdministrador,
  );
  return R;
}