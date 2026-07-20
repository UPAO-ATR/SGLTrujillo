// Consulta y guarda constancias de pago.

export class RepositorioBoletas {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async Crear(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "INSERT INTO boletas(solicitud_id,numero_boleta,ruta_archivo) VALUES($1,$2,$3) ON CONFLICT(solicitud_id) DO UPDATE SET ruta_archivo=EXCLUDED.ruta_archivo RETURNING *",
      [D.SolicitudId, D.NumeroBoleta, D.RutaArchivo],
    );
    return R.rows[0];
  }
  async BuscarPorSolicitud(Id, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM boletas WHERE solicitud_id=$1 LIMIT 1",
      [Id],
    );
    return R.rows[0] || null;
  }
}