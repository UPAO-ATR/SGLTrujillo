// Comprueba las validaciones usadas por los formularios.

import { describe, expect, it } from "vitest";
import {
  EsArchivoPermitidoCajera,
  EsArchivoPermitidoCiudadano,
  EsCorreoValido,
  EsDniValido,
  EsRucValido,
  LimpiarDni,
  LimpiarRuc,
} from "./ValidadoresFormulario.js";

describe("validadores de formularios", () => {
  it("limpia y limita el RUC", () => {
    expect(LimpiarRuc("20A48123456799")).toBe("20481234567");
  });

  it("valida un RUC de once dígitos", () => {
    expect(EsRucValido("20481234567")).toBe(true);
    expect(EsRucValido("2048123456")).toBe(false);
  });

  it("limpia y limita el DNI", () => {
    expect(LimpiarDni("71A23456799")).toBe("71234567");
  });

  it("valida un DNI de ocho dígitos", () => {
    expect(EsDniValido("71234567")).toBe(true);
    expect(EsDniValido("7123456")).toBe(false);
  });

  it("valida el formato básico del correo", () => {
    expect(EsCorreoValido("persona@correo.pe")).toBe(true);
    expect(EsCorreoValido("correo incorrecto")).toBe(false);
  });

  it("limita el plano ciudadano a PDF", () => {
    expect(
      EsArchivoPermitidoCiudadano({
        name: "plano.pdf",
        type: "application/pdf",
      }),
    ).toBe(true);
    expect(
      EsArchivoPermitidoCiudadano({ name: "plano.jpg", type: "image/jpeg" }),
    ).toBe(false);
  });

  it("permite PDF, JPG y PNG a la cajera", () => {
    expect(
      EsArchivoPermitidoCajera({ name: "plano.jpg", type: "image/jpeg" }),
    ).toBe(true);
    expect(
      EsArchivoPermitidoCajera({
        name: "plano.exe",
        type: "application/x-msdownload",
      }),
    ).toBe(false);
  });
});