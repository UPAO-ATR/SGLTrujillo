import multer from "multer";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";

export function RutaNoEncontrada(Requerimiento, Respuesta, Siguiente) {
  Siguiente(new ErrorAplicacion("La ruta solicitada no existe.", "RUTA_NO_ENCONTRADA", 404));
}

export function ManejarErrores(Error, Requerimiento, Respuesta, Siguiente) {
  let Salida = Error;
  if (Error instanceof multer.MulterError) {
    Salida = new ErrorAplicacion(
      Error.code === "LIMIT_FILE_SIZE" ? "El archivo supera el límite de 10 MB." : "No se pudo procesar el archivo.",
      "ERROR_ARCHIVO",
      422
    );
  }
  const Estado = Salida.EstadoHttp || 500;
  if (Estado >= 500) console.error(`[${Requerimiento.method} ${Requerimiento.originalUrl}]`, Error);
  Respuesta.status(Estado).json({
    Exito: false,
    Mensaje: Salida.message || "Ocurrió un error inesperado.",
    Codigo: Salida.Codigo || "ERROR_INTERNO",
    Detalles: Salida.Detalles || null
  });
}
