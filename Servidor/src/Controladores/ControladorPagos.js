// Atiende la creación y confirmación de pagos.

import { ConfiguracionEntorno } from "../Configuracion/ConfiguracionEntorno.js";
import { ErrorNoAutorizado, ErrorNoEncontrado } from "../Dominio/Errores.js";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
export class ControladorPagos {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  async AutorizarOperacionPublica(SolicitudId, Codigo, Usuario) {
    if (Usuario?.rol === RolesUsuario.Cajera) {
      const Solicitud = await this.RepositorioSolicitudes.BuscarPorId(
        SolicitudId,
      );
      if (!Solicitud || Solicitud.origen !== "CAJERA")
        throw new ErrorNoAutorizado(
          "La cajera solo puede procesar pagos de atenciones presenciales.",
        );
      return;
    }
    const R = await this.RepositorioSolicitudes.BuscarPorCodigo(Codigo || "");
    if (!R || Number(R.id) !== Number(SolicitudId))
      throw new ErrorNoAutorizado(
        "El código no autoriza esta operación sobre la solicitud.",
      );
  }
  CrearPago = async (Solicitud, Respuesta) => {
    await this.AutorizarOperacionPublica(
      Solicitud.params.id,
      Solicitud.query.Codigo,
      Solicitud.Usuario,
    );
    Respuesta.status(201).json({
      Exito: true,
      Datos: await this.ServicioPagos.CrearPago(
        Solicitud.params.id,
        Solicitud.DatosValidados.MedioPago,
        Solicitud.DatosValidados.Referencia,
      ),
    });
  };
  ProcesarWebhook = async (Solicitud, Respuesta) => {
    const Datos = await this.ServicioPagos.ProcesarWebhook(Solicitud.body, {
      Firma: Solicitud.headers["x-signature"],
      IdSolicitud: Solicitud.headers["x-request-id"],
      IdDato: Solicitud.query["data.id"] || Solicitud.body?.data?.id,
    });
    Respuesta.json({ Exito: true, Datos });
  };
  async ConfirmarPagoDeCajera(Pago, Usuario) {
    const Caja = await this.ServicioCaja.ObtenerCajaActual(Usuario.id);
    if (!Caja || Caja.estado !== "ABIERTA")
      throw new ErrorNoAutorizado(
        "Debe abrir la caja antes de confirmar un pago presencial.",
      );
    if (Pago.medio_pago === "EFECTIVO" && Caja.RequiereSangria)
      throw new ErrorNoAutorizado(
        "Debe registrar una sangría antes de continuar con pagos en efectivo.",
      );

    const Resultado = await this.ServicioPagos.ConfirmarPago(
      Pago.id,
      Pago.referencia_externa || `PRESENCIAL-${Pago.id}`,
      { Modo: "PRESENCIAL" },
      Usuario,
    );
    const YaRegistrado =
      await this.RepositorioCaja.BuscarTransaccionPorPago(Pago.id);
    if (!YaRegistrado)
      await this.ServicioCaja.RegistrarTransaccion(
        Usuario.id,
        {
          SolicitudId: Pago.solicitud_id,
          PagoId: Pago.id,
          MedioPago: Pago.medio_pago,
          Monto: Number(Pago.monto_oficial),
          Referencia: Pago.referencia_externa || undefined,
        },
        Usuario,
      );
    return Resultado;
  }

  ConfirmarPresencial = async (Solicitud, Respuesta) => {
    const Pago = await this.RepositorioPagos.BuscarPorId(Solicitud.params.id);
    if (!Pago) throw new ErrorNoEncontrado("No se encontró el pago.");
    const Registro = await this.RepositorioSolicitudes.BuscarPorId(
      Pago.solicitud_id,
    );
    if (!Registro || Registro.origen !== "CAJERA")
      throw new ErrorNoAutorizado(
        "Este pago no pertenece a una atención presencial.",
      );
    const Resultado = await this.ConfirmarPagoDeCajera(
      Pago,
      Solicitud.Usuario,
    );
    Respuesta.json({ Exito: true, Datos: Resultado });
  };

  ConfirmarDemostracion = async (Solicitud, Respuesta) => {
    if (!ConfiguracionEntorno.ModoDemostracion)
      throw new ErrorNoAutorizado(
        "La confirmación manual solo está disponible en modo de demostración.",
      );
    const Pago = await this.RepositorioPagos.BuscarPorId(Solicitud.params.id);
    if (!Pago) throw new ErrorNoEncontrado("No se encontró el pago.");
    await this.AutorizarOperacionPublica(
      Pago.solicitud_id,
      Solicitud.query.Codigo,
      Solicitud.Usuario,
    );
    const Resultado =
      Solicitud.Usuario?.rol === RolesUsuario.Cajera
        ? await this.ConfirmarPagoDeCajera(Pago, Solicitud.Usuario)
        : await this.ServicioPagos.ConfirmarPago(
            Solicitud.params.id,
            `DEMO-${Solicitud.params.id}`,
            { Modo: "DEMOSTRACION" },
          );
    Respuesta.json({ Exito: true, Datos: Resultado });
  };
  DescargarBoleta = async (Solicitud, Respuesta) => {
    const Registro = await this.RepositorioSolicitudes.BuscarPorId(
      Solicitud.params.solicitudId,
    );
    if (!Registro) throw new ErrorNoEncontrado("No se encontró la solicitud.");
    const Consulta = await this.RepositorioSolicitudes.BuscarPorCodigo(
      Solicitud.query.Codigo || "",
    );
    if (!Consulta || Number(Consulta.id) !== Number(Registro.id))
      throw new ErrorNoAutorizado(
        "El código no autoriza la descarga de esta constancia.",
      );
    const Boleta = await this.RepositorioBoletas.BuscarPorSolicitud(
      Registro.id,
    );
    if (!Boleta)
      throw new ErrorNoEncontrado("La constancia todavía no está disponible.");
    Respuesta.json({
      Exito: true,
      Datos: {
        Url: await this.AlmacenArchivos.GenerarUrlTemporal(
          Boleta.ruta_archivo,
          15,
        ),
        NumeroBoleta: Boleta.numero_boleta,
      },
    });
  };
}