import { describe, expect, it } from "vitest";
import { AgregarDiasHabiles, CalcularEdad, FormatearFecha } from "../src/Utilidades/Fechas.js";
import { ServicioTramites } from "../src/Servicios/ServicioTramites.js";

const Servicio = new ServicioTramites({});

describe("reglas literales del flujo corregido", () => {
  it("programa quince días hábiles después", () => {
    expect(AgregarDiasHabiles("2026-07-20", 15)).toBe("2026-08-10");
  });

  it("excluye un feriado al programar", () => {
    expect(AgregarDiasHabiles("2026-07-20", 5, new Set(["2026-07-24"]))).toBe("2026-07-28");
  });

  it("valida mayoría de edad", () => {
    expect(CalcularEdad("2002-09-29", "2026-07-21")).toBe(23);
  });

  it("formatea la fecha como día mes año", () => {
    expect(FormatearFecha("2026-08-10")).toBe("10/08/2026");
  });

  it("acepta el pago híbrido que suma tres soles", () => {
    expect(Servicio.ValidarPago({ montoEfectivo: 1, montoDigital: 2, medioDigital: "YAPE", numeroOperacion: "123456" })).toMatchObject({ Efectivo: 1, Digital: 2, Total: 3 });
  });

  it("rechaza un pago que no suma tres soles", () => {
    expect(() => Servicio.ValidarPago({ montoEfectivo: 1, montoDigital: 1, medioDigital: "PLIN", numeroOperacion: "1234" })).toThrow("deben sumar exactamente");
  });
});
