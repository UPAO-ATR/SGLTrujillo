import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Uno } from "../BaseDatos/Conexion.js";
import { Configuracion } from "../Configuracion/Configuracion.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";

export async function IniciarSesion(Correo, Clave) {
  const Usuario = await Uno(
    "SELECT id, nombre, correo, clave_hash, rol, activo FROM usuarios WHERE LOWER(correo)=LOWER($1)",
    [Correo]
  );
  if (!Usuario || !Usuario.activo || !(await bcrypt.compare(Clave, Usuario.clave_hash))) {
    throw new ErrorAplicacion("Correo o contraseña incorrectos.", "CREDENCIALES_INVALIDAS", 401);
  }
  const Perfil = {
    Id: String(Usuario.id),
    Nombre: Usuario.nombre,
    Correo: Usuario.correo,
    Rol: Usuario.rol
  };
  const Token = jwt.sign(Perfil, Configuracion.ClaveJwt, { expiresIn: Configuracion.DuracionJwt });
  return { Token, Usuario: Perfil };
}
