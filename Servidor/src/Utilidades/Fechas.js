import { DateTime } from "luxon";
import { Configuracion } from "../Configuracion/Configuracion.js";

export function FechaReal() {
  return DateTime.now().setZone(Configuracion.ZonaHoraria).toISODate();
}

export function FechaValida(Fecha) {
  const Valor = DateTime.fromISO(String(Fecha), { zone: Configuracion.ZonaHoraria });
  return Valor.isValid && /^\d{4}-\d{2}-\d{2}$/.test(String(Fecha));
}

export function FormatearFecha(Fecha) {
  return DateTime.fromISO(String(Fecha), { zone: Configuracion.ZonaHoraria }).toFormat("dd/MM/yyyy");
}

export function EsHabil(Fecha, Feriados = new Set()) {
  const Dia = DateTime.fromISO(String(Fecha), { zone: Configuracion.ZonaHoraria });
  return Dia.weekday <= 5 && !Feriados.has(Dia.toISODate());
}

export function AgregarDiasHabiles(Fecha, Cantidad, Feriados = new Set()) {
  let Actual = DateTime.fromISO(String(Fecha), { zone: Configuracion.ZonaHoraria });
  let Contados = 0;
  while (Contados < Cantidad) {
    Actual = Actual.plus({ days: 1 });
    if (Actual.weekday <= 5 && !Feriados.has(Actual.toISODate())) Contados += 1;
  }
  return Actual.toISODate();
}

export function CalcularEdad(FechaNacimiento, FechaReferencia) {
  const Nacimiento = DateTime.fromISO(String(FechaNacimiento));
  const Referencia = DateTime.fromISO(String(FechaReferencia));
  if (!Nacimiento.isValid || !Referencia.isValid) return null;
  return Math.floor(Referencia.diff(Nacimiento, "years").years);
}
