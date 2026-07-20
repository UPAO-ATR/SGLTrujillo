// Consulta y modifica cajas, transacciones y sangrías.

export class RepositorioCaja {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async BuscarCajaDelDia(Cajera, Fecha, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM cajas WHERE cajera_id=$1 AND fecha=$2 LIMIT 1",
      [Cajera, Fecha],
    );
    return R.rows[0] || null;
  }
  async Abrir(Cajera, Fecha, Fondo, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "INSERT INTO cajas(cajera_id,fecha,fondo_inicial) VALUES($1,$2,$3) RETURNING *",
      [Cajera, Fecha, Fondo],
    );
    return R.rows[0];
  }
  async BuscarTransaccionPorPago(Pago, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM transacciones_caja WHERE pago_id=$1 LIMIT 1",
      [Pago],
    );
    return R.rows[0] || null;
  }
  async RegistrarTransaccion(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "INSERT INTO transacciones_caja(caja_id,solicitud_id,pago_id,medio_pago,monto,referencia) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        D.CajaId,
        D.SolicitudId || null,
        D.PagoId || null,
        D.MedioPago,
        D.Monto,
        D.Referencia || null,
      ],
    );
    return R.rows[0];
  }
  async RegistrarSangria(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "INSERT INTO sangrias(caja_id,monto,motivo) VALUES($1,$2,$3) RETURNING *",
      [D.CajaId, D.Monto, D.Motivo],
    );
    return R.rows[0];
  }
  async ObtenerTotales(Id, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `SELECT COALESCE(SUM(CASE WHEN medio_pago='EFECTIVO' THEN monto ELSE 0 END),0)::numeric efectivo,COALESCE(SUM(CASE WHEN medio_pago='YAPE' THEN monto ELSE 0 END),0)::numeric yape,COALESCE(SUM(CASE WHEN medio_pago='PLIN' THEN monto ELSE 0 END),0)::numeric plin,COALESCE((SELECT SUM(monto) FROM sangrias WHERE caja_id=$1),0)::numeric sangrias FROM transacciones_caja WHERE caja_id=$1`,
      [Id],
    );
    return R.rows[0];
  }
  async ListarTransacciones(Id, Medio, Cliente = this.BaseDatos) {
    const P = [Id];
    let C = "";
    if (Medio) {
      P.push(Medio);
      C = "AND medio_pago=$2";
    }
    const R = await Cliente.query(
      `SELECT * FROM transacciones_caja WHERE caja_id=$1 ${C} ORDER BY fecha_creacion DESC`,
      P,
    );
    return R.rows;
  }
  async Cerrar(Id, Fisico, Esperado, Diferencia, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "UPDATE cajas SET estado='CERRADA',efectivo_fisico_cierre=$2,efectivo_esperado_cierre=$3,diferencia=$4,fecha_cierre=NOW() WHERE id=$1 RETURNING *",
      [Id, Fisico, Esperado, Diferencia],
    );
    return R.rows[0];
  }
}