// Comprueba el comportamiento de Validadores.

import { describe, expect, it } from "vitest";
import {
  EsquemaAbrirCaja,
  EsquemaArqueo,
  EsquemaCambiarContrasena,
  EsquemaCodigo,
  EsquemaCorreo,
  EsquemaCrearSolicitud,
  EsquemaDni,
  EsquemaFeriado,
  EsquemaLogin,
  EsquemaPrepararDemostracion,
  EsquemaRegistrarSangria,
  EsquemaResultadoInspeccion,
  EsquemaRuc,
  EsquemaTransaccionCaja,
  ValidarEsquema,
} from "../src/Validadores/Esquemas.js";
import { ValidarCorreoNoDesechable } from "../src/Validadores/ValidarCorreoDesechable.js";

describe("Validadores de identidad y acceso", () => {
  it.each(["20481234567", " 20481234567 "])("acepta el RUC %s", (Ruc) => {
    expect(ValidarEsquema(EsquemaRuc, Ruc)).toBe("20481234567");
  });

  it.each(["123", "2048123456A", "204812345678"])(
    "rechaza el RUC %s",
    (Ruc) => {
      expect(() => ValidarEsquema(EsquemaRuc, Ruc)).toThrow();
    },
  );

  it("acepta un DNI de ocho números", () => {
    expect(ValidarEsquema(EsquemaDni, "71234567")).toBe("71234567");
  });

  it.each(["7123456", "712345678", "ABCDEFGH"])("rechaza el DNI %s", (Dni) => {
    expect(() => ValidarEsquema(EsquemaDni, Dni)).toThrow();
  });

  it("normaliza el correo a minúsculas", () => {
    expect(ValidarEsquema(EsquemaCorreo, " USUARIO@EJEMPLO.COM ")).toBe(
      "usuario@ejemplo.com",
    );
  });

  it("rechaza correos con formato inválido", () => {
    expect(() => ValidarEsquema(EsquemaCorreo, "correo-sin-dominio")).toThrow();
  });

  it("acepta un código alfanumérico y lo convierte a mayúsculas", () => {
    expect(ValidarEsquema(EsquemaCodigo, "abc23456")).toBe("ABC23456");
  });

  it("rechaza códigos con símbolos", () => {
    expect(() => ValidarEsquema(EsquemaCodigo, "ABC-23456")).toThrow();
  });

  it("acepta un inicio de sesión completo", () => {
    const Datos = ValidarEsquema(EsquemaLogin, {
      Correo: "admin@trujillo.pe",
      Contrasena: "Admin@123",
    });
    expect(Datos.Correo).toBe("admin@trujillo.pe");
  });

  it("limita la preparación demostrativa a primera o segunda visita", () => {
    expect(
      ValidarEsquema(EsquemaPrepararDemostracion, { NumeroVisita: 2 })
        .NumeroVisita,
    ).toBe(2);
    expect(() =>
      ValidarEsquema(EsquemaPrepararDemostracion, { NumeroVisita: 3 }),
    ).toThrow();
  });
});

describe("Validadores de solicitudes", () => {
  it("completa los valores predeterminados de una solicitud nueva", () => {
    const Datos = ValidarEsquema(EsquemaCrearSolicitud, {
      Ruc: "20481234567",
      Correo: "negocio@ejemplo.com",
    });
    expect(Datos.Tipo).toBe("NUEVA");
    expect(Datos.Origen).toBe("CIUDADANO");
  });

  it("exige modalidad para una renovación", () => {
    expect(() =>
      ValidarEsquema(EsquemaCrearSolicitud, {
        Ruc: "20481234567",
        Correo: "negocio@ejemplo.com",
        Tipo: "RENOVACION",
      }),
    ).toThrow(/modalidad/i);
  });

  it("rechaza pago directo en una solicitud nueva", () => {
    expect(() =>
      ValidarEsquema(EsquemaCrearSolicitud, {
        Ruc: "20481234567",
        Correo: "negocio@ejemplo.com",
        Tipo: "NUEVA",
        OpcionRenovacion: "PAGO_DIRECTO",
      }),
    ).toThrow(/solo corresponde/i);
  });

  it("acepta una renovación con nueva inspección", () => {
    const Datos = ValidarEsquema(EsquemaCrearSolicitud, {
      Ruc: "20481234567",
      Correo: "negocio@ejemplo.com",
      Tipo: "RENOVACION",
      OpcionRenovacion: "NUEVA_INSPECCION",
    });
    expect(Datos.OpcionRenovacion).toBe("NUEVA_INSPECCION");
  });
});

