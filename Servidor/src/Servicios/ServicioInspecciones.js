import { Transaccion, Uno, Consultar } from "../BaseDatos/Conexion.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";
import { FormatearFecha } from "../Utilidades/Fechas.js";
import { NumeroLicencia } from "../Utilidades/Codigos.js";
import { Auditar } from "./ServicioAuditoria.js";

export class ServicioInspecciones {
  constructor({ Tiempo, Programacion, Almacen }) {
    this.Tiempo = Tiempo;
    this.Programacion = Programacion;
    this.Almacen = Almacen;
  }

  async Hoy(InspectorId) {
    await this.Tiempo.ProcesarEventos();
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Resultado = await Consultar(
      `SELECT i.id,i.numero,i.fecha_programada,t.id tramite_id,
              t.ruc,t.codigo,n.razon_social,l.direccion
       FROM inspecciones i
       JOIN tramites t ON t.id=i.tramite_id
       JOIN negocios n ON n.id=t.negocio_id
       JOIN locales l ON l.id=t.local_id
       WHERE i.inspector_id=$1
         AND i.fecha_programada=$2
         AND i.estado='PENDIENTE'
       ORDER BY i.id
       LIMIT 4`,
      [InspectorId, Fecha]
    );
    return { Fecha, Inspecciones: Resultado.rows };
  }

  async Detalle(InspectorId, InspeccionId) {
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Dato = await Uno(
      `SELECT i.*,t.ruc,t.codigo,t.plano_clave,
              n.razon_social,l.direccion,
              previa.observaciones observaciones_anteriores
       FROM inspecciones i
       JOIN tramites t ON t.id=i.tramite_id
       JOIN negocios n ON n.id=t.negocio_id
       JOIN locales l ON l.id=t.local_id
       LEFT JOIN inspecciones previa
         ON previa.tramite_id=t.id AND previa.numero=1
       WHERE i.id=$1
         AND i.inspector_id=$2
         AND i.fecha_programada=$3
         AND i.estado='PENDIENTE'`,
      [InspeccionId, InspectorId, Fecha]
    );
    if (!Dato) {
      throw new ErrorAplicacion(
        "La inspección no está disponible en la fecha actual.",
        "INSPECCION_NO_DISPONIBLE",
        404
      );
    }
    return Dato;
  }

  async Aprobar(InspectorId, InspeccionId) {
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Vencimiento =
      await this.Programacion.Vencimiento(Fecha);

    const Resultado = await Transaccion(async (Cliente) => {
      const Consulta = await Cliente.query(
        `SELECT i.*,t.id tramite_id
         FROM inspecciones i
         JOIN tramites t ON t.id=i.tramite_id
         WHERE i.id=$1
           AND i.inspector_id=$2
           AND i.fecha_programada=$3
           AND i.estado='PENDIENTE'
         FOR UPDATE`,
        [InspeccionId, InspectorId, Fecha]
      );
      const Inspeccion = Consulta.rows[0];
      if (!Inspeccion) {
        throw new ErrorAplicacion(
          "La inspección no está disponible.",
          "INSPECCION_NO_DISPONIBLE",
          404
        );
      }

      await Cliente.query(
        "UPDATE inspecciones SET estado='APROBADA', realizada_en=NOW() WHERE id=$1",
        [Inspeccion.id]
      );
      const Numero = NumeroLicencia(Inspeccion.tramite_id);
      await Cliente.query(
        `UPDATE tramites
         SET estado='APROBADO',
             fecha_aprobacion=$2,
             fecha_vencimiento=$3,
             numero_licencia=$4
         WHERE id=$1`,
        [Inspeccion.tramite_id, Fecha, Vencimiento, Numero]
      );
      return {
        TramiteId: Inspeccion.tramite_id,
        Numero
      };
    });

    await Auditar(
      InspectorId,
      "APROBAR_INSPECCION",
      "INSPECCION",
      InspeccionId
    );
    return {
      ...Resultado,
      FechaVencimiento: Vencimiento,
      FechaVencimientoFormateada: FormatearFecha(Vencimiento)
    };
  }

  async Observar(InspectorId, InspeccionId, Observaciones) {
    const Texto = String(Observaciones || "").trim();
    if (Texto.length < 10) {
      throw new ErrorAplicacion(
        "Las observaciones deben tener al menos 10 caracteres.",
        "OBSERVACION_CORTA"
      );
    }
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Inspeccion = await Uno(
      `SELECT i.*,t.correo,t.id tramite_id
       FROM inspecciones i
       JOIN tramites t ON t.id=i.tramite_id
       WHERE i.id=$1
         AND i.inspector_id=$2
         AND i.fecha_programada=$3
         AND i.estado='PENDIENTE'`,
      [InspeccionId, InspectorId, Fecha]
    );
    if (!Inspeccion) {
      throw new ErrorAplicacion(
        "La inspección no está disponible.",
        "INSPECCION_NO_DISPONIBLE",
        404
      );
    }

    if (Number(Inspeccion.numero) === 2) {
      await Transaccion(async (Cliente) => {
        await Cliente.query(
          "UPDATE inspecciones SET estado='RECHAZADA', observaciones=$2, realizada_en=NOW() WHERE id=$1",
          [Inspeccion.id, Texto]
        );
        await Cliente.query(
          "UPDATE tramites SET estado='RECHAZADO' WHERE id=$1",
          [Inspeccion.tramite_id]
        );
      });
      await Auditar(
        InspectorId,
        "RECHAZAR_SEGUNDA_INSPECCION",
        "INSPECCION",
        InspeccionId,
        { Observaciones: Texto }
      );
      return { Estado: "RECHAZADO" };
    }

    const FechaSegunda =
      await this.Programacion.ProximaFecha(Fecha, 30);
    const Inspector = await Uno(
      "SELECT id FROM usuarios WHERE rol='INSPECTOR' AND activo=TRUE"
    );

    await Transaccion(async (Cliente) => {
      await Cliente.query(
        "UPDATE inspecciones SET estado='OBSERVADA', observaciones=$2, realizada_en=NOW() WHERE id=$1",
        [Inspeccion.id, Texto]
      );
      await Cliente.query(
        "UPDATE tramites SET estado='EN_OBSERVACION' WHERE id=$1",
        [Inspeccion.tramite_id]
      );
      await Cliente.query(
        `INSERT INTO inspecciones(
           tramite_id,numero,fecha_programada,inspector_id
         )
         VALUES($1,2,$2,$3)`,
        [Inspeccion.tramite_id, FechaSegunda, Inspector.id]
      );
    });

    await this.Tiempo.CrearNotificacion(
      `observacion-${Inspeccion.tramite_id}`,
      Inspeccion.tramite_id,
      Inspeccion.correo,
      "Observaciones de primera inspección",
      `Las observaciones de tu primera inspección son las siguientes: ${Texto}. Tu segunda inspección ha sido programada para ${FormatearFecha(FechaSegunda)}.`,
      Fecha
    );
    await this.Tiempo.ProcesarEventos();
    await Auditar(
      InspectorId,
      "OBSERVAR_PRIMERA_INSPECCION",
      "INSPECCION",
      InspeccionId,
      { Observaciones: Texto, FechaSegunda }
    );
    return {
      Estado: "EN_OBSERVACION",
      FechaSegunda,
      FechaSegundaFormateada: FormatearFecha(FechaSegunda)
    };
  }

  async DescargarPlano(InspectorId, InspeccionId) {
    const Detalle = await this.Detalle(InspectorId, InspeccionId);
    return this.Almacen.Leer(Detalle.plano_clave);
  }
}
