// Atiende la consulta y descarga de licencias.

import { ErrorNoAutorizado } from "../Dominio/Errores.js";

export class ControladorLicencias {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }

  ConsultarPorRuc = async (Solicitud, Respuesta) => {
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioLicencias.ConsultarPorRuc(Solicitud.params.ruc),
    });
  };

  Descargar = async (Solicitud, Respuesta) => {
    const Registro = await this.RepositorioSolicitudes.BuscarPorCodigo(
      Solicitud.query.Codigo || "",
    );
    if (
      !Registro ||
      Number(Registro.id) !== Number(Solicitud.params.solicitudId)
    ) {
      throw new ErrorNoAutorizado(
        "El código no autoriza la descarga de esta licencia.",
      );
    }

    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioLicencias.PrepararDescarga(
        Solicitud.params.solicitudId,
      ),
    });
  };
}