describe("Validadores de contraseñas e inspecciones", () => {
  it("acepta un cambio de contraseña válido", () => {
    const Datos = ValidarEsquema(EsquemaCambiarContrasena, {
      ContrasenaActual: "anterior123",
      ContrasenaNueva: "nuevaSegura123",
      ConfirmacionContrasena: "nuevaSegura123",
    });
    expect(Datos.ContrasenaNueva).toBe("nuevaSegura123");
  });

  it("rechaza una confirmación diferente", () => {
    expect(() =>
      ValidarEsquema(EsquemaCambiarContrasena, {
        ContrasenaActual: "anterior123",
        ContrasenaNueva: "nuevaSegura123",
        ConfirmacionContrasena: "otraSegura123",
      }),
    ).toThrow(/no coincide/i);
  });

  it("rechaza reutilizar la contraseña actual", () => {
    expect(() =>
      ValidarEsquema(EsquemaCambiarContrasena, {
        ContrasenaActual: "misma123",
        ContrasenaNueva: "misma123",
        ConfirmacionContrasena: "misma123",
      }),
    ).toThrow(/diferente/i);
  });

  it("exige observaciones cuando el resultado es observado", () => {
    expect(() =>
      ValidarEsquema(EsquemaResultadoInspeccion, { Resultado: "OBSERVADO" }),
    ).toThrow(/observación/i);
  });

  it("acepta aprobar sin observaciones", () => {
    expect(
      ValidarEsquema(EsquemaResultadoInspeccion, { Resultado: "APROBADO" })
        .Resultado,
    ).toBe("APROBADO");
  });
});

describe("Validadores de caja", () => {
  it("usa S/ 1,000 como fondo inicial predeterminado", () => {
    expect(ValidarEsquema(EsquemaAbrirCaja, {}).FondoInicial).toBe(1000);
  });

  it("acepta un pago en efectivo de S/ 180", () => {
    const Datos = ValidarEsquema(EsquemaTransaccionCaja, {
      MedioPago: "EFECTIVO",
      Monto: 180,
    });
    expect(Datos.Monto).toBe(180);
  });

  it("rechaza un importe diferente de S/ 180", () => {
    expect(() =>
      ValidarEsquema(EsquemaTransaccionCaja, {
        MedioPago: "EFECTIVO",
        Monto: 100,
      }),
    ).toThrow(/180/);
  });

  it("exige referencia para Yape", () => {
    expect(() =>
      ValidarEsquema(EsquemaTransaccionCaja, { MedioPago: "YAPE", Monto: 180 }),
    ).toThrow(/operación/i);
  });

  it("acepta referencia para Plin", () => {
    const Datos = ValidarEsquema(EsquemaTransaccionCaja, {
      MedioPago: "PLIN",
      Monto: 180,
      Referencia: "OP123",
    });
    expect(Datos.Referencia).toBe("OP123");
  });

  it("acepta una sangría positiva", () => {
    expect(
      ValidarEsquema(EsquemaRegistrarSangria, { Monto: 3000 }).Motivo,
    ).toBe("Retiro preventivo de efectivo");
  });

  it("rechaza efectivo físico negativo", () => {
    expect(() =>
      ValidarEsquema(EsquemaArqueo, { EfectivoFisico: -1 }),
    ).toThrow();
  });
});

describe("Validadores transversales", () => {
  it("acepta un feriado válido", () => {
    const Datos = ValidarEsquema(EsquemaFeriado, {
      Fecha: "2026-07-28",
      Descripcion: "Fiestas Patrias",
    });
    expect(Datos.Activo).toBe(true);
  });

  it("rechaza una fecha de feriado con formato incorrecto", () => {
    expect(() =>
      ValidarEsquema(EsquemaFeriado, {
        Fecha: "28/07/2026",
        Descripcion: "Fiestas Patrias",
      }),
    ).toThrow();
  });

  it.each(["mailinator.com", "tempmail.com", "yopmail.com"])(
    "rechaza el dominio temporal %s",
    (Dominio) => {
      expect(() => ValidarCorreoNoDesechable(`usuario@${Dominio}`)).toThrow(
        /temporales/i,
      );
    },
  );

  it("acepta un dominio permanente", () => {
    expect(ValidarCorreoNoDesechable("usuario@gmail.com")).toBe(true);
  });
});