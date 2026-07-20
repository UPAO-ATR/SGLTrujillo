// Agrupa las peticiones relacionadas con inspecciones.

import { SolicitarApi } from "./ClienteApi.js";

function CrearConsulta(Filtros = {}) {
  const Parametros = new URLSearchParams();
  Object.entries(Filtros).forEach(([Clave, Valor]) => {
    if (Valor !== undefined && Valor !== null && Valor !== "")
      Parametros.set(Clave, Valor);
  });
  const Consulta = Parametros.toString();
  return Consulta ? `?${Consulta}` : "";
}

export function ListarInspecciones(Filtros) {
  return SolicitarApi(`/inspecciones${CrearConsulta(Filtros)}`);
}

export function ObtenerInspeccion(Id) {
  return SolicitarApi(`/inspecciones/${Id}`);
}

export function RegistrarResultadoInspeccion(Id, Resultado, Observaciones) {
  return SolicitarApi(`/inspecciones/${Id}`, {
    method: "PATCH",
    body: JSON.stringify({
      Resultado,
      Observaciones: Observaciones || undefined,
    }),
  });
}

export function ReprogramarInspecciones(Fecha) {
  return SolicitarApi("/inspecciones/tareas/reprogramar", {
    method: "POST",
    body: JSON.stringify({ Fecha }),
  });
}

export function PrepararInspeccionDemostracion(NumeroVisita) {
  return SolicitarApi("/inspecciones/demostracion/prepararHoy", {
    method: "POST",
    body: JSON.stringify({ NumeroVisita }),
  });
}