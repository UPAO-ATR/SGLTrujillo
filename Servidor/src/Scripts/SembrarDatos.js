// Crea configuraciones y usuarios iniciales de prueba.

import bcrypt from "bcryptjs";
import { EjecutarMigraciones } from "../BaseDatos/EjecutorMigraciones.js";
import { Consultar, GrupoConexiones } from "../BaseDatos/ConexionBaseDatos.js";
async function CrearUsuario(D) {
  const E = await Consultar(
    "SELECT 1 FROM usuarios WHERE correo_institucional=$1",
    [D.Correo],
  );
  if (E.rowCount) return;
  await Consultar(
    "INSERT INTO usuarios(dni,nombres,apellido_paterno,apellido_materno,correo_institucional,contrasena_hash,rol,habilitado,hora_entrada) VALUES($1,$2,$3,$4,$5,$6,$7,TRUE,'08:00')",
    [
      D.Dni,
      D.Nombres,
      D.ApellidoPaterno,
      D.ApellidoMaterno,
      D.Correo,
      await bcrypt.hash(D.Contrasena, 12),
      D.Rol,
    ],
  );
}
async function Sembrar() {
  await EjecutarMigraciones();
  for (const [C, V, T] of [
    ["TamanoMaximoPlanoMb", "5", "NUMERO"],
    ["CantidadInspeccionesDiarias", "8", "NUMERO"],
    ["HoraEntradaTrabajadores", "08:00", "HORA"],
    ["CantidadMaximaCajeras", "5", "NUMERO"],
    ["UmbralSangria", "3000", "NUMERO"],
  ])
    await Consultar(
      "INSERT INTO configuraciones(clave,valor,tipo) VALUES($1,$2,$3) ON CONFLICT(clave) DO NOTHING",
      [C, V, T],
    );
  for (const U of [
    {
      Dni: "70000001",
      Nombres: "SISTEMA",
      ApellidoPaterno: "SUPER",
      ApellidoMaterno: "ADMIN",
      Correo: "superadmin@sgl.muni.pe",
      Contrasena: "SuperAdmin123!",
      Rol: "SUPER_ADMINISTRADOR",
    },
    {
      Dni: "70000002",
      Nombres: "ADMINISTRADOR",
      ApellidoPaterno: "MUNICIPAL",
      ApellidoMaterno: "TRUJILLO",
      Correo: "admin@trujillo.pe",
      Contrasena: "Admin@123",
      Rol: "ADMINISTRADOR",
    },
    {
      Dni: "70000003",
      Nombres: "INSPECTOR",
      ApellidoPaterno: "PRINCIPAL",
      ApellidoMaterno: "MUNICIPAL",
      Correo: "inspector1@municipalidad.pe",
      Contrasena: "inspector123",
      Rol: "INSPECTOR",
    },
    {
      Dni: "70000004",
      Nombres: "CAJERA",
      ApellidoPaterno: "PRINCIPAL",
      ApellidoMaterno: "MUNICIPAL",
      Correo: "cajera1@municipalidad.pe",
      Contrasena: "cajera123",
      Rol: "CAJERA",
    },
  ])
    await CrearUsuario(U);
  for (const [F, D] of [
    ["2026-01-01", "Año Nuevo"],
    ["2026-04-02", "Jueves Santo"],
    ["2026-04-03", "Viernes Santo"],
    ["2026-05-01", "Día del Trabajo"],
    ["2026-06-07", "Batalla de Arica y Día de la Bandera"],
    ["2026-06-29", "San Pedro y San Pablo"],
    ["2026-07-23", "Día de la Fuerza Aérea del Perú"],
    ["2026-07-28", "Fiestas Patrias"],
    ["2026-07-29", "Fiestas Patrias"],
    ["2026-08-06", "Batalla de Junín"],
    ["2026-08-30", "Santa Rosa de Lima"],
    ["2026-10-08", "Combate de Angamos"],
    ["2026-11-01", "Día de Todos los Santos"],
    ["2026-12-08", "Inmaculada Concepción"],
    ["2026-12-09", "Batalla de Ayacucho"],
    ["2026-12-25", "Navidad"],
  ])
    await Consultar(
      "INSERT INTO feriados(fecha,descripcion,activo) VALUES($1,$2,TRUE) ON CONFLICT(fecha) DO UPDATE SET descripcion=EXCLUDED.descripcion",
      [F, D],
    );
  console.log("Datos iniciales creados.");
}
try {
  await Sembrar();
} finally {
  await GrupoConexiones.end();
}