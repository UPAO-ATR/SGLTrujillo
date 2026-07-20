// Valida la sesión y el rol antes de continuar.

import jwt from "jsonwebtoken";
import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
import { ErrorNoAutorizado } from "../Dominio/Errores.js";
// Rechaza peticiones sin un token válido.
export function CrearMiddlewareAutenticacion(RepositorioUsuarios) {
  return async function Autenticar(Solicitud, Respuesta, Siguiente) {
    try {
      const Encabezado = Solicitud.headers.authorization || "";
      const Token = Encabezado.startsWith("Bearer ")
        ? Encabezado.slice(7)
        : null;
      if (!Token)
        throw new ErrorNoAutorizado("Debe iniciar sesión para continuar.");
      const Carga = jwt.verify(Token, ConfiguracionEntorno.ClaveJwt, {
        issuer: "sgl-trujillo",
      });
      const Usuario = await RepositorioUsuarios.BuscarPorId(Carga.Id);
      if (!Usuario || !Usuario.habilitado)
        throw new ErrorNoAutorizado(
          "La sesión no es válida o el usuario está deshabilitado.",
        );
      Solicitud.Usuario = Usuario;
      Siguiente();
    } catch (Error) {
      if (
        Error.name === "JsonWebTokenError" ||
        Error.name === "TokenExpiredError"
      )
        return Siguiente(
          new ErrorNoAutorizado("La sesión venció. Inicie sesión nuevamente."),
        );
      Siguiente(Error);
    }
  };
}
export function CrearMiddlewareAutenticacionOpcional(RepositorioUsuarios) {
  return async function AutenticarOpcional(Solicitud, Respuesta, Siguiente) {
    try {
      const E = Solicitud.headers.authorization || "";
      const Token = E.startsWith("Bearer ") ? E.slice(7) : null;
      if (!Token) return Siguiente();
      const C = jwt.verify(Token, ConfiguracionEntorno.ClaveJwt, {
        issuer: "sgl-trujillo",
      });
      const U = await RepositorioUsuarios.BuscarPorId(C.Id);
      if (U?.habilitado) Solicitud.Usuario = U;
      Siguiente();
    } catch {
      Siguiente();
    }
  };
}
// Comprueba el rol después de validar la sesión.
export function AutorizarRoles(...Roles) {
  return function Autorizar(Solicitud, Respuesta, Siguiente) {
    if (!Solicitud.Usuario || !Roles.includes(Solicitud.Usuario.rol))
      return Siguiente(
        new ErrorNoAutorizado("Su rol no permite realizar esta acción."),
      );
    Siguiente();
  };
}