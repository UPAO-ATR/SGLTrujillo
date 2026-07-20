// Atiende el inicio de sesión y el cambio de contraseña.

export class ControladorAutenticacion {
  constructor(ServicioAutenticacion) {
    this.ServicioAutenticacion = ServicioAutenticacion;
  }
  IniciarSesion = async (Solicitud, Respuesta) => {
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioAutenticacion.IniciarSesion(
        Solicitud.DatosValidados.Correo,
        Solicitud.DatosValidados.Contrasena,
      ),
    });
  };
  ObtenerSesion = async (Solicitud, Respuesta) => {
    const { contrasena_hash, ...Usuario } = Solicitud.Usuario;
    Respuesta.json({ Exito: true, Datos: Usuario });
  };
  CambiarContrasena = async (Solicitud, Respuesta) => {
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioAutenticacion.CambiarContrasena(
        Solicitud.Usuario,
        Solicitud.DatosValidados,
      ),
    });
  };
}