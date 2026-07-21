import bcrypt from "bcryptjs";
import { Consultar, Uno } from "./Conexion.js";
import { FechaReal } from "../Utilidades/Fechas.js";

const UsuariosIniciales = [
  ["SuperAdministrador", "superadmin@sgl.pe", "SuperAdmin123!", "SUPERADMINISTRADOR"],
  ["Administrador", "admin@sgl.pe", "Admin123!", "ADMINISTRADOR"],
  ["Inspector municipal", "inspector@sgl.pe", "Inspector123!", "INSPECTOR"],
  ["Cajero uno", "cajero1@sgl.pe", "Cajero123!", "CAJERO"],
  ["Cajero dos", "cajero2@sgl.pe", "Cajero123!", "CAJERO"]
];

const Feriados = [
  ["2026-01-01", "Año Nuevo"], ["2026-04-02", "Jueves Santo"], ["2026-04-03", "Viernes Santo"],
  ["2026-05-01", "Día del Trabajo"], ["2026-06-29", "San Pedro y San Pablo"],
  ["2026-07-28", "Fiestas Patrias"], ["2026-07-29", "Fiestas Patrias"],
  ["2026-08-30", "Santa Rosa de Lima"], ["2026-10-08", "Combate de Angamos"],
  ["2026-11-01", "Todos los Santos"], ["2026-12-08", "Inmaculada Concepción"],
  ["2026-12-09", "Batalla de Ayacucho"], ["2026-12-25", "Navidad"]
];

export async function SembrarDatos() {
  const FechaActual = await Uno("SELECT valor FROM configuracion WHERE clave='fecha_simulada'");
  if (!FechaActual) {
    await Consultar("INSERT INTO configuracion(clave, valor) VALUES('fecha_simulada', $1)", [FechaReal()]);
  }
  for (const [Nombre, Correo, Clave, Rol] of UsuariosIniciales) {
    const Existe = await Uno("SELECT id FROM usuarios WHERE correo=$1", [Correo]);
    if (!Existe) {
      const Hash = await bcrypt.hash(Clave, 11);
      await Consultar("INSERT INTO usuarios(nombre, correo, clave_hash, rol) VALUES($1,$2,$3,$4)", [Nombre, Correo, Hash, Rol]);
    }
  }
  for (const [Fecha, Descripcion] of Feriados) {
    await Consultar("INSERT INTO feriados(fecha, descripcion) VALUES($1,$2) ON CONFLICT(fecha) DO NOTHING", [Fecha, Descripcion]);
  }
}
