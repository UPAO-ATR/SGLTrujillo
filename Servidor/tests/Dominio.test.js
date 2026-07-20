// Comprueba el comportamiento de Dominio.

import { describe, expect, it } from "vitest";
import {
  ErrorAplicacion,
  ErrorConflicto,
  ErrorNoAutorizado,
  ErrorNoEncontrado,
} from "../src/Dominio/Errores.js";
import {
  EstadosInspeccion,
  ValidarResultadoInspeccion,
} from "../src/Dominio/EstadosInspeccion.js";
import {
  EstadosSolicitud,
  ValidarTransicionSolicitud,
} from "../src/Dominio/EstadosSolicitud.js";
import {
  MediosPago,
  MediosPagoCajera,
  MediosPagoCiudadano,
} from "../src/Dominio/MediosPago.js";
import { RolesUsuario } from "../src/Dominio/RolesUsuario.js";
import { TiposSolicitud } from "../src/Dominio/TiposSolicitud.js";

describe("Dominio del sistema", () => {
  it("mantiene los cinco estados de solicitud", () => {
    expect(Object.values(EstadosSolicitud)).toEqual([
      "PAGADO_PENDIENTE",
      "EN_PROCESO",
      "INSPECCIONADO_OBSERVACIONES",
      "RECHAZADO",
      "APROBADO",
    ]);
  });

  it.each([
    [EstadosSolicitud.PagadoPendiente, EstadosSolicitud.EnProceso],
    [EstadosSolicitud.PagadoPendiente, EstadosSolicitud.Aprobado],
    [EstadosSolicitud.EnProceso, EstadosSolicitud.InspeccionadoObservaciones],
    [EstadosSolicitud.EnProceso, EstadosSolicitud.Aprobado],
    [EstadosSolicitud.InspeccionadoObservaciones, EstadosSolicitud.Aprobado],
    [EstadosSolicitud.InspeccionadoObservaciones, EstadosSolicitud.Rechazado],
  ])("acepta la transición %s a %s", (Actual, Nuevo) => {
    expect(() => ValidarTransicionSolicitud(Actual, Nuevo)).not.toThrow();
  });

  it.each([
    [EstadosSolicitud.Aprobado, EstadosSolicitud.EnProceso],
    [EstadosSolicitud.Rechazado, EstadosSolicitud.Aprobado],
    [EstadosSolicitud.PagadoPendiente, EstadosSolicitud.Rechazado],
    ["INEXISTENTE", EstadosSolicitud.Aprobado],
  ])("rechaza la transición %s a %s", (Actual, Nuevo) => {
    expect(() => ValidarTransicionSolicitud(Actual, Nuevo)).toThrow(
      ErrorAplicacion,
    );
  });

  it("acepta aprobar una inspección pendiente", () => {
    expect(() =>
      ValidarResultadoInspeccion(
        EstadosInspeccion.Pendiente,
        EstadosInspeccion.Realizada,
      ),
    ).not.toThrow();
  });

  it("acepta observar una inspección pendiente", () => {
    expect(() =>
      ValidarResultadoInspeccion(
        EstadosInspeccion.Pendiente,
        EstadosInspeccion.Fallida,
      ),
    ).not.toThrow();
  });

  it.each([
    [EstadosInspeccion.Realizada, EstadosInspeccion.Fallida],
    [EstadosInspeccion.Fallida, EstadosInspeccion.Realizada],
    [EstadosInspeccion.PendienteEspera, EstadosInspeccion.Realizada],
    [EstadosInspeccion.Pendiente, EstadosInspeccion.Pendiente],
  ])("rechaza el resultado %s a %s", (Actual, Nuevo) => {
    expect(() => ValidarResultadoInspeccion(Actual, Nuevo)).toThrow(
      ErrorAplicacion,
    );
  });

  it("define los roles institucionales", () => {
    expect(RolesUsuario.SuperAdministrador).toBe("SUPER_ADMINISTRADOR");
    expect(RolesUsuario.Administrador).toBe("ADMINISTRADOR");
    expect(RolesUsuario.Inspector).toBe("INSPECTOR");
    expect(RolesUsuario.Cajera).toBe("CAJERA");
  });

  it("define los tipos de solicitud", () => {
    expect(TiposSolicitud).toEqual({
      Nueva: "NUEVA",
      Renovacion: "RENOVACION",
    });
  });

  it("separa los medios de pago del ciudadano y la cajera", () => {
    expect(MediosPagoCiudadano).toContain(MediosPago.Tarjeta);
    expect(MediosPagoCiudadano).toContain(MediosPago.Cip);
    expect(MediosPagoCiudadano).not.toContain(MediosPago.Efectivo);
    expect(MediosPagoCajera).toContain(MediosPago.Efectivo);
    expect(MediosPagoCajera).not.toContain(MediosPago.Tarjeta);
  });

  it("conserva los datos de un error de aplicación", () => {
    const ErrorPrueba = new ErrorAplicacion("Prueba", "CODIGO", 422, {
      Campo: "Ruc",
    });
    expect(ErrorPrueba.message).toBe("Prueba");
    expect(ErrorPrueba.Codigo).toBe("CODIGO");
    expect(ErrorPrueba.EstadoHttp).toBe(422);
    expect(ErrorPrueba.Detalles).toEqual({ Campo: "Ruc" });
  });

  it("crea errores especializados", () => {
    expect(new ErrorNoEncontrado().EstadoHttp).toBe(404);
    expect(new ErrorNoAutorizado().EstadoHttp).toBe(403);
    expect(new ErrorConflicto("Duplicado").EstadoHttp).toBe(409);
  });
});