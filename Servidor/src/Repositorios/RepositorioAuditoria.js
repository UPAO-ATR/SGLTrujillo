// Registra acciones en la auditoría de solo inserción.

export class RepositorioAuditoria {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async Registrar(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "INSERT INTO auditorias(usuario_id,nombre_usuario,accion,entidad,entidad_id,detalles) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        D.UsuarioId || null,
        D.NombreUsuario,
        D.Accion,
        D.Entidad,
        String(D.EntidadId || ""),
        D.Detalles || null,
      ],
    );
    return R.rows[0];
  }
  async Listar(Limite = 300, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM auditorias ORDER BY fecha_creacion DESC LIMIT $1",
      [Limite],
    );
    return R.rows;
  }
}