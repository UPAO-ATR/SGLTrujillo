// Agrupa las peticiones de inicio de sesión y contraseña.

import { SolicitarApi } from "./ClienteApi.js";

export function IniciarSesion(Correo, Contrasena) {
  return SolicitarApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({ Correo, Contrasena }),
  });
}

export function ObtenerSesion() {
  return SolicitarApi("/auth/sesion");
}

export function CambiarContrasena(Datos) {
  return SolicitarApi("/auth/cambiarContrasena", {
    method: "POST",
    body: JSON.stringify(Datos),
  });
}