// Centraliza cálculos de fechas en la zona horaria del Perú.

import { DateTime } from "luxon";
import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
// Obtiene la fecha actual en la zona horaria oficial.
export function AhoraPeru() {
  return DateTime.now().setZone(ConfiguracionEntorno.ZonaHoraria);
}
export function FechaPeruDesdeIso(Valor) {
  if (DateTime.isDateTime(Valor))
    return Valor.setZone(ConfiguracionEntorno.ZonaHoraria);
  if (Valor instanceof Date)
    return DateTime.fromJSDate(Valor, {
      zone: ConfiguracionEntorno.ZonaHoraria,
    });
  return DateTime.fromISO(String(Valor), {
    zone: ConfiguracionEntorno.ZonaHoraria,
  });
}
export function SumarDiasCalendario(Fecha, Dias) {
  return FechaPeruDesdeIso(Fecha).plus({ days: Dias }).startOf("day");
}
export function EsFinDeSemana(Fecha) {
  return Fecha.weekday === 6 || Fecha.weekday === 7;
}
// Nunca devuelve una cantidad negativa de días.
export function DiasRestantes(Fecha) {
  const Diferencia = Math.ceil(
    FechaPeruDesdeIso(Fecha)
      .startOf("day")
      .diff(AhoraPeru().startOf("day"), "days").days,
  );
  return Math.max(0, Diferencia);
}
export function CalcularEdad(FechaNacimiento) {
  if (!FechaNacimiento) return null;
  const Nacimiento = DateTime.fromISO(String(FechaNacimiento), {
    zone: ConfiguracionEntorno.ZonaHoraria,
  });
  if (!Nacimiento.isValid) return null;
  return Math.floor(AhoraPeru().diff(Nacimiento, "years").years);
}