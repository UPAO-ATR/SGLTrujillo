// Define las rutas protegidas del módulo de caja.

import { Router } from "express";
import { AutorizarRoles } from "../Middleware/Autenticacion.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
import { ValidarCuerpo } from "../Middleware/Validacion.js";
import {
  EsquemaAbrirCaja,
  EsquemaTransaccionCaja,
  EsquemaRegistrarSangria,
  EsquemaArqueo,
} from "../Validadores/Esquemas.js";
export function CrearRutasCaja(C, A) {
  const R = Router();
  R.use(A, AutorizarRoles(RolesUsuario.Cajera));
  R.get("/actual", C.ObtenerActual);
  R.post("/abrir", ValidarCuerpo(EsquemaAbrirCaja), C.Abrir);
  R.post(
    "/transacciones",
    ValidarCuerpo(EsquemaTransaccionCaja),
    C.RegistrarTransaccion,
  );
  R.post(
    "/sangrias",
    ValidarCuerpo(EsquemaRegistrarSangria),
    C.RegistrarSangria,
  );
  R.post("/arqueo", ValidarCuerpo(EsquemaArqueo), C.RealizarArqueo);
  R.post("/cerrar", ValidarCuerpo(EsquemaArqueo), C.Cerrar);
  return R;
}