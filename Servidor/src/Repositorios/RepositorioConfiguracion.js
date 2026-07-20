// Consulta y guarda parámetros y feriados.

export class RepositorioConfiguracion {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async ObtenerValor(Clave, Predeterminado, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT valor FROM configuraciones WHERE clave=$1 LIMIT 1",
      [Clave],
    );
    return R.rows[0]?.valor ?? Predeterminado;
  }
  async Listar(Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM configuraciones ORDER BY clave",
    );
    return R.rows;
  }
  async Guardar(Clave, Valor, Tipo, UsuarioId, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `INSERT INTO configuraciones(clave,valor,tipo,usuario_actualizacion_id) VALUES($1,$2,$3,$4) ON CONFLICT(clave) DO UPDATE SET valor=EXCLUDED.valor,tipo=EXCLUDED.tipo,usuario_actualizacion_id=EXCLUDED.usuario_actualizacion_id,fecha_actualizacion=NOW() RETURNING *`,
      [Clave, String(Valor), Tipo, UsuarioId || null],
    );
    return R.rows[0];
  }
  async EsFeriado(Fecha, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT 1 FROM feriados WHERE fecha=$1 AND activo=TRUE LIMIT 1",
      [Fecha],
    );
    return R.rowCount > 0;
  }
  async ListarFeriados(Cliente = this.BaseDatos) {
    const R = await Cliente.query("SELECT * FROM feriados ORDER BY fecha");
    return R.rows;
  }
  async GuardarFeriado(
    Fecha,
    Descripcion,
    Activo = true,
    Cliente = this.BaseDatos,
  ) {
    const R = await Cliente.query(
      `INSERT INTO feriados(fecha,descripcion,activo) VALUES($1,$2,$3) ON CONFLICT(fecha) DO UPDATE SET descripcion=EXCLUDED.descripcion,activo=EXCLUDED.activo RETURNING *`,
      [Fecha, Descripcion, Activo],
    );
    return R.rows[0];
  }
}