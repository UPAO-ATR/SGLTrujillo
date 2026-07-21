export class ErrorAplicacion extends Error {
  constructor(Mensaje, Codigo = "ERROR_APLICACION", EstadoHttp = 400, Detalles = null) {
    super(Mensaje);
    this.name = "ErrorAplicacion";
    this.Codigo = Codigo;
    this.EstadoHttp = EstadoHttp;
    this.Detalles = Detalles;
  }
}
