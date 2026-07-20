// Convierte los errores internos en respuestas seguras.

import multer from "multer";
import { ZodError } from "zod";
import { ErrorAplicacion } from "../Dominio/Errores.js";
export function RutaNoEncontrada(Solicitud, Respuesta) {
  Respuesta.status(404).json({
    Exito: false,
    Codigo: "RUTA_NO_ENCONTRADA",
    Mensaje: "La ruta solicitada no existe.",
  });
}
function NormalizarError(Error) {
  if (Error instanceof ZodError)
    return {
      EstadoHttp: 400,
      Codigo: "DATOS_INVALIDOS",
      Mensaje: Error.issues.map((P) => P.message).join(" "),
      Detalles: Error.issues,
    };
  if (Error instanceof multer.MulterError)
    return {
      EstadoHttp: 400,
      Codigo: "ARCHIVO_INVALIDO",
      Mensaje:
        Error.code === "LIMIT_FILE_SIZE"
          ? "El archivo supera el tamaño máximo admitido por el servidor."
          : "No fue posible recibir el archivo.",
      Detalles: null,
    };
  return {
    EstadoHttp:
      Error.EstadoHttp ||
      (Error instanceof ErrorAplicacion ? Error.EstadoHttp : 500),
    Codigo: Error.Codigo || "ERROR_INTERNO",
    Mensaje: Error.message || "Ocurrió un error interno.",
    Detalles: Error.Detalles || null,
  };
}
// Oculta detalles internos y devuelve un mensaje controlado.
export function ManejarErrores(Error, Solicitud, Respuesta, Siguiente) {
  console.error(`[${Solicitud.method} ${Solicitud.originalUrl}]`, Error);
  const N = NormalizarError(Error);
  const Produccion = process.env.NODE_ENV === "production";
  Respuesta.status(N.EstadoHttp).json({
    Exito: false,
    Codigo: N.Codigo,
    Mensaje:
      N.EstadoHttp === 500 && Produccion
        ? "Ocurrió un error interno. Intente nuevamente."
        : N.Mensaje,
    Detalles: N.EstadoHttp < 500 ? N.Detalles : null,
  });
}