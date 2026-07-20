// Consulta y registra alertas administrativas.

export class RepositorioAlertas {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }

  async Crear(Datos, Cliente = this.BaseDatos) {
    const Resultado = await Cliente.query(
      `INSERT INTO alertas_administracion(cajera_id,caja_id,tipo,mensaje,detalles)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [
        Datos.CajeraId || null,
        Datos.CajaId || null,
        Datos.Tipo,
        Datos.Mensaje,
        Datos.Detalles || null,
      ],
    );
    return Resultado.rows[0];
  }

  async BuscarDescuadrePendiente(CajaId, Cliente = this.BaseDatos) {
    const Resultado = await Cliente.query(
      `SELECT * FROM alertas_administracion
       WHERE caja_id=$1 AND tipo='DESCUADRE_CAJA' AND atendida=FALSE
       ORDER BY fecha_creacion DESC LIMIT 1`,
      [CajaId],
    );
    return Resultado.rows[0] || null;
  }

  async ListarPendientes(Limite = 100, Cliente = this.BaseDatos) {
    const Resultado = await Cliente.query(
      `SELECT a.*,u.nombres,u.apellido_paterno,u.correo_institucional
       FROM alertas_administracion a
       LEFT JOIN usuarios u ON u.id=a.cajera_id
       WHERE a.atendida=FALSE
       ORDER BY a.fecha_creacion DESC
       LIMIT $1`,
      [Limite],
    );
    return Resultado.rows;
  }

  async MarcarAtendida(Id, Cliente = this.BaseDatos) {
    const Resultado = await Cliente.query(
      `UPDATE alertas_administracion
       SET atendida=TRUE,fecha_atencion=NOW()
       WHERE id=$1 RETURNING *`,
      [Id],
    );
    return Resultado.rows[0] || null;
  }
}