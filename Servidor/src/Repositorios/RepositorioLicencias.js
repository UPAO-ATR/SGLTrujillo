// Consulta y guarda licencias emitidas.

export class RepositorioLicencias {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async Crear(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `INSERT INTO licencias(solicitud_id,negocio_id,numero_licencia,expediente,ruta_archivo,fecha_generacion,fecha_vencimiento) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        D.SolicitudId,
        D.NegocioId,
        D.NumeroLicencia,
        D.Expediente,
        D.RutaArchivo,
        D.FechaGeneracion,
        D.FechaVencimiento,
      ],
    );
    return R.rows[0];
  }
  async BuscarPorSolicitud(Id, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM licencias WHERE solicitud_id=$1 LIMIT 1",
      [Id],
    );
    return R.rows[0] || null;
  }
  async BuscarUltimaPorRuc(Ruc, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `SELECT l.* FROM licencias l JOIN negocios n ON n.id=l.negocio_id WHERE n.ruc=$1 ORDER BY l.fecha_generacion DESC LIMIT 1`,
      [Ruc],
    );
    return R.rows[0] || null;
  }
}