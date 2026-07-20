// Aplica la asignación FIFO y los resultados de inspección.

import { DateTime } from "luxon";
import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
import { Constantes } from "../Configuracion/Constantes.js";
import {
  EstadosInspeccion,
  ValidarResultadoInspeccion,
} from "../Dominio/EstadosInspeccion.js";
import {
  EstadosSolicitud,
  ValidarTransicionSolicitud,
} from "../Dominio/EstadosSolicitud.js";
import {
  ErrorAplicacion,
  ErrorNoAutorizado,
  ErrorNoEncontrado,
} from "../Dominio/Errores.js";
import {
  AhoraPeru,
  EsFinDeSemana,
  SumarDiasCalendario,
} from "../Utilidades/Fechas.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";

export class ServicioInspecciones {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }

  async ObtenerInspectorHabilitado(Cliente = this.BaseDatos) {
    const Resultado = await Cliente.query(
      "SELECT * FROM usuarios WHERE rol=$1 AND habilitado=TRUE LIMIT 1",
      [RolesUsuario.Inspector],
    );
    if (!Resultado.rows[0])
      throw new ErrorAplicacion(
        "No existe un inspector habilitado.",
        "INSPECTOR_NO_DISPONIBLE",
        409,
      );
    return Resultado.rows[0];
  }

  // Distribuye los cupos dentro de la jornada de ocho horas.
  CalcularHoraCupo(HoraEntrada, OrdenDia, Capacidad) {
    const [Hora, Minuto] = String(HoraEntrada).split(":").map(Number);
    const Inicio = DateTime.fromObject(
      { hour: Hora, minute: Minuto },
      { zone: ConfiguracionEntorno.ZonaHoraria },
    );
    const MinutosPorCupo = Math.floor((8 * 60) / Capacidad);
    return Inicio.plus({ minutes: (OrdenDia - 1) * MinutosPorCupo }).toFormat(
      "HH:mm",
    );
  }

  // Recorre el calendario hasta encontrar un día hábil con espacio.
  async BuscarPrimeraFechaDisponible(FechaMinima, Cliente = this.BaseDatos) {
    const Capacidad = Number(
      await this.RepositorioConfiguracion.ObtenerValor(
        "CantidadInspeccionesDiarias",
        8,
        Cliente,
      ),
    );
    const HoraEntrada = await this.RepositorioConfiguracion.ObtenerValor(
      "HoraEntradaTrabajadores",
      "08:00",
      Cliente,
    );
    let Fecha = FechaMinima.startOf("day");

    for (let Intento = 0; Intento < 730; Intento += 1) {
      const FechaIso = Fecha.toISODate();
      if (
        !EsFinDeSemana(Fecha) &&
        !(await this.RepositorioConfiguracion.EsFeriado(FechaIso, Cliente))
      ) {
        const Cantidad = await this.RepositorioInspecciones.ContarPorFecha(
          FechaIso,
          Cliente,
        );
        if (Cantidad < Capacidad) {
          const OrdenDia = Cantidad + 1;
          return {
            FechaProgramada: FechaIso,
            HoraProgramada: this.CalcularHoraCupo(
              HoraEntrada,
              OrdenDia,
              Capacidad,
            ),
            OrdenDia,
            PrioridadReprogramada: false,
          };
        }
      }
      Fecha = Fecha.plus({ days: 1 });
    }
    return null;
  }

  // Salta fines de semana y feriados configurados.
  async BuscarSiguienteDiaHabil(FechaInicial, Cliente = this.BaseDatos) {
    let Fecha = FechaInicial.startOf("day");
    for (let Intento = 0; Intento < 730; Intento += 1) {
      if (
        !EsFinDeSemana(Fecha) &&
        !(await this.RepositorioConfiguracion.EsFeriado(
          Fecha.toISODate(),
          Cliente,
        ))
      )
        return Fecha;
      Fecha = Fecha.plus({ days: 1 });
    }
    throw new ErrorAplicacion(
      "No fue posible encontrar un día hábil disponible.",
      "CALENDARIO_SIN_DISPONIBILIDAD",
      500,
    );
  }

  // Crea la primera visita sin duplicarla.
  async CrearPrimeraInspeccion(
    SolicitudId,
    FechaPago,
    Cliente = this.BaseDatos,
  ) {
    // Un bloqueo global evita que dos pagos ocupen el mismo cupo simultáneamente.
    await Cliente.query("SELECT pg_advisory_xact_lock($1)", [130101]);
    const Existente =
      await this.RepositorioInspecciones.BuscarPorSolicitudYVisita(
        SolicitudId,
        1,
        Cliente,
      );
    if (Existente) return Existente;
    const Inspector = await this.ObtenerInspectorHabilitado(Cliente);
    const Cupo = await this.BuscarPrimeraFechaDisponible(
      SumarDiasCalendario(FechaPago, Constantes.DiasPrimeraInspeccion),
      Cliente,
    );
    return this.RepositorioInspecciones.Crear(
      {
        SolicitudId,
        InspectorId: Inspector.id,
        NumeroVisita: 1,
        Estado: Cupo
          ? EstadosInspeccion.Pendiente
          : EstadosInspeccion.PendienteEspera,
        ...(Cupo || {}),
      },
      Cliente,
    );
  }

  // Crea una única segunda visita después de las observaciones.
  async CrearSegundaInspeccion(Primera, Cliente = this.BaseDatos) {
    const Existente =
      await this.RepositorioInspecciones.BuscarPorSolicitudYVisita(
        Primera.solicitud_id,
        2,
        Cliente,
      );
    if (Existente) return Existente;
    const Inspector = await this.ObtenerInspectorHabilitado(Cliente);
    const FechaBase = DateTime.fromISO(String(Primera.fecha_programada), {
      zone: ConfiguracionEntorno.ZonaHoraria,
    });
    const Cupo = await this.BuscarPrimeraFechaDisponible(
      FechaBase.plus({ days: Constantes.DiasSegundaInspeccion }),
      Cliente,
    );
    return this.RepositorioInspecciones.Crear(
      {
        SolicitudId: Primera.solicitud_id,
        InspectorId: Inspector.id,
        NumeroVisita: 2,
        Estado: Cupo
          ? EstadosInspeccion.Pendiente
          : EstadosInspeccion.PendienteEspera,
        ...(Cupo || {}),
      },
      Cliente,
    );
  }

  // Actualiza la inspección y el estado completo del expediente.
  async RegistrarResultado(InspeccionId, Datos, Usuario) {
    return this.ConTransaccion(async (Cliente) => {
      await Cliente.query("SELECT pg_advisory_xact_lock($1)", [130101]);
      const Inspeccion = await this.RepositorioInspecciones.BuscarPorId(
        InspeccionId,
        Cliente,
      );
      if (!Inspeccion)
        throw new ErrorNoEncontrado("No se encontró la inspección.");
      const EstadoNuevo =
        Datos.Resultado === "APROBADO"
          ? EstadosInspeccion.Realizada
          : EstadosInspeccion.Fallida;
      ValidarResultadoInspeccion(Inspeccion.estado, EstadoNuevo);
      const Actualizada = await this.RepositorioInspecciones.RegistrarResultado(
        InspeccionId,
        EstadoNuevo,
        Datos.Observaciones,
        Cliente,
      );
      const Solicitud = await this.RepositorioSolicitudes.BuscarPorId(
        Inspeccion.solicitud_id,
        Cliente,
      );
      if (EstadoNuevo === EstadosInspeccion.Realizada) {
        ValidarTransicionSolicitud(Solicitud.estado, EstadosSolicitud.Aprobado);
        await this.ServicioLicencias.GenerarLicencia(Solicitud.id, Cliente);
        await this.ServicioNotificaciones.Enviar(
          Inspeccion.correo,
          "Licencia aprobada",
          `La inspección fue aprobada. Su licencia ya puede descargarse con el código ${Inspeccion.codigo_inspeccion}.`,
          Cliente,
        );
      } else if (Number(Inspeccion.numero_visita) === 1) {
        ValidarTransicionSolicitud(
          Solicitud.estado,
          EstadosSolicitud.InspeccionadoObservaciones,
        );
        await this.RepositorioSolicitudes.ActualizarEstado(
          Solicitud.id,
          EstadosSolicitud.InspeccionadoObservaciones,
          Cliente,
        );
        const SegundaInspeccion = await this.CrearSegundaInspeccion(
          Actualizada,
          Cliente,
        );
        const MensajeSegunda = SegundaInspeccion.fecha_programada
          ? `Se registraron observaciones en la primera visita. La segunda inspección fue programada para el ${String(
              SegundaInspeccion.fecha_programada,
            ).slice(0, 10)} a las ${SegundaInspeccion.hora_programada}.`
          : "Se registraron observaciones en la primera visita. La segunda inspección está en espera de un cupo disponible.";
        await this.ServicioNotificaciones.Enviar(
          Inspeccion.correo,
          "Segunda inspección programada",
          MensajeSegunda,
          Cliente,
        );
      } else {
        ValidarTransicionSolicitud(
          Solicitud.estado,
          EstadosSolicitud.Rechazado,
        );
        await this.RepositorioSolicitudes.ActualizarEstado(
          Solicitud.id,
          EstadosSolicitud.Rechazado,
          Cliente,
        );
        await this.ServicioNotificaciones.Enviar(
          Inspeccion.correo,
          "Solicitud rechazada",
          "La segunda inspección también presentó observaciones. Debe iniciar un nuevo trámite y realizar un nuevo pago.",
          Cliente,
        );
      }
      await this.ServicioAuditoria.Registrar(
        Usuario,
        Datos.Resultado === "APROBADO"
          ? "APROBAR_INSPECCION"
          : "REGISTRAR_OBSERVACIONES",
        "INSPECCION",
        InspeccionId,
        { Observaciones: Datos.Observaciones },
        Cliente,
      );
      return Actualizada;
    });
  }

  // Mueve los excedentes en cascada hasta respetar la capacidad.
  async ReordenarDesdeFecha(FechaInicial, Cliente = this.BaseDatos) {
    const Capacidad = Number(
      await this.RepositorioConfiguracion.ObtenerValor(
        "CantidadInspeccionesDiarias",
        8,
        Cliente,
      ),
    );
    const HoraEntrada = await this.RepositorioConfiguracion.ObtenerValor(
      "HoraEntradaTrabajadores",
      "08:00",
      Cliente,
    );
    let Fecha = await this.BuscarSiguienteDiaHabil(FechaInicial, Cliente);
    for (let Dia = 0; Dia < 730; Dia += 1) {
      const FechaIso = Fecha.toISODate();
      const Inspecciones = await this.RepositorioInspecciones.ListarPorFecha(
        FechaIso,
        Cliente,
      );
      if (!Inspecciones.length) return;
      await this.RepositorioInspecciones.LimpiarOrdenFecha(FechaIso, Cliente);
      const Atendidas = Inspecciones.slice(0, Capacidad);
      const Excedentes = Inspecciones.slice(Capacidad);
      for (let Indice = 0; Indice < Atendidas.length; Indice += 1) {
        const Inspeccion = Atendidas[Indice];
        await this.RepositorioInspecciones.ActualizarOrdenYHora(
          Inspeccion.id,
          Indice + 1,
          this.CalcularHoraCupo(HoraEntrada, Indice + 1, Capacidad),
          Inspeccion.prioridad_reprogramada,
          Cliente,
        );
      }
      if (!Excedentes.length) return;
      Fecha = await this.BuscarSiguienteDiaHabil(
        Fecha.plus({ days: 1 }),
        Cliente,
      );
      for (const Inspeccion of Excedentes)
        await this.RepositorioInspecciones.MoverAFecha(
          Inspeccion.id,
          Fecha.toISODate(),
          true,
          Cliente,
        );
    }
  }

  // Asigna cupos por orden de llegada a la lista de espera.
  async AsignarPendientesEspera() {
    return this.ConTransaccion(async (Cliente) => {
      await Cliente.query("SELECT pg_advisory_xact_lock($1)", [130101]);
      const Pendientes =
        await this.RepositorioInspecciones.ListarPendientesEspera(Cliente);
      const Inspector = await this.ObtenerInspectorHabilitado(Cliente);
      let Cantidad = 0;
      for (const Inspeccion of Pendientes) {
        const Dias =
          Number(Inspeccion.numero_visita) === 1
            ? Constantes.DiasPrimeraInspeccion
            : Constantes.DiasSegundaInspeccion;
        const Cupo = await this.BuscarPrimeraFechaDisponible(
          DateTime.fromJSDate(new Date(Inspeccion.fecha_creacion), {
            zone: ConfiguracionEntorno.ZonaHoraria,
          }).plus({ days: Dias }),
          Cliente,
        );
        if (!Cupo) break;
        await this.RepositorioInspecciones.Programar(
          Inspeccion.id,
          {
            InspectorId: Inspector.id,
            Estado: EstadosInspeccion.Pendiente,
            ...Cupo,
          },
          Cliente,
        );
        Cantidad += 1;
      }
      return Cantidad;
    });
  }

  // Traslada las visitas pendientes y notifica solo a los afectados directos.
  async ReprogramarNoRealizadas(FechaIso) {
    return this.ConTransaccion(async (Cliente) => {
      await Cliente.query("SELECT pg_advisory_xact_lock($1)", [130101]);
      const Pendientes =
        await this.RepositorioInspecciones.ListarNoRealizadasDelDia(
          FechaIso,
          Cliente,
        );
      if (!Pendientes.length) return 0;
      for (const Inspeccion of Pendientes)
        await this.RepositorioInspecciones.MoverAEspera(Inspeccion.id, Cliente);
      const Siguiente = await this.BuscarSiguienteDiaHabil(
        DateTime.fromISO(FechaIso, {
          zone: ConfiguracionEntorno.ZonaHoraria,
        }).plus({ days: 1 }),
        Cliente,
      );
      const Inspector = await this.ObtenerInspectorHabilitado(Cliente);
      const HoraEntrada = await this.RepositorioConfiguracion.ObtenerValor(
        "HoraEntradaTrabajadores",
        "08:00",
        Cliente,
      );
      const HoraSalida = DateTime.fromFormat(HoraEntrada, "HH:mm")
        .plus({ hours: 8 })
        .toFormat("HH:mm");
      for (const Inspeccion of Pendientes) {
        await this.RepositorioInspecciones.Programar(
          Inspeccion.id,
          {
            InspectorId: Inspector.id,
            Estado: EstadosInspeccion.Pendiente,
            FechaProgramada: Siguiente.toISODate(),
            HoraProgramada: null,
            OrdenDia: null,
            PrioridadReprogramada: true,
          },
          Cliente,
        );
        const Detalle = await this.RepositorioInspecciones.BuscarPorId(
          Inspeccion.id,
          Cliente,
        );
        await this.ServicioNotificaciones.Enviar(
          Detalle.correo,
          "Reprogramación de inspección",
          `Su inspección ha sido trasladada al siguiente día hábil laborable. Horario vigente: ${HoraEntrada} a ${HoraSalida}, de lunes a viernes, fuera de feriados.`,
          Cliente,
        );
      }
      await this.ReordenarDesdeFecha(Siguiente, Cliente);
      return Pendientes.length;
    });
  }

  // Acerca una visita al día actual para facilitar la exposición.
  async PrepararInspeccionParaHoy(NumeroVisita, Usuario = null) {
    if (!ConfiguracionEntorno.ModoDemostracion)
      throw new ErrorNoAutorizado(
        "La preparación rápida solo está disponible en modo de demostración.",
      );

    return this.ConTransaccion(async (Cliente) => {
      await Cliente.query("SELECT pg_advisory_xact_lock($1)", [130101]);

      const Inspeccion = (
        await Cliente.query(
          `SELECT * FROM inspecciones
           WHERE numero_visita=$1
             AND estado IN ('PENDIENTE','PENDIENTE_ESPERA')
           ORDER BY fecha_creacion DESC,id DESC
           LIMIT 1 FOR UPDATE`,
          [NumeroVisita],
        )
      ).rows[0];

      if (!Inspeccion)
        throw new ErrorNoEncontrado(
          `No existe una inspección pendiente de visita ${NumeroVisita}.`,
        );

      const FechaHoy = AhoraPeru().toISODate();
      const FechaActual = Inspeccion.fecha_programada
        ? String(Inspeccion.fecha_programada).slice(0, 10)
        : "";

      if (Inspeccion.estado === EstadosInspeccion.Pendiente && FechaActual === FechaHoy)
        return {
          InspeccionId: Inspeccion.id,
          NumeroVisita,
          FechaProgramada: FechaHoy,
          HoraProgramada: Inspeccion.hora_programada,
        };

      const Inspector = await this.ObtenerInspectorHabilitado(Cliente);
      const HoraEntrada = await this.RepositorioConfiguracion.ObtenerValor(
        "HoraEntradaTrabajadores",
        "08:00",
        Cliente,
      );
      const Capacidad = Number(
        await this.RepositorioConfiguracion.ObtenerValor(
          "CantidadInspeccionesDiarias",
          8,
          Cliente,
        ),
      );
      const CantidadHoy = await this.RepositorioInspecciones.ContarPorFecha(
        FechaHoy,
        Cliente,
      );

      if (CantidadHoy >= Capacidad)
        throw new ErrorAplicacion(
          "El día de hoy ya alcanzó la capacidad de inspecciones.",
          "CAPACIDAD_DIARIA_COMPLETA",
          409,
        );

      const OrdenDia = CantidadHoy + 1;
      const HoraProgramada = this.CalcularHoraCupo(
        HoraEntrada,
        OrdenDia,
        Capacidad,
      );

      await this.RepositorioInspecciones.Programar(
        Inspeccion.id,
        {
          InspectorId: Inspector.id,
          Estado: EstadosInspeccion.Pendiente,
          FechaProgramada: FechaHoy,
          HoraProgramada,
          OrdenDia,
          PrioridadReprogramada: true,
        },
        Cliente,
      );

      if (Usuario)
        await this.ServicioAuditoria.Registrar(
          Usuario,
          "PREPARAR_INSPECCION_DEMOSTRACION",
          "INSPECCION",
          Inspeccion.id,
          { NumeroVisita, FechaHoy },
          Cliente,
        );

      return {
        InspeccionId: Inspeccion.id,
        NumeroVisita,
        FechaProgramada: FechaHoy,
        HoraProgramada,
      };
    });
  }

  // Recalcula los días cuando cambia la capacidad diaria.
  async ReordenarDiasConExceso(Cliente = this.BaseDatos) {
    const Resultado = await Cliente.query(
      "SELECT DISTINCT fecha_programada FROM inspecciones WHERE fecha_programada IS NOT NULL AND estado='PENDIENTE' ORDER BY fecha_programada",
    );
    for (const Fila of Resultado.rows)
      await this.ReordenarDesdeFecha(
        DateTime.fromISO(String(Fila.fecha_programada).slice(0, 10), {
          zone: ConfiguracionEntorno.ZonaHoraria,
        }),
        Cliente,
      );
  }
}