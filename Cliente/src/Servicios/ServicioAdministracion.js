// Agrupa las peticiones del panel de administración.

import { SolicitarApi } from "./ClienteApi.js";

export function ListarInspectores() {
  return SolicitarApi("/administracion/inspectores");
}

export function ListarCajeras() {
  return SolicitarApi("/administracion/cajeras");
}

export function ConsultarDni(Dni) {
  return SolicitarApi(`/administracion/trabajadores/dni/${Dni}`);
}

export function CrearTrabajador(Dni, Rol) {
  return SolicitarApi("/administracion/trabajadores", {
    method: "POST",
    body: JSON.stringify({ Dni, Rol }),
  });
}

export function CambiarHabilitacion(Id, Habilitado) {
  return SolicitarApi(`/administracion/trabajadores/${Id}/habilitacion`, {
    method: "PATCH",
    body: JSON.stringify({ Habilitado }),
  });
}

export function ListarConfiguraciones() {
  return SolicitarApi("/administracion/configuraciones");
}

export function GuardarConfiguracion(Clave, Valor) {
  return SolicitarApi("/administracion/configuraciones", {
    method: "PATCH",
    body: JSON.stringify({ Clave, Valor }),
  });
}

export function ListarFeriados() {
  return SolicitarApi("/administracion/feriados");
}

export function GuardarFeriado(Datos) {
  return SolicitarApi("/administracion/feriados", {
    method: "POST",
    body: JSON.stringify(Datos),
  });
}

export function ListarAuditoria() {
  return SolicitarApi("/administracion/auditoria");
}

export function CrearAdministrador(Dni) {
  return SolicitarApi("/administracion/administradores", {
    method: "POST",
    body: JSON.stringify({ Dni }),
  });
}

export function ListarAlertas() {
  return SolicitarApi("/administracion/alertas");
}

export function MarcarAlertaAtendida(Id) {
  return SolicitarApi(`/administracion/alertas/${Id}/atendida`, {
    method: "PATCH",
  });
}