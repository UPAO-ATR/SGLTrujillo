// Crea pagos y procesa sus confirmaciones sin duplicados.

import { randomUUID } from "node:crypto";
import { Constantes } from "../Configuracion/Constantes.js";
import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
import {
  EstadosSolicitud,
  ValidarTransicionSolicitud,
} from "../Dominio/EstadosSolicitud.js";
import { TiposSolicitud } from "../Dominio/TiposSolicitud.js";
import {
  MediosPagoCajera,
  MediosPagoCiudadano,
} from "../Dominio/MediosPago.js";
import { ErrorAplicacion, ErrorNoEncontrado } from "../Dominio/Errores.js";
import { GenerarNumeroBoleta } from "../Utilidades/Codigos.js";
import { AhoraPeru } from "../Utilidades/Fechas.js";
import { GenerarBoletaPdf } from "../Integraciones/Pdf/GeneradorBoleta.js";
export class ServicioPagos {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  // Valida el canal de pago antes de crear la operación.
  async CrearPago(SolicitudId, MedioPago, Referencia = "") {
    const Solicitud =
      await this.RepositorioSolicitudes.BuscarPorId(SolicitudId);
    if (!Solicitud) throw new ErrorNoEncontrado("No se encontró la solicitud.");
    if (await this.RepositorioPagos.BuscarConfirmadoPorSolicitud(SolicitudId))
      throw new ErrorAplicacion(
        "La solicitud ya tiene un pago confirmado.",
        "PAGO_DUPLICADO",
        409,
      );
    if (Solicitud.tipo === TiposSolicitud.Nueva && !Solicitud.plano_ruta)
      throw new ErrorAplicacion(
        "Debe subir el plano antes de continuar con el pago.",
        "PLANO_OBLIGATORIO",
        400,
      );
    const Presencial = Solicitud.origen === "CAJERA";
    const Permitidos = Presencial ? MediosPagoCajera : MediosPagoCiudadano;
    if (!Permitidos.includes(MedioPago))
      throw new ErrorAplicacion(
        Presencial
          ? "La atención presencial solo admite Yape, Plin o efectivo."
          : "El trámite web solo admite tarjeta, Yape, Plin o CIP.",
        "MEDIO_PAGO_INVALIDO",
        400,
      );
    if (
      Presencial &&
      ["YAPE", "PLIN"].includes(MedioPago) &&
      !String(Referencia || "").trim()
    )
      throw new ErrorAplicacion(
        "Ingrese el número de operación del pago digital.",
        "REFERENCIA_OBLIGATORIA",
        400,
      );
    // Usa un monto reducido únicamente en modo demostración.
    const MontoCobrado = Presencial
      ? Constantes.MontoOficial
      : ConfiguracionEntorno.ModoDemostracion
        ? ConfiguracionEntorno.MontoCobroDemostracion
        : Constantes.MontoOficial;
    const Pago = await this.RepositorioPagos.Crear({
      SolicitudId,
      MedioPago,
      MontoOficial: Constantes.MontoOficial,
      MontoCobrado,
      ClaveIdempotencia: randomUUID(),
    });
    const Preferencia = Presencial
      ? {
          Modo: "PRESENCIAL",
          ReferenciaExterna:
            String(Referencia || "").trim() || `PRESENCIAL-${Pago.id}`,
          UrlPago: null,
        }
      : await this.ClienteMercadoPago.CrearPreferencia({
          PagoId: Pago.id,
          SolicitudId,
          MontoCobrado,
        });
    await this.BaseDatos.query(
      "UPDATE pagos SET referencia_externa=$2,respuesta_proveedor=$3 WHERE id=$1",
      [Pago.id, Preferencia.ReferenciaExterna, Preferencia],
    );
    return {
      Pago: { ...Pago, referencia_externa: Preferencia.ReferenciaExterna },
      Preferencia,
    };
  }
  // Procesa la confirmación dentro de una sola transacción.
  async ConfirmarPago(
    PagoId,
    Referencia,
    RespuestaProveedor = null,
    Usuario = null,
  ) {
    return this.ConTransaccion(async (Cliente) => {
      await Cliente.query("SELECT pg_advisory_xact_lock($1)", [Number(PagoId)]);
      const Pago = await this.RepositorioPagos.BuscarPorId(PagoId, Cliente);
      if (!Pago) throw new ErrorNoEncontrado("No se encontró el pago.");
      // Devuelve el resultado anterior cuando la confirmación se repite.
      if (Pago.estado === "CONFIRMADO")
        return {
          Pago,
          Solicitud: await this.RepositorioSolicitudes.BuscarPorId(
            Pago.solicitud_id,
            Cliente,
          ),
          YaProcesado: true,
        };
      const Confirmado = await this.RepositorioPagos.Confirmar(
        Pago.id,
        Referencia,
        RespuestaProveedor,
        Cliente,
      );
      const Solicitud = await this.RepositorioSolicitudes.BuscarPorId(
        Pago.solicitud_id,
        Cliente,
      );
      const NumeroBoleta = GenerarNumeroBoleta(Solicitud.id);
      const Buffer = await GenerarBoletaPdf({
        NumeroBoleta,
        FechaEmision: AhoraPeru().toISO(),
        Ruc: Solicitud.ruc,
        RazonSocial: Solicitud.razon_social,
        DomicilioFiscal: Solicitud.domicilio_fiscal,
        TipoSolicitud: Solicitud.tipo,
        MedioPago: Pago.medio_pago,
        MontoOficial: Pago.monto_oficial,
        MontoCobrado: Pago.monto_cobrado,
        CodigoPago: Solicitud.codigo_pago,
        CodigoInspeccion: Solicitud.codigo_inspeccion,
      });
      const Ruta = await this.AlmacenArchivos.Subir(
        Buffer,
        `boletas/${Solicitud.codigo_inspeccion}/${NumeroBoleta}.pdf`,
        "application/pdf",
      );
      await this.RepositorioBoletas.Crear(
        { SolicitudId: Solicitud.id, NumeroBoleta, RutaArchivo: Ruta },
        Cliente,
      );
      let InspeccionCreada = null;
      // La renovación directa genera licencia sin inspección.
      const EsRenovacionDirecta =
        Solicitud.tipo === TiposSolicitud.Renovacion &&
        Solicitud.opcion_renovacion === "PAGO_DIRECTO";
      if (EsRenovacionDirecta) {
        ValidarTransicionSolicitud(Solicitud.estado, EstadosSolicitud.Aprobado);
        await this.ServicioLicencias.GenerarLicencia(Solicitud.id, Cliente);
      } else {
        ValidarTransicionSolicitud(
          Solicitud.estado,
          EstadosSolicitud.EnProceso,
        );
        await this.RepositorioSolicitudes.ActualizarEstado(
          Solicitud.id,
          EstadosSolicitud.EnProceso,
          Cliente,
        );
        InspeccionCreada =
          await this.ServicioInspecciones.CrearPrimeraInspeccion(
            Solicitud.id,
            Confirmado.fecha_confirmacion || new Date(),
            Cliente,
          );
      }
      await this.ServicioAuditoria.Registrar(
        Usuario,
        "CONFIRMAR_PAGO",
        "PAGO",
        Pago.id,
        { SolicitudId: Solicitud.id, MedioPago: Pago.medio_pago },
        Cliente,
      );
      const MensajeCorreo = EsRenovacionDirecta
        ? `El pago fue confirmado y su nueva licencia ya está disponible. Código de seguimiento: ${Solicitud.codigo_inspeccion}.`
        : InspeccionCreada?.fecha_programada
          ? `El pago fue confirmado. Su inspección fue programada para el ${String(
              InspeccionCreada.fecha_programada,
            ).slice(0, 10)} a las ${InspeccionCreada.hora_programada}. Código de inspección: ${Solicitud.codigo_inspeccion}.`
          : `El pago fue confirmado. Su inspección está en espera de un cupo disponible. Código de inspección: ${Solicitud.codigo_inspeccion}.`;
      await this.ServicioNotificaciones.Enviar(
        Solicitud.correo,
        EsRenovacionDirecta
          ? "Renovación confirmada"
          : "Pago e inspección confirmados",
        MensajeCorreo,
        Cliente,
      );
      return {
        Pago: Confirmado,
        Solicitud: await this.RepositorioSolicitudes.BuscarPorId(
          Solicitud.id,
          Cliente,
        ),
        YaProcesado: false,
      };
    });
  }
  // Acepta únicamente webhooks firmados y pagos aprobados.
  async ProcesarWebhook(Cuerpo, Seguridad) {
    this.ClienteMercadoPago.ValidarFirmaWebhook(Seguridad);
    const IdExterno = Cuerpo?.data?.id || Cuerpo?.id;
    if (!IdExterno) return { Ignorado: true };
    const DatosPago = await this.ClienteMercadoPago.ConsultarPago(IdExterno);
    if (DatosPago.status !== "approved")
      return { Ignorado: true, Estado: DatosPago.status };
    const PagoId = Number(DatosPago.external_reference);
    if (!PagoId)
      throw new ErrorAplicacion(
        "El webhook no contiene una referencia válida.",
        "WEBHOOK_INVALIDO",
        400,
      );
    return this.ConfirmarPago(PagoId, String(IdExterno), DatosPago);
  }
}