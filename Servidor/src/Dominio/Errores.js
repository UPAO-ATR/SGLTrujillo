// Define errores controlados con mensajes y códigos HTTP claros.

export class ErrorAplicacion extends Error {
  constructor(
    Mensaje,
    Codigo = "ERROR_APLICACION",
    EstadoHttp = 400,
    Detalles = null,
  ) {
    super(Mensaje);
    this.name = "ErrorAplicacion";
    this.Codigo = Codigo;
    this.EstadoHttp = EstadoHttp;
    this.Detalles = Detalles;
  }
}
export class ErrorNoEncontrado extends ErrorAplicacion {
  constructor(Mensaje = "No se encontró el recurso solicitado.") {
    super(Mensaje, "NO_ENCONTRADO", 404);
  }
}
export class ErrorNoAutorizado extends ErrorAplicacion {
  constructor(Mensaje = "No tiene autorización para realizar esta acción.") {
    super(Mensaje, "NO_AUTORIZADO", 403);
  }
}
export class ErrorConflicto extends ErrorAplicacion {
  constructor(Mensaje) {
    super(Mensaje, "CONFLICTO", 409);
  }
}