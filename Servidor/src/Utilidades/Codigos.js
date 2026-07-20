// Genera códigos únicos para pagos, inspecciones y documentos.

import { randomBytes } from "node:crypto";
const Caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function GenerarCodigoAleatorio(Longitud = 8) {
  const Bytes = randomBytes(Longitud);
  return Array.from(
    Bytes,
    (Valor) => Caracteres[Valor % Caracteres.length],
  ).join("");
}
export function GenerarCodigoPago() {
  return `PAGO${Date.now()}${GenerarCodigoAleatorio(5)}`;
}
export function GenerarNumeroBoleta(Id) {
  return `CP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Id).padStart(6, "0")}`;
}
export function GenerarNumeroLicencia(Id, Fecha = new Date()) {
  const Dia = Fecha.toISOString().slice(0, 10).replaceAll("-", "");
  return `LF-${Dia}-${String(Id).padStart(6, "0")}`;
}