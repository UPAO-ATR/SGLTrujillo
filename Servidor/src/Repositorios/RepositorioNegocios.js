// Consulta y actualiza los datos de los negocios.

export class RepositorioNegocios {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async BuscarPorRuc(Ruc, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM negocios WHERE ruc=$1 LIMIT 1",
      [Ruc],
    );
    return R.rows[0] || null;
  }
  async CrearOActualizar(Datos, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `INSERT INTO negocios(ruc,razon_social,domicilio_fiscal,ubigeo,correo) VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(ruc) DO UPDATE SET razon_social=EXCLUDED.razon_social,domicilio_fiscal=EXCLUDED.domicilio_fiscal,ubigeo=EXCLUDED.ubigeo,correo=EXCLUDED.correo,fecha_actualizacion=NOW() RETURNING *`,
      [
        Datos.Ruc,
        Datos.RazonSocial,
        Datos.DomicilioFiscal,
        Datos.Ubigeo,
        Datos.Correo,
      ],
    );
    return R.rows[0];
  }
}