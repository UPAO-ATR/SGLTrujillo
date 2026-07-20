// Define las validaciones de entrada de la API.

import { z } from "zod";
import { Constantes } from "../Configuracion/Constantes.js";
import { MediosPago, MediosPagoCajera } from "../Dominio/MediosPago.js";
import { TiposSolicitud } from "../Dominio/TiposSolicitud.js";
const TextoLimpio = (Minimo, Maximo) =>
  z.string().trim().min(Minimo).max(Maximo);
const IdPositivo = z.coerce
  .number()
  .int()
  .positive("El identificador debe ser un número entero positivo.");
// Exige once dígitos numéricos para el RUC.
export const EsquemaRuc = z
  .string()
  .trim()
  .regex(/^\d{11}$/, "El RUC debe contener exactamente 11 números.");
// Exige ocho dígitos numéricos para el DNI.
export const EsquemaDni = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "El DNI debe contener exactamente 8 números.");
export const EsquemaCorreo = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ingrese un correo electrónico válido.")
  .max(160);
export const EsquemaCodigo = z
  .string()
  .trim()
  .toUpperCase()
  .min(8)
  .max(40)
  .regex(/^[A-Z0-9]+$/, "El código contiene caracteres no permitidos.");
export const EsquemaId = IdPositivo;
export const EsquemaPrepararDemostracion = z.object({
  NumeroVisita: z.number().int().min(1).max(2),
});
export const EsquemaCrearSolicitud = z
  .object({
    Ruc: EsquemaRuc,
    Correo: EsquemaCorreo,
    Tipo: z
      .enum([TiposSolicitud.Nueva, TiposSolicitud.Renovacion])
      .default(TiposSolicitud.Nueva),
    OpcionRenovacion: z.enum(["PAGO_DIRECTO", "NUEVA_INSPECCION"]).optional(),
    Origen: z.enum(["CIUDADANO", "CAJERA"]).default("CIUDADANO"),
  })
  .superRefine((Datos, Contexto) => {
    if (Datos.Tipo === TiposSolicitud.Renovacion && !Datos.OpcionRenovacion)
      Contexto.addIssue({
        code: "custom",
        path: ["OpcionRenovacion"],
        message: "Seleccione una modalidad de renovación.",
      });
    if (
      Datos.Tipo === TiposSolicitud.Nueva &&
      Datos.OpcionRenovacion === "PAGO_DIRECTO"
    )
      Contexto.addIssue({
        code: "custom",
        path: ["OpcionRenovacion"],
        message: "El pago directo solo corresponde a una renovación.",
      });
  });
export const EsquemaLogin = z.object({
  Correo: EsquemaCorreo,
  Contrasena: z.string().min(6).max(100),
});
export const EsquemaCambiarContrasena = z
  .object({
    ContrasenaActual: z.string().min(6).max(100),
    ContrasenaNueva: z
      .string()
      .min(8, "La contraseña nueva debe tener al menos 8 caracteres.")
      .max(100),
    ConfirmacionContrasena: z.string().min(8).max(100),
  })
  .superRefine((Datos, Contexto) => {
    if (Datos.ContrasenaNueva !== Datos.ConfirmacionContrasena)
      Contexto.addIssue({
        code: "custom",
        path: ["ConfirmacionContrasena"],
        message: "La confirmación no coincide con la contraseña nueva.",
      });
    if (Datos.ContrasenaActual === Datos.ContrasenaNueva)
      Contexto.addIssue({
        code: "custom",
        path: ["ContrasenaNueva"],
        message: "La contraseña nueva debe ser diferente de la actual.",
      });
  });
export const EsquemaCrearPago = z.object({
  MedioPago: z.enum(Object.values(MediosPago)),
  Referencia: z.string().trim().max(100).optional(),
});
export const EsquemaResultadoInspeccion = z
  .object({
    Resultado: z.enum(["APROBADO", "OBSERVADO"]),
    Observaciones: z.string().trim().max(2000).optional(),
  })
  .superRefine((Datos, Contexto) => {
    if (Datos.Resultado === "OBSERVADO" && !Datos.Observaciones)
      Contexto.addIssue({
        code: "custom",
        path: ["Observaciones"],
        message: "Debe registrar al menos una observación.",
      });
  });
export const EsquemaObservaciones = z.object({
  Observaciones: TextoLimpio(1, 2000),
});
export const EsquemaCrearTrabajador = z.object({
  Dni: EsquemaDni,
  Rol: z.enum(["INSPECTOR", "CAJERA"]),
});
export const EsquemaCrearInspector = z.object({ Dni: EsquemaDni });
export const EsquemaCrearAdministrador = z.object({ Dni: EsquemaDni });
export const EsquemaCambiarHabilitacion = z.object({ Habilitado: z.boolean() });
export const EsquemaConfiguracion = z.object({
  Clave: z.enum([
    "TamanoMaximoPlanoMb",
    "CantidadInspeccionesDiarias",
    "HoraEntradaTrabajadores",
    "CantidadMaximaCajeras",
    "UmbralSangria",
  ]),
  Valor: z.union([z.string(), z.number()]),
});
export const EsquemaFeriado = z.object({
  Fecha: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Ingrese una fecha válida en formato AAAA-MM-DD.",
    ),
  Descripcion: TextoLimpio(3, 200),
  Activo: z.boolean().default(true),
});
export const EsquemaAbrirCaja = z.object({
  FondoInicial: z.number().min(0).max(100000).default(1000),
});
export const EsquemaTransaccionCaja = z
  .object({
    SolicitudId: IdPositivo.optional(),
    PagoId: IdPositivo.optional(),
    MedioPago: z.enum(MediosPagoCajera),
    Monto: z.number().positive().max(100000),
    Referencia: z.string().trim().max(100).optional(),
  })
  .superRefine((Datos, Contexto) => {
    if (Math.abs(Datos.Monto - Constantes.MontoOficial) > 0.001)
      Contexto.addIssue({
        code: "custom",
        path: ["Monto"],
        message: `La transacción debe registrarse por S/ ${Constantes.MontoOficial.toFixed(2)}.`,
      });
    if (
      [MediosPago.Yape, MediosPago.Plin].includes(Datos.MedioPago) &&
      !Datos.Referencia
    )
      Contexto.addIssue({
        code: "custom",
        path: ["Referencia"],
        message: "Ingrese el número de operación del pago digital.",
      });
  });
export const EsquemaRegistrarSangria = z.object({
  Monto: z.number().positive().max(100000),
  Motivo: TextoLimpio(3, 300).default("Retiro preventivo de efectivo"),
});
export const EsquemaArqueo = z.object({
  EfectivoFisico: z.number().min(0).max(1000000),
});
export function ValidarEsquema(Esquema, Datos) {
  const Resultado = Esquema.safeParse(Datos);
  if (!Resultado.success) {
    const ErrorValidacion = new Error(
      Resultado.error.issues.map((Problema) => Problema.message).join(" "),
    );
    ErrorValidacion.EstadoHttp = 400;
    ErrorValidacion.Codigo = "DATOS_INVALIDOS";
    ErrorValidacion.Detalles = Resultado.error.issues;
    throw ErrorValidacion;
  }
  return Resultado.data;
}