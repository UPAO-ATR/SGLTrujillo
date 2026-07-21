import { Consultar, Uno } from "../BaseDatos/Conexion.js";
import { Configuracion } from "../Configuracion/Configuracion.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";
import { FechaReal, FechaValida, FormatearFecha } from "../Utilidades/Fechas.js";

export class ServicioTiempo {
  constructor(Correo) {
    this.Correo = Correo;
  }

  async ObtenerFecha() {
    const Dato = await Uno("SELECT valor FROM configuracion WHERE clave='fecha_simulada'");
    return Dato?.valor || FechaReal();
  }

  async CambiarFecha(Fecha) {
    if (!Configuracion.ModoDemostracion) {
      throw new ErrorAplicacion(
        "El simulador solo está disponible en modo demostración.",
        "SIMULADOR_DESACTIVADO",
        403
      );
    }
    if (!FechaValida(Fecha)) {
      throw new ErrorAplicacion("La fecha indicada no es válida.", "FECHA_INVALIDA");
    }
    await Consultar(
      "INSERT INTO configuracion(clave, valor, actualizado_en) VALUES('fecha_simulada',$1,NOW()) ON CONFLICT(clave) DO UPDATE SET valor=EXCLUDED.valor, actualizado_en=NOW()",
      [Fecha]
    );
    await this.ProcesarEventos();
    return { Fecha };
  }

  async CrearNotificacion(Clave, TramiteId, Destino, Asunto, Mensaje, Fecha) {
    await Consultar(
      `INSERT INTO notificaciones(clave, tramite_id, destino, asunto, mensaje, fecha_programada)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT(clave) DO NOTHING`,
      [Clave, TramiteId || null, Destino, Asunto, Mensaje, Fecha]
    );
  }

  async ProcesarEventos() {
    const Fecha = await this.ObtenerFecha();

    const PorVencer = await Consultar(
      `SELECT t.id, t.correo, t.codigo
       FROM tramites t
       WHERE t.estado='APROBADO' AND t.fecha_vencimiento <= $1`,
      [Fecha]
    );
    for (const Tramite of PorVencer.rows) {
      await Consultar("UPDATE tramites SET estado='VENCIDO' WHERE id=$1", [Tramite.id]);
      await this.CrearNotificacion(
        `vencimiento-${Tramite.id}`,
        Tramite.id,
        Tramite.correo,
        "Licencia vencida",
        "Tu licencia acaba de vencer, acércate a renovarla.",
        Fecha
      );
    }

    const Inspecciones = await Consultar(
      `SELECT i.id, i.numero, t.id tramite_id, t.correo, t.codigo
       FROM inspecciones i
       JOIN tramites t ON t.id=i.tramite_id
       WHERE i.estado='PENDIENTE' AND i.fecha_programada=$1`,
      [Fecha]
    );
    for (const Inspeccion of Inspecciones.rows) {
      await this.CrearNotificacion(
        `inspeccion-hoy-${Inspeccion.id}`,
        Inspeccion.tramite_id,
        Inspeccion.correo,
        "Inspección programada para hoy",
        "Hoy tienes inspección, asegúrate de estar presente para cuando llegue el inspector.",
        Fecha
      );
    }

    if (Inspecciones.rowCount > 0) {
      const Inspector = await Uno(
        "SELECT correo FROM usuarios WHERE rol='INSPECTOR' AND activo=TRUE"
      );
      if (Inspector) {
        await this.CrearNotificacion(
          `inspector-hoy-${Fecha}`,
          null,
          Inspector.correo,
          "Inspecciones del día",
          "Hoy tienes inspecciones por completar.",
          Fecha
        );
      }
    }

    const Pendientes = await Consultar(
      "SELECT * FROM notificaciones WHERE estado='PENDIENTE' AND fecha_programada <= $1 ORDER BY id",
      [Fecha]
    );
    for (const Notificacion of Pendientes.rows) {
      try {
        await this.Correo.Enviar(
          Notificacion.destino,
          Notificacion.asunto,
          Notificacion.mensaje
        );
        await Consultar(
          "UPDATE notificaciones SET estado='ENVIADA', enviada_en=NOW(), error=NULL WHERE id=$1",
          [Notificacion.id]
        );
      } catch (Error) {
        await Consultar(
          "UPDATE notificaciones SET estado='ERROR', error=$2 WHERE id=$1",
          [Notificacion.id, String(Error.message).slice(0, 500)]
        );
      }
    }
    return { Fecha, Procesadas: Pendientes.rowCount };
  }

  async Estado() {
    const Fecha = await this.ObtenerFecha();
    return {
      Fecha,
      FechaFormateada: FormatearFecha(Fecha),
      ModoDemostracion: Configuracion.ModoDemostracion
    };
  }
}
