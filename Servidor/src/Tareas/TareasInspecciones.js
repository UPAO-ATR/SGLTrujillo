// Programa los trabajos automáticos de inspecciones.

import cron from "node-cron";
import { DateTime } from "luxon";
import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
import { Contenedor } from "../Contenedor.js";

// Ejecuta las tareas con la zona horaria del Perú.
export function IniciarTareasInspecciones() {
  cron.schedule(
    "*/5 * * * 1-5",
    async () => {
      try {
        await Contenedor.ServicioInspecciones.AsignarPendientesEspera();
        const Hora = await Contenedor.RepositorioConfiguracion.ObtenerValor(
          "HoraEntradaTrabajadores",
          "08:00",
        );
        const Cierre = DateTime.fromFormat(Hora, "HH:mm", {
          zone: ConfiguracionEntorno.ZonaHoraria,
        }).plus({ hours: 8, minutes: 5 });
        const Ahora = DateTime.now().setZone(ConfiguracionEntorno.ZonaHoraria);
        if (
          Ahora.hour === Cierre.hour &&
          Ahora.minute >= Cierre.minute &&
          Ahora.minute < Cierre.minute + 5
        )
          await Contenedor.ServicioInspecciones.ReprogramarNoRealizadas(
            Ahora.toISODate(),
          );
      } catch (Error) {
        console.error("Error en la tarea de inspecciones:", Error.message);
      }
    },
    { timezone: ConfiguracionEntorno.ZonaHoraria },
  );

  cron.schedule(
    "*/10 * * * *",
    async () => {
      try {
        await Contenedor.ServicioNotificaciones.ReintentarPendientes();
      } catch (Error) {
        console.error("Error al reintentar correos:", Error.message);
      }
    },
    { timezone: ConfiguracionEntorno.ZonaHoraria },
  );

  cron.schedule(
    "30 23 * * *",
    async () => {
      try {
        const Respaldo = await Contenedor.ServicioRespaldos.CrearRespaldo();
        console.log(`Respaldo automático creado: ${Respaldo.Identificador}`);
      } catch (Error) {
        console.error("Error al crear el respaldo automático:", Error.message);
      }
    },
    { timezone: ConfiguracionEntorno.ZonaHoraria },
  );
}