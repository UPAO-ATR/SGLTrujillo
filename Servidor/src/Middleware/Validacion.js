// Valida entradas con los esquemas definidos.

import { ValidarEsquema } from "../Validadores/Esquemas.js";
// Detiene la petición cuando el cuerpo no cumple el esquema.
export function ValidarCuerpo(Esquema) {
  return function Validar(Solicitud, Respuesta, Siguiente) {
    try {
      Solicitud.DatosValidados = ValidarEsquema(Esquema, Solicitud.body);
      Siguiente();
    } catch (Error) {
      Siguiente(Error);
    }
  };
}
// Valida parámetros individuales antes de ejecutar la ruta.
export function ValidarParametro(Nombre, Esquema) {
  return function Validar(Solicitud, Respuesta, Siguiente) {
    try {
      Solicitud.params[Nombre] = ValidarEsquema(
        Esquema,
        Solicitud.params[Nombre],
      );
      Siguiente();
    } catch (Error) {
      Siguiente(Error);
    }
  };
}