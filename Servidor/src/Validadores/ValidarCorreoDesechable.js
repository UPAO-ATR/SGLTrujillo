// Rechaza correos temporales o desechables.

import { ErrorAplicacion } from "../Dominio/Errores.js";
const DominiosDesechables = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
]);
export function ValidarCorreoNoDesechable(Correo) {
  const Dominio = String(Correo).toLowerCase().split("@")[1];
  if (DominiosDesechables.has(Dominio))
    throw new ErrorAplicacion(
      "No se permiten correos temporales o desechables.",
      "CORREO_DESECHABLE",
      400,
    );
  return true;
}