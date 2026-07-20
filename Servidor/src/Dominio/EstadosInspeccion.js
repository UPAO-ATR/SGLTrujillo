// Define los estados válidos de una inspección.

import { ErrorAplicacion } from "./Errores.js";
export const EstadosInspeccion = Object.freeze({
  Pendiente: "PENDIENTE",
  PendienteEspera: "PENDIENTE_ESPERA",
  Realizada: "REALIZADA",
  Fallida: "FALLIDA",
});
// Permite resolver únicamente inspecciones pendientes.
export function ValidarResultadoInspeccion(Actual, Nuevo) {
  if (
    Actual !== EstadosInspeccion.Pendiente ||
    ![EstadosInspeccion.Realizada, EstadosInspeccion.Fallida].includes(Nuevo)
  ) {
    throw new ErrorAplicacion(
      `No se puede cambiar una inspección de ${Actual} a ${Nuevo}.`,
      "TRANSICION_INSPECCION_INVALIDA",
      409,
    );
  }
}