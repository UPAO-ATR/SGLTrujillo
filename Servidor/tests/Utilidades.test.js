// Comprueba el comportamiento de Utilidades.

import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  DetectarTipoArchivo,
  LimpiarNombreArchivo,
} from "../src/Utilidades/Archivos.js";
import {
  GenerarCodigoAleatorio,
  GenerarCodigoPago,
  GenerarNumeroBoleta,
  GenerarNumeroLicencia,
} from "../src/Utilidades/Codigos.js";
import {
  CalcularEdad,
  EsFinDeSemana,
  FechaPeruDesdeIso,
  SumarDiasCalendario,
} from "../src/Utilidades/Fechas.js";

describe("Utilidades de archivos", () => {
  it("detecta un PDF real por su firma", () => {
    expect(DetectarTipoArchivo(Buffer.from("%PDF-1.7 contenido"))).toBe(
      "application/pdf",
    );
  });

  it("detecta una imagen JPG por su firma", () => {
    expect(DetectarTipoArchivo(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
  });

  it("detecta una imagen PNG por su firma", () => {
    expect(DetectarTipoArchivo(Buffer.from("89504e470d0a1a0a", "hex"))).toBe(
      "image/png",
    );
  });

  it("rechaza archivos vacíos o desconocidos", () => {
    expect(DetectarTipoArchivo(Buffer.alloc(0))).toBeNull();
    expect(DetectarTipoArchivo(Buffer.from("ejecutable"))).toBeNull();
  });

  it("limpia tildes, espacios y símbolos del nombre", () => {
    expect(LimpiarNombreArchivo("pláno local (final).pdf")).toBe(
      "planolocalfinal.pdf",
    );
  });

  it("usa un nombre seguro cuando el valor está vacío", () => {
    expect(LimpiarNombreArchivo("")).toBe("archivo");
  });
});

describe("Utilidades de códigos", () => {
  it("genera un código de la longitud solicitada", () => {
    expect(GenerarCodigoAleatorio(12)).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
  });

  it("evita caracteres visualmente ambiguos", () => {
    const Codigo = GenerarCodigoAleatorio(200);
    expect(Codigo).not.toMatch(/[01IO]/);
  });

  it("genera códigos de pago con prefijo", () => {
    expect(GenerarCodigoPago()).toMatch(/^PAGO\d+[A-HJ-NP-Z2-9]{5}$/);
  });

  it("genera una constancia con fecha e identificador", () => {
    expect(GenerarNumeroBoleta(25)).toMatch(/^CP-\d{8}-000025$/);
  });

  it("genera el número literal de licencia", () => {
    const Fecha = new Date("2026-07-19T12:00:00Z");
    expect(GenerarNumeroLicencia(7, Fecha)).toBe("LF-20260719-000007");
  });
});

describe("Utilidades de fechas", () => {
  it("interpreta una fecha en la zona de Perú", () => {
    const Fecha = FechaPeruDesdeIso("2026-07-19T10:00:00");
    expect(Fecha.zoneName).toBe("America/Lima");
  });

  it("suma días calendario sin conservar la hora", () => {
    const Fecha = SumarDiasCalendario("2026-07-01T15:20:00", 15);
    expect(Fecha.toISODate()).toBe("2026-07-16");
    expect(Fecha.hour).toBe(0);
  });

  it("identifica sábado y domingo", () => {
    expect(EsFinDeSemana(DateTime.fromISO("2026-07-18"))).toBe(true);
    expect(EsFinDeSemana(DateTime.fromISO("2026-07-19"))).toBe(true);
    expect(EsFinDeSemana(DateTime.fromISO("2026-07-20"))).toBe(false);
  });

  it("calcula una edad válida", () => {
    const Edad = CalcularEdad("1990-01-01");
    expect(Edad).toBeGreaterThanOrEqual(35);
  });

  it("devuelve null para una fecha de nacimiento inválida", () => {
    expect(CalcularEdad("fecha-invalida")).toBeNull();
    expect(CalcularEdad(null)).toBeNull();
  });
});