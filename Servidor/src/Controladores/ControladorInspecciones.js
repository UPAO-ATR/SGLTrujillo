// Atiende la consulta y resolución de inspecciones.

import { AhoraPeru } from "../Utilidades/Fechas.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
import { ErrorNoAutorizado, ErrorNoEncontrado } from "../Dominio/Errores.js";
export class ControladorInspecciones {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  Listar = async (Solicitud, Respuesta) => {
    const F = {
      FechaDesde: Solicitud.query.FechaDesde,
      FechaHasta: Solicitud.query.FechaHasta,
      FechaExacta:
        Solicitud.Usuario.rol === RolesUsuario.Inspector
          ? AhoraPeru().toISODate()
          : Solicitud.query.FechaExacta,
      Estado:
        Solicitud.Usuario.rol === RolesUsuario.Inspector
          ? "PENDIENTE"
          : Solicitud.query.Estado,
      NombreNegocio: Solicitud.query.NombreNegocio,
    };
    Respuesta.json({
      Exito: true,
      Datos: await this.RepositorioInspecciones.Listar(F),
    });
  };
  async ValidarAccesoInspector(Inspeccion, Usuario) {
    if (Usuario.rol !== RolesUsuario.Inspector) return;
    const FechaHoy = AhoraPeru().toISODate();
    const FechaInspeccion = Inspeccion.fecha_programada
      ? String(Inspeccion.fecha_programada).slice(0, 10)
      : "";
    if (Inspeccion.estado !== "PENDIENTE" || FechaInspeccion !== FechaHoy)
      throw new ErrorNoAutorizado(
        "El inspector solo puede trabajar con inspecciones pendientes del día actual.",
      );
  }
  async BuscarDetalleAutorizado(Id, Usuario) {
    const Detalle = await this.RepositorioInspecciones.BuscarPorId(Id);
    if (!Detalle) throw new ErrorNoEncontrado("No se encontró la inspección.");
    await this.ValidarAccesoInspector(Detalle, Usuario);
    return Detalle;
  }
  ObtenerDetalle = async (Solicitud, Respuesta) => {
    const Detalle = await this.BuscarDetalleAutorizado(
      Solicitud.params.id,
      Solicitud.Usuario,
    );
    Respuesta.json({ Exito: true, Datos: Detalle });
  };
  RegistrarResultado = async (Solicitud, Respuesta) => {
    await this.BuscarDetalleAutorizado(
      Solicitud.params.id,
      Solicitud.Usuario,
    );
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioInspecciones.RegistrarResultado(
        Solicitud.params.id,
        Solicitud.DatosValidados,
        Solicitud.Usuario,
      ),
    });
  };
  RegistrarObservaciones = async (Solicitud, Respuesta) => {
    await this.BuscarDetalleAutorizado(
      Solicitud.params.id,
      Solicitud.Usuario,
    );
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioInspecciones.RegistrarResultado(
        Solicitud.params.id,
        {
          Resultado: "OBSERVADO",
          Observaciones: Solicitud.DatosValidados.Observaciones,
        },
        Solicitud.Usuario,
      ),
    });
  };
  EjecutarReprogramacion = async (Solicitud, Respuesta) =>
    Respuesta.json({
      Exito: true,
      Datos: {
        CantidadReprogramada:
          await this.ServicioInspecciones.ReprogramarNoRealizadas(
            Solicitud.body.Fecha || AhoraPeru().toISODate(),
          ),
      },
    });

  PrepararDemostracion = async (Solicitud, Respuesta) =>
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioInspecciones.PrepararInspeccionParaHoy(
        Solicitud.DatosValidados.NumeroVisita,
        Solicitud.Usuario,
      ),
    });
}