// Registra los intentos de notificación.

export class RepositorioNotificaciones {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async Crear(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "INSERT INTO notificaciones(destinatario,asunto,contenido) VALUES($1,$2,$3) RETURNING *",
      [D.Destinatario, D.Asunto, D.Contenido],
    );
    return R.rows[0];
  }
  async ListarPendientesReintento(Limite = 50, Cliente = this.BaseDatos) {
    const Resultado = await Cliente.query(
      `SELECT * FROM notificaciones
       WHERE estado IN ('PENDIENTE','ERROR') AND intentos<3
       ORDER BY fecha_creacion ASC LIMIT $1`,
      [Limite],
    );
    return Resultado.rows;
  }

  async MarcarEnviada(Id, Cliente = this.BaseDatos) {
    await Cliente.query(
      "UPDATE notificaciones SET estado='ENVIADA',fecha_envio=NOW(),intentos=intentos+1 WHERE id=$1",
      [Id],
    );
  }
  async MarcarError(Id, Mensaje, Cliente = this.BaseDatos) {
    await Cliente.query(
      "UPDATE notificaciones SET estado='ERROR',ultimo_error=$2,intentos=intentos+1 WHERE id=$1",
      [Id, Mensaje],
    );
  }
}