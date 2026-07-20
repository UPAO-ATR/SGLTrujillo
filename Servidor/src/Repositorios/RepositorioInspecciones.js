// Consulta y modifica inspecciones programadas.

export class RepositorioInspecciones {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async Crear(D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `INSERT INTO inspecciones(solicitud_id,inspector_id,numero_visita,estado,fecha_programada,hora_programada,orden_dia,prioridad_reprogramada) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        D.SolicitudId,
        D.InspectorId || null,
        D.NumeroVisita,
        D.Estado,
        D.FechaProgramada || null,
        D.HoraProgramada || null,
        D.OrdenDia || null,
        D.PrioridadReprogramada || false,
      ],
    );
    return R.rows[0];
  }
  async BuscarPorId(Id, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `SELECT i.*,s.estado estado_solicitud,s.codigo_inspeccion,s.codigo_pago,s.plano_ruta,s.plano_tipo,n.ruc,n.razon_social,n.domicilio_fiscal,n.ubigeo,n.correo,u.nombres inspector_nombres,u.apellido_paterno inspector_apellido,(SELECT anterior.observaciones FROM inspecciones anterior WHERE anterior.solicitud_id=i.solicitud_id AND anterior.numero_visita=1 LIMIT 1) observaciones_anteriores FROM inspecciones i JOIN solicitudes s ON s.id=i.solicitud_id JOIN negocios n ON n.id=s.negocio_id LEFT JOIN usuarios u ON u.id=i.inspector_id WHERE i.id=$1 LIMIT 1`,
      [Id],
    );
    return R.rows[0] || null;
  }
  async BuscarPorSolicitudYVisita(S, V, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM inspecciones WHERE solicitud_id=$1 AND numero_visita=$2 LIMIT 1",
      [S, V],
    );
    return R.rows[0] || null;
  }
  async Listar(F = {}, Cliente = this.BaseDatos) {
    const C = [],
      P = [];
    const A = (T, V) => {
      P.push(V);
      C.push(T.replace("?", `$${P.length}`));
    };
    if (F.FechaDesde) A("i.fecha_programada>=?", F.FechaDesde);
    if (F.FechaHasta) A("i.fecha_programada<=?", F.FechaHasta);
    if (F.Estado) A("i.estado=?", F.Estado);
    if (F.NombreNegocio)
      A("LOWER(n.razon_social) LIKE LOWER(?)", `%${F.NombreNegocio}%`);
    if (F.FechaExacta) A("i.fecha_programada=?", F.FechaExacta);
    const D = C.length ? `WHERE ${C.join(" AND ")}` : "";
    const R = await Cliente.query(
      `SELECT i.*,s.estado estado_solicitud,s.codigo_inspeccion,n.ruc,n.razon_social,n.domicilio_fiscal FROM inspecciones i JOIN solicitudes s ON s.id=i.solicitud_id JOIN negocios n ON n.id=s.negocio_id ${D} ORDER BY i.fecha_programada NULLS LAST,i.prioridad_reprogramada DESC,i.orden_dia NULLS LAST,i.fecha_creacion LIMIT 500`,
      P,
    );
    return R.rows;
  }
  async ContarPorFecha(F, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT COUNT(*)::int cantidad FROM inspecciones WHERE fecha_programada=$1 AND estado='PENDIENTE'",
      [F],
    );
    return R.rows[0].cantidad;
  }
  async ListarPorFecha(F, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM inspecciones WHERE fecha_programada=$1 AND estado='PENDIENTE' ORDER BY prioridad_reprogramada DESC,orden_dia NULLS LAST,fecha_creacion",
      [F],
    );
    return R.rows;
  }
  async ListarPendientesEspera(Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM inspecciones WHERE estado='PENDIENTE_ESPERA' ORDER BY fecha_creacion,id",
    );
    return R.rows;
  }
  async ListarNoRealizadasDelDia(F, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM inspecciones WHERE fecha_programada=$1 AND estado='PENDIENTE' ORDER BY orden_dia",
      [F],
    );
    return R.rows;
  }
  async Programar(Id, D, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "UPDATE inspecciones SET inspector_id=$2,estado=$3,fecha_programada=$4,hora_programada=$5,orden_dia=$6,prioridad_reprogramada=$7,fecha_actualizacion=NOW() WHERE id=$1 RETURNING *",
      [
        Id,
        D.InspectorId,
        D.Estado,
        D.FechaProgramada,
        D.HoraProgramada,
        D.OrdenDia,
        D.PrioridadReprogramada || false,
      ],
    );
    return R.rows[0] || null;
  }
  async RegistrarResultado(Id, Estado, Obs, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "UPDATE inspecciones SET estado=$2,observaciones=$3,fecha_realizacion=NOW(),fecha_actualizacion=NOW() WHERE id=$1 RETURNING *",
      [Id, Estado, Obs || null],
    );
    return R.rows[0] || null;
  }
  async LimpiarOrdenFecha(F, Cliente = this.BaseDatos) {
    await Cliente.query(
      "UPDATE inspecciones SET orden_dia=NULL,hora_programada=NULL WHERE fecha_programada=$1 AND estado='PENDIENTE'",
      [F],
    );
  }
  async ActualizarOrdenYHora(
    Id,
    Orden,
    Hora,
    Prioridad,
    Cliente = this.BaseDatos,
  ) {
    const R = await Cliente.query(
      "UPDATE inspecciones SET orden_dia=$2,hora_programada=$3,prioridad_reprogramada=$4,fecha_actualizacion=NOW() WHERE id=$1 RETURNING *",
      [Id, Orden, Hora, Prioridad],
    );
    return R.rows[0];
  }
  async MoverAFecha(Id, Fecha, Prioridad, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "UPDATE inspecciones SET estado='PENDIENTE',fecha_programada=$2,hora_programada=NULL,orden_dia=NULL,prioridad_reprogramada=$3,fecha_actualizacion=NOW() WHERE id=$1 RETURNING *",
      [Id, Fecha, Prioridad],
    );
    return R.rows[0];
  }
  async MoverAEspera(Id, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "UPDATE inspecciones SET estado='PENDIENTE_ESPERA',fecha_programada=NULL,hora_programada=NULL,orden_dia=NULL,prioridad_reprogramada=FALSE,fecha_actualizacion=NOW() WHERE id=$1 RETURNING *",
      [Id],
    );
    return R.rows[0];
  }
}