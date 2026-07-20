// Traduce las peticiones administrativas a operaciones del servicio.

export class ControladorAdministracion {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  ListarInspectores = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.RepositorioUsuarios.ListarPorRol("INSPECTOR"),
    });
  ListarCajeras = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.RepositorioUsuarios.ListarPorRol("CAJERA"),
    });
  ConsultarDni = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.ServicioAdministracion.ConsultarDni(S.params.dni),
    });
  CrearTrabajador = async (S, R) =>
    R.status(201).json({
      Exito: true,
      Datos: await this.ServicioAdministracion.CrearTrabajador(
        S.DatosValidados.Dni,
        S.DatosValidados.Rol,
        S.Usuario,
      ),
    });
  CrearInspector = async (S, R) =>
    R.status(201).json({
      Exito: true,
      Datos: await this.ServicioAdministracion.CrearTrabajador(
        S.DatosValidados.Dni,
        "INSPECTOR",
        S.Usuario,
      ),
    });
  CambiarHabilitacion = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.ServicioAdministracion.CambiarHabilitacionTrabajador(
        S.params.id,
        S.DatosValidados.Habilitado,
        S.Usuario,
      ),
    });
  ListarConfiguraciones = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.RepositorioConfiguracion.Listar(),
    });
  ActualizarConfiguracion = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.ServicioAdministracion.ActualizarConfiguracion(
        S.DatosValidados.Clave,
        S.DatosValidados.Valor,
        S.Usuario,
      ),
    });
  ListarFeriados = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.RepositorioConfiguracion.ListarFeriados(),
    });
  GuardarFeriado = async (S, R) => {
    const D = await this.RepositorioConfiguracion.GuardarFeriado(
      S.DatosValidados.Fecha,
      S.DatosValidados.Descripcion,
      S.DatosValidados.Activo,
    );
    await this.ServicioAuditoria.Registrar(
      S.Usuario,
      "GUARDAR_FERIADO",
      "FERIADO",
      D.id,
      S.DatosValidados,
    );
    R.json({ Exito: true, Datos: D });
  };
  ListarAlertas = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.RepositorioAlertas.ListarPendientes(100),
    });
  MarcarAlertaAtendida = async (S, R) =>
    R.json({
      Exito: true,
      Datos: await this.RepositorioAlertas.MarcarAtendida(S.params.id),
    });
  ListarAuditoria = async (S, R) =>
    R.json({ Exito: true, Datos: await this.RepositorioAuditoria.Listar(300) });
  CrearAdministrador = async (S, R) =>
    R.status(201).json({
      Exito: true,
      Datos: await this.ServicioAdministracion.CrearAdministrador(
        S.DatosValidados.Dni,
        S.Usuario,
      ),
    });
}