// Registra las acciones relevantes del sistema.

export class ServicioAuditoria {
  constructor(RepositorioAuditoria) {
    this.RepositorioAuditoria = RepositorioAuditoria;
  }
  async Registrar(Usuario, Accion, Entidad, EntidadId, Detalles, Cliente) {
    const NombreUsuario = Usuario
      ? `${Usuario.nombres || ""} ${Usuario.apellido_paterno || ""}`.trim()
      : "SISTEMA";
    return this.RepositorioAuditoria.Registrar(
      {
        UsuarioId: Usuario?.id,
        NombreUsuario,
        Accion,
        Entidad,
        EntidadId,
        Detalles,
      },
      Cliente,
    );
  }
}