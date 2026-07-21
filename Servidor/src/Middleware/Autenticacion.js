import jwt from "jsonwebtoken";
import { Configuracion } from "../Configuracion/Configuracion.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";

export function Autenticar(Requerimiento, Respuesta, Siguiente) {
  const Encabezado = Requerimiento.headers.authorization || "";
  const Token = Encabezado.startsWith("Bearer ") ? Encabezado.slice(7) : "";
  if (!Token) {
    return Siguiente(new ErrorAplicacion("Debes iniciar sesión.", "NO_AUTENTICADO", 401));
  }
  try {
    Requerimiento.Usuario = jwt.verify(Token, Configuracion.ClaveJwt);
    Siguiente();
  } catch {
    Siguiente(new ErrorAplicacion("La sesión venció o no es válida.", "SESION_INVALIDA", 401));
  }
}

export function Autorizar(...Roles) {
  return (Requerimiento, Respuesta, Siguiente) => {
    if (!Requerimiento.Usuario || !Roles.includes(Requerimiento.Usuario.Rol)) {
      return Siguiente(new ErrorAplicacion("No tienes permiso para esta operación.", "SIN_PERMISO", 403));
    }
    Siguiente();
  };
}
