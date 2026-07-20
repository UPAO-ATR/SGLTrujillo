// Aplica las reglas de inicio de sesión y contraseña.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
import { ErrorAplicacion, ErrorNoAutorizado } from "../Dominio/Errores.js";
export class ServicioAutenticacion {
  constructor(RepositorioUsuarios, ServicioAuditoria) {
    this.RepositorioUsuarios = RepositorioUsuarios;
    this.ServicioAuditoria = ServicioAuditoria;
  }
  // Comprueba credenciales y devuelve una sesión limitada.
  async IniciarSesion(Correo, Contrasena) {
    const Usuario = await this.RepositorioUsuarios.BuscarPorCorreo(Correo);
    if (
      !Usuario ||
      !Usuario.habilitado ||
      !(await bcrypt.compare(Contrasena, Usuario.contrasena_hash))
    ) {
      throw new ErrorNoAutorizado(
        "El correo o la contraseña no son correctos.",
      );
    }
    const Token = jwt.sign(
      { Id: Usuario.id, Rol: Usuario.rol },
      ConfiguracionEntorno.ClaveJwt,
      {
        expiresIn: ConfiguracionEntorno.DuracionJwt,
        issuer: "sgl-trujillo",
      },
    );
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "INICIAR_SESION",
      "USUARIO",
      Usuario.id,
      null,
    );
    return { Token, Usuario: this.LimpiarUsuario(Usuario) };
  }
  // Invalida la contraseña anterior después del cambio.
  async CambiarContrasena(Usuario, Datos) {
    const Completo = await this.RepositorioUsuarios.BuscarPorId(Usuario.id);
    if (
      !(await bcrypt.compare(Datos.ContrasenaActual, Completo.contrasena_hash))
    ) {
      throw new ErrorAplicacion(
        "La contraseña actual no es correcta.",
        "CONTRASENA_ACTUAL_INVALIDA",
        400,
      );
    }
    await this.RepositorioUsuarios.CambiarContrasena(
      Usuario.id,
      await bcrypt.hash(Datos.ContrasenaNueva, 12),
    );
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "CAMBIAR_CONTRASENA",
      "USUARIO",
      Usuario.id,
      null,
    );
    return { Mensaje: "La contraseña fue cambiada correctamente." };
  }
  LimpiarUsuario(Usuario) {
    const { contrasena_hash, ...Datos } = Usuario;
    return Datos;
  }
}