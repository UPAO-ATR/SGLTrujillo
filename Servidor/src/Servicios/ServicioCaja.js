import { Consultar, Transaccion, Uno } from "../BaseDatos/Conexion.js";
import { EstadosCaja, TiposSolicitudCaja } from "../Dominio/Constantes.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";
import { Auditar } from "./ServicioAuditoria.js";

export class ServicioCaja {
  constructor(Tiempo) {
    this.Tiempo = Tiempo;
  }

  async Actual(CajeroId) {
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Caja = await Uno(
      `SELECT c.*, u.nombre cajero_nombre
       FROM cajas c
       JOIN usuarios u ON u.id=c.cajero_id
       WHERE c.cajero_id=$1 AND c.fecha_operacion=$2
       ORDER BY c.id DESC
       LIMIT 1`,
      [CajeroId, Fecha]
    );
    const Solicitudes = await Consultar(
      "SELECT * FROM solicitudes_caja WHERE cajero_id=$1 AND estado='PENDIENTE' ORDER BY id DESC",
      [CajeroId]
    );
    const Movimientos = Caja
      ? await Consultar(
          "SELECT * FROM movimientos_caja WHERE caja_id=$1 ORDER BY id DESC LIMIT 20",
          [Caja.id]
        )
      : { rows: [] };
    return {
      Fecha,
      Caja,
      Solicitudes: Solicitudes.rows,
      Movimientos: Movimientos.rows
    };
  }

  async SolicitarApertura(CajeroId) {
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Existente = await Uno(
      "SELECT * FROM cajas WHERE cajero_id=$1 AND fecha_operacion=$2",
      [CajeroId, Fecha]
    );
    if (Existente && Existente.estado !== "RECHAZADA") {
      throw new ErrorAplicacion(
        "Ya existe una caja o solicitud para la fecha actual.",
        "CAJA_EXISTENTE",
        409
      );
    }
    const Resultado = await Transaccion(async (Cliente) => {
      const Caja = Existente
        ? await Cliente.query(
            "UPDATE cajas SET estado=$2, monto_inicial=0, efectivo_esperado=0, efectivo_contado=NULL, diferencia=NULL WHERE id=$1 RETURNING *",
            [Existente.id, EstadosCaja.SOLICITADA_APERTURA]
          )
        : await Cliente.query(
            "INSERT INTO cajas(cajero_id, fecha_operacion, estado) VALUES($1,$2,$3) RETURNING *",
            [CajeroId, Fecha, EstadosCaja.SOLICITADA_APERTURA]
          );
      const Solicitud = await Cliente.query(
        "INSERT INTO solicitudes_caja(caja_id, cajero_id, tipo, detalle) VALUES($1,$2,$3,$4) RETURNING *",
        [
          Caja.rows[0].id,
          CajeroId,
          TiposSolicitudCaja.APERTURA,
          "Solicitud de apertura de caja"
        ]
      );
      return { Caja: Caja.rows[0], Solicitud: Solicitud.rows[0] };
    });
    await Auditar(CajeroId, "SOLICITAR_APERTURA", "CAJA", Resultado.Caja.id);
    return Resultado.Solicitud;
  }

  async SolicitarInyeccion(CajeroId, Monto) {
    const Caja = await this.CajaAbierta(CajeroId);
    if (!Number.isFinite(Monto) || !(Monto > 0)) {
      throw new ErrorAplicacion(
        "El monto de inyección debe ser mayor que cero.",
        "MONTO_INVALIDO"
      );
    }
    const Resultado = await Consultar(
      "INSERT INTO solicitudes_caja(caja_id, cajero_id, tipo, monto, detalle) VALUES($1,$2,'INYECCION',$3,$4) RETURNING *",
      [Caja.id, CajeroId, Monto, "Solicitud de sencillo adicional"]
    );
    await Auditar(CajeroId, "SOLICITAR_INYECCION", "CAJA", Caja.id, { Monto });
    return Resultado.rows[0];
  }

  async SolicitarCierre(CajeroId, MontoContado) {
    const Caja = await this.CajaAbierta(CajeroId);
    if (!Number.isFinite(MontoContado) || MontoContado < 0) {
      throw new ErrorAplicacion(
        "El monto contado no puede ser negativo.",
        "MONTO_INVALIDO"
      );
    }
    await Consultar(
      "UPDATE cajas SET estado='SOLICITADA_CIERRE', efectivo_contado=$2 WHERE id=$1",
      [Caja.id, MontoContado]
    );
    const Resultado = await Consultar(
      "INSERT INTO solicitudes_caja(caja_id, cajero_id, tipo, monto_contado, detalle) VALUES($1,$2,'CIERRE',$3,$4) RETURNING *",
      [Caja.id, CajeroId, MontoContado, "Solicitud de cierre y arqueo"]
    );
    await Auditar(CajeroId, "SOLICITAR_CIERRE", "CAJA", Caja.id, {
      MontoContado
    });
    return Resultado.rows[0];
  }

  async CajaAbierta(CajeroId, Cliente = null) {
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Resultado = Cliente
      ? await Cliente.query(
          "SELECT * FROM cajas WHERE cajero_id=$1 AND fecha_operacion=$2 AND estado='ABIERTA'",
          [CajeroId, Fecha]
        )
      : await Consultar(
          "SELECT * FROM cajas WHERE cajero_id=$1 AND fecha_operacion=$2 AND estado='ABIERTA'",
          [CajeroId, Fecha]
        );
    const Caja = Resultado.rows[0];
    if (!Caja) {
      throw new ErrorAplicacion(
        "Debes tener una caja abierta y autorizada para continuar.",
        "CAJA_NO_ABIERTA",
        409
      );
    }
    return Caja;
  }

  async RegistrarCobroEfectivo(CajaId, Monto, Referencia, Cliente) {
    if (Monto <= 0) return;
    await Cliente.query(
      "UPDATE cajas SET efectivo_esperado=efectivo_esperado+$2 WHERE id=$1",
      [CajaId, Monto]
    );
    await Cliente.query(
      "INSERT INTO movimientos_caja(caja_id, tipo, monto, detalle, referencia) VALUES($1,'COBRO_EFECTIVO',$2,$3,$4)",
      [CajaId, Monto, "Cobro de trámite", Referencia]
    );
  }
}
