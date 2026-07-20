// Registra y envía notificaciones del trámite.

export class ServicioNotificaciones {
  constructor(RepositorioNotificaciones, ClienteCorreo) {
    this.RepositorioNotificaciones = RepositorioNotificaciones;
    this.ClienteCorreo = ClienteCorreo;
  }
  // Registra el envío incluso cuando el proveedor falla.
  async Enviar(Destinatario, Asunto, Contenido, Cliente) {
    const Registro = await this.RepositorioNotificaciones.Crear(
      { Destinatario, Asunto, Contenido },
      Cliente,
    );
    try {
      await this.ClienteCorreo.Enviar(Destinatario, Asunto, Contenido);
      await this.RepositorioNotificaciones.MarcarEnviada(Registro.id, Cliente);
    } catch (Error) {
      await this.RepositorioNotificaciones.MarcarError(
        Registro.id,
        Error.message,
        Cliente,
      );
    }
    return Registro;
  }
  async ReintentarPendientes() {
    const Pendientes =
      await this.RepositorioNotificaciones.ListarPendientesReintento();
    for (const Notificacion of Pendientes) {
      try {
        await this.ClienteCorreo.Enviar(
          Notificacion.destinatario,
          Notificacion.asunto,
          Notificacion.contenido,
        );
        await this.RepositorioNotificaciones.MarcarEnviada(Notificacion.id);
      } catch (Error) {
        await this.RepositorioNotificaciones.MarcarError(
          Notificacion.id,
          Error.message,
        );
      }
    }
    return Pendientes.length;
  }
}