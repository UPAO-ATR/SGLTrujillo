// Agrupa las peticiones de caja, arqueo y sangrías.

import { SolicitarApi } from "./ClienteApi.js";

export function ObtenerCajaActual(MedioPago = "") {
  const Consulta = MedioPago
    ? `?MedioPago=${encodeURIComponent(MedioPago)}`
    : "";
  return SolicitarApi(`/caja/actual${Consulta}`);
}

export function AbrirCaja(FondoInicial = 1000) {
  return SolicitarApi("/caja/abrir", {
    method: "POST",
    body: JSON.stringify({ FondoInicial: Number(FondoInicial) }),
  });
}

export function RegistrarTransaccionCaja(Datos) {
  return SolicitarApi("/caja/transacciones", {
    method: "POST",
    body: JSON.stringify(Datos),
  });
}

export function RegistrarSangria(Monto, Motivo) {
  return SolicitarApi("/caja/sangrias", {
    method: "POST",
    body: JSON.stringify({ Monto: Number(Monto), Motivo }),
  });
}

export function RealizarArqueo(EfectivoFisico) {
  return SolicitarApi("/caja/arqueo", {
    method: "POST",
    body: JSON.stringify({ EfectivoFisico: Number(EfectivoFisico) }),
  });
}

export function CerrarCaja(EfectivoFisico) {
  return SolicitarApi("/caja/cerrar", {
    method: "POST",
    body: JSON.stringify({ EfectivoFisico: Number(EfectivoFisico) }),
  });
}