// Agrupa las peticiones de solicitudes, pagos y licencias.

import { SolicitarApi } from "./ClienteApi.js";

export function ConsultarRuc(Ruc) {
  return SolicitarApi(`/negocios/ruc/${Ruc}`);
}

export function CrearSolicitud(Datos) {
  return SolicitarApi("/solicitudes", {
    method: "POST",
    body: JSON.stringify(Datos),
  });
}

export function SubirPlano(SolicitudId, Codigo, Archivo) {
  const Formulario = new FormData();
  Formulario.append("Plano", Archivo);
  return SolicitarApi(
    `/solicitudes/${SolicitudId}/plano?Codigo=${encodeURIComponent(Codigo)}`,
    {
      method: "POST",
      body: Formulario,
    },
  );
}

export function ConsultarSeguimiento(Codigo) {
  return SolicitarApi(`/solicitudes/${Codigo}`);
}

export function CrearPago(SolicitudId, Codigo, MedioPago, Referencia) {
  return SolicitarApi(
    `/solicitudes/${SolicitudId}/checkout?Codigo=${encodeURIComponent(Codigo)}`,
    {
      method: "POST",
      body: JSON.stringify({ MedioPago, Referencia: Referencia || undefined }),
    },
  );
}

export function ConfirmarPagoDemostracion(PagoId, Codigo) {
  return SolicitarApi(
    `/pagos/${PagoId}/confirmarDemostracion?Codigo=${encodeURIComponent(Codigo)}`,
    {
      method: "POST",
    },
  );
}

export function ConfirmarPagoPresencial(PagoId) {
  return SolicitarApi(`/pagos/${PagoId}/confirmarPresencial`, {
    method: "POST",
  });
}

export function DescargarConstancia(SolicitudId, Codigo) {
  return SolicitarApi(
    `/boletas/${SolicitudId}/descargar?Codigo=${encodeURIComponent(Codigo)}`,
  );
}

export function DescargarLicencia(SolicitudId, Codigo) {
  return SolicitarApi(
    `/licencias/${SolicitudId}/descargar?Codigo=${encodeURIComponent(Codigo)}`,
  );
}

export function ObtenerPlano(SolicitudId) {
  return SolicitarApi(`/solicitudes/${SolicitudId}/plano/descargar`);
}