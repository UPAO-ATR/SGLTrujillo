// Genera, consulta y prepara licencias para descarga.

import { DateTime } from "luxon";
import { Constantes } from "../Configuracion/Constantes.js";
import {
  EstadosSolicitud,
  ValidarTransicionSolicitud,
} from "../Dominio/EstadosSolicitud.js";
import { ErrorNoEncontrado } from "../Dominio/Errores.js";
import { GenerarNumeroLicencia } from "../Utilidades/Codigos.js";
import { AhoraPeru, DiasRestantes } from "../Utilidades/Fechas.js";
import {
  GenerarLicenciaPdf,
  AplicarMarcaAguaVencida,
} from "../Integraciones/Pdf/GeneradorLicencia.js";

export class ServicioLicencias {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }

  // Evita generar dos licencias para la misma solicitud.
  async GenerarLicencia(SolicitudId, Cliente = this.BaseDatos) {
    const Existente = await this.RepositorioLicencias.BuscarPorSolicitud(
      SolicitudId,
      Cliente,
    );
    if (Existente) return Existente;

    const Solicitud = await this.RepositorioSolicitudes.BuscarPorId(
      SolicitudId,
      Cliente,
    );
    if (!Solicitud) throw new ErrorNoEncontrado("No se encontró la solicitud.");

    // Calcula la vigencia desde la fecha oficial del Perú.
    const FechaGeneracion = AhoraPeru();
    const FechaVencimiento = FechaGeneracion.plus({
      days: Constantes.DiasVigenciaLicencia,
    });
    const NumeroLicencia = GenerarNumeroLicencia(
      Solicitud.id,
      FechaGeneracion.toJSDate(),
    );
    const BufferLicencia = await GenerarLicenciaPdf({
      NumeroLicencia,
      RazonSocial: Solicitud.razon_social,
      Ruc: Solicitud.ruc,
      DomicilioFiscal: Solicitud.domicilio_fiscal,
      Ubigeo: Solicitud.ubigeo,
      Expediente: NumeroLicencia,
      FechaGeneracion: FechaGeneracion.toFormat("dd/MM/yyyy"),
      FechaVencimiento: FechaVencimiento.toFormat("dd/MM/yyyy"),
    });
    const RutaArchivo = await this.AlmacenArchivos.Subir(
      BufferLicencia,
      `licencias/${Solicitud.ruc}/${NumeroLicencia}.pdf`,
      "application/pdf",
    );
    const Licencia = await this.RepositorioLicencias.Crear(
      {
        SolicitudId: Solicitud.id,
        NegocioId: Solicitud.negocio_id,
        NumeroLicencia,
        Expediente: NumeroLicencia,
        RutaArchivo,
        FechaGeneracion: FechaGeneracion.toISO(),
        FechaVencimiento: FechaVencimiento.toISO(),
      },
      Cliente,
    );

    if (Solicitud.estado !== EstadosSolicitud.Aprobado) {
      ValidarTransicionSolicitud(Solicitud.estado, EstadosSolicitud.Aprobado);
      await this.RepositorioSolicitudes.ActualizarEstado(
        Solicitud.id,
        EstadosSolicitud.Aprobado,
        Cliente,
      );
    }

    return Licencia;
  }

  // Calcula el estado de la licencia en cada consulta.
  async ConsultarPorRuc(Ruc) {
    const Licencia = await this.RepositorioLicencias.BuscarUltimaPorRuc(Ruc);
    if (!Licencia) return null;

    return {
      Id: Licencia.id,
      NumeroLicencia: Licencia.numero_licencia,
      Expediente: Licencia.expediente,
      FechaGeneracion: Licencia.fecha_generacion,
      FechaVencimiento: Licencia.fecha_vencimiento,
      Estado:
        DateTime.fromJSDate(new Date(Licencia.fecha_vencimiento)) >= AhoraPeru()
          ? "ACTIVA"
          : "VENCIDA",
      DiasRestantes: DiasRestantes(Licencia.fecha_vencimiento),
    };
  }

  // Genera un enlace temporal y marca las licencias vencidas.
  async PrepararDescarga(SolicitudId) {
    const Licencia =
      await this.RepositorioLicencias.BuscarPorSolicitud(SolicitudId);
    if (!Licencia)
      throw new ErrorNoEncontrado("La licencia todavía no está disponible.");

    const EstaVencida =
      DateTime.fromJSDate(new Date(Licencia.fecha_vencimiento)) < AhoraPeru();
    let RutaDescarga = Licencia.ruta_archivo;

    if (EstaVencida) {
      // Se conserva el original y se genera una copia temporal con marca de agua.
      const BufferOriginal = await this.AlmacenArchivos.Leer(
        Licencia.ruta_archivo,
      );
      const BufferMarcado = await AplicarMarcaAguaVencida(BufferOriginal);
      RutaDescarga = `licenciasVencidas/${Licencia.numero_licencia}-VENCIDA.pdf`;
      await this.AlmacenArchivos.Subir(
        BufferMarcado,
        RutaDescarga,
        "application/pdf",
      );
    }

    return {
      Url: await this.AlmacenArchivos.GenerarUrlTemporal(
        RutaDescarga,
        Constantes.MinutosUrlFirmada,
      ),
      DiasRestantes: DiasRestantes(Licencia.fecha_vencimiento),
      Vencida: EstaVencida,
    };
  }
}