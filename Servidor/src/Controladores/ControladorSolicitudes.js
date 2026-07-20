// Atiende la creación, seguimiento y archivos de solicitudes.

import { DetectarTipoArchivo } from "../Utilidades/Archivos.js";
import {
  ErrorAplicacion,
  ErrorNoEncontrado,
  ErrorNoAutorizado,
} from "../Dominio/Errores.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
export class ControladorSolicitudes {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  ConsultarRuc = async (Solicitud, Respuesta) => {
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioSolicitudes.ConsultarRuc(Solicitud.params.ruc),
    });
  };
  CrearSolicitud = async (Solicitud, Respuesta) => {
    if (
      Solicitud.DatosValidados.Origen === "CAJERA" &&
      Solicitud.Usuario?.rol !== RolesUsuario.Cajera
    )
      throw new ErrorNoAutorizado(
        "Solo una cajera autenticada puede crear solicitudes presenciales.",
      );
    Respuesta.status(201).json({
      Exito: true,
      Datos: await this.ServicioSolicitudes.CrearSolicitud(
        Solicitud.DatosValidados,
        Solicitud.Usuario || null,
      ),
    });
  };
  ConsultarSeguimiento = async (Solicitud, Respuesta) => {
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioSolicitudes.ConsultarSeguimiento(
        Solicitud.params.codigo,
      ),
    });
  };
  SubirPlano = async (Solicitud, Respuesta) => {
    if (!Solicitud.file?.buffer?.length)
      throw new ErrorAplicacion(
        "Debe seleccionar un archivo para el plano.",
        "ARCHIVO_OBLIGATORIO",
        400,
      );
    const SolicitudRegistrada = await this.RepositorioSolicitudes.BuscarPorId(
      Solicitud.params.id,
    );
    if (!SolicitudRegistrada)
      throw new ErrorNoEncontrado("No se encontró la solicitud.");
    if (Solicitud.Usuario?.rol === RolesUsuario.Cajera) {
      if (SolicitudRegistrada.origen !== "CAJERA")
        throw new ErrorNoAutorizado(
          "La cajera solo puede cargar planos de atenciones presenciales.",
        );
    } else {
      const Registro = await this.RepositorioSolicitudes.BuscarPorCodigo(
        Solicitud.query.Codigo || "",
      );
      if (!Registro || Number(Registro.id) !== Number(Solicitud.params.id))
        throw new ErrorNoAutorizado(
          "El código no autoriza la carga del plano para esta solicitud.",
        );
    }
    const TipoDetectado = DetectarTipoArchivo(Solicitud.file.buffer);
    if (!TipoDetectado)
      throw new ErrorAplicacion(
        "El archivo no corresponde a un PDF, JPG o PNG válido.",
        "ARCHIVO_INVALIDO",
        400,
      );
    const Datos = await this.ServicioSolicitudes.GuardarPlano(
      Solicitud.params.id,
      {
        Buffer: Solicitud.file.buffer,
        NombreOriginal: Solicitud.file.originalname,
        TipoDetectado,
      },
      Solicitud.Usuario?.rol === RolesUsuario.Cajera,
    );
    Respuesta.json({ Exito: true, Datos });
  };
  DescargarPlano = async (Solicitud, Respuesta) => {
    const Registro = await this.RepositorioSolicitudes.BuscarPorId(
      Solicitud.params.id,
    );
    if (!Solicitud.Usuario) {
      const Autorizada = await this.RepositorioSolicitudes.BuscarPorCodigo(
        Solicitud.query.Codigo || "",
      );
      if (!Autorizada || Number(Autorizada.id) !== Number(Solicitud.params.id))
        throw new ErrorNoAutorizado(
          "El código no autoriza la descarga del plano de esta solicitud.",
        );
    } else if (
      ![
        RolesUsuario.Inspector,
        RolesUsuario.Administrador,
        RolesUsuario.Cajera,
      ].includes(Solicitud.Usuario.rol)
    ) {
      throw new ErrorNoAutorizado(
        "Su rol no permite consultar el plano de una solicitud.",
      );
    } else if (
      Solicitud.Usuario.rol === RolesUsuario.Cajera &&
      Registro.origen !== "CAJERA"
    ) {
      throw new ErrorNoAutorizado(
        "La cajera solo puede consultar planos de atenciones presenciales.",
      );
    }
    if (!Registro?.plano_ruta)
      throw new ErrorNoEncontrado("La solicitud no tiene un plano disponible.");
    Respuesta.json({
      Exito: true,
      Datos: {
        Url: await this.AlmacenArchivos.GenerarUrlTemporal(
          Registro.plano_ruta,
          15,
        ),
        Tipo: Registro.plano_tipo,
      },
    });
  };
}