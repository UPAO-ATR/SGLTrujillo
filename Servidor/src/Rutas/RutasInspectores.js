// Define las rutas administrativas del inspector.

import { Router } from "express";
import { AutorizarRoles } from "../Middleware/Autenticacion.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
import { ValidarCuerpo, ValidarParametro } from "../Middleware/Validacion.js";
import {
  EsquemaCrearInspector,
  EsquemaCambiarHabilitacion,
  EsquemaId,
} from "../Validadores/Esquemas.js";
export function CrearRutasInspectores(C, A) {
  const R = Router();
  R.use(A, AutorizarRoles(RolesUsuario.Administrador));
  R.get("/", C.ListarInspectores);
  R.post("/", ValidarCuerpo(EsquemaCrearInspector), C.CrearInspector);
  R.patch(
    "/:id/disponibilidad",
    ValidarParametro("id", EsquemaId),
    ValidarCuerpo(EsquemaCambiarHabilitacion),
    C.CambiarHabilitacion,
  );
  return R;
}