// Consulta y modifica pagos del trámite.

export class RepositorioPagos {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async Crear(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `INSERT INTO pagos(solicitud_id,medio_pago,monto_oficial,monto_cobrado,clave_idempotencia) VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [
        D.SolicitudId,
        D.MedioPago,
        D.MontoOficial,
        D.MontoCobrado,
        D.ClaveIdempotencia,
      ],
    );
    return R.rows[0];
  }
  async BuscarPorId(Id, Cliente = this.BaseDatos) {
    const R = await Cliente.query("SELECT * FROM pagos WHERE id=$1 LIMIT 1", [
      Id,
    ]);
    return R.rows[0] || null;
  }
  async BuscarConfirmadoPorSolicitud(SolicitudId, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM pagos WHERE solicitud_id=$1 AND estado='CONFIRMADO' LIMIT 1",
      [SolicitudId],
    );
    return R.rows[0] || null;
  }
  async Confirmar(Id, Referencia, Respuesta, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "UPDATE pagos SET estado='CONFIRMADO',referencia_externa=$2,respuesta_proveedor=$3,fecha_confirmacion=COALESCE(fecha_confirmacion,NOW()) WHERE id=$1 RETURNING *",
      [Id, Referencia, Respuesta],
    );
    return R.rows[0];
  }
}