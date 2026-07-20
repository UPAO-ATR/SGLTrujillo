// Aplica las reglas de apertura, cobro, arqueo y cierre de caja.

import { Constantes } from "../Configuracion/Constantes.js";
import { MediosPagoCajera } from "../Dominio/MediosPago.js";
import { ErrorAplicacion, ErrorConflicto } from "../Dominio/Errores.js";
import { AhoraPeru } from "../Utilidades/Fechas.js";
// Suma el fondo y las ventas, luego descuenta las sangrías.
export function CalcularEfectivoEsperado(
  FondoInicial,
  VentasEfectivo,
  Sangrias,
) {
  return Number(FondoInicial) + Number(VentasEfectivo) - Number(Sangrias);
}
export class ServicioCaja {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  async ObtenerCajaActual(CajeraId) {
    const Caja = await this.RepositorioCaja.BuscarCajaDelDia(
      CajeraId,
      AhoraPeru().toISODate(),
    );
    return Caja ? this.CompletarCaja(Caja) : null;
  }
  // Permite una sola apertura diaria con el fondo obligatorio.
  async AbrirCaja(CajeraId, FondoInicial, Usuario) {
    if (Number(FondoInicial) !== Constantes.FondoInicialCaja)
      throw new ErrorAplicacion(
        `La jornada debe iniciar con un fondo fijo de S/ ${Constantes.FondoInicialCaja.toFixed(2)}.`,
        "FONDO_INVALIDO",
        400,
      );
    const Fecha = AhoraPeru().toISODate();
    if (await this.RepositorioCaja.BuscarCajaDelDia(CajeraId, Fecha))
      throw new ErrorConflicto("La caja de hoy ya fue abierta.");
    const Caja = await this.RepositorioCaja.Abrir(
      CajeraId,
      Fecha,
      FondoInicial,
    );
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "ABRIR_CAJA",
      "CAJA",
      Caja.id,
      { FondoInicial },
    );
    return this.CompletarCaja(Caja);
  }
  // Registra un pago solo cuando la caja está habilitada.
  async RegistrarTransaccion(CajeraId, Datos, Usuario) {
    if (!MediosPagoCajera.includes(Datos.MedioPago))
      throw new ErrorAplicacion(
        "La cajera solo puede registrar Yape, Plin o efectivo.",
        "MEDIO_PAGO_INVALIDO",
        400,
      );
    const Caja = await this.ObtenerCajaActual(CajeraId);
    if (!Caja || Caja.estado !== "ABIERTA")
      throw new ErrorAplicacion(
        "Debe abrir la caja antes de registrar pagos.",
        "CAJA_CERRADA",
        409,
      );
    if (Datos.MedioPago === "EFECTIVO" && Caja.RequiereSangria)
      throw new ErrorAplicacion(
        "Debe registrar una sangría antes de continuar con pagos en efectivo.",
        "SANGRIA_OBLIGATORIA",
        409,
      );
    const Solicitud = Datos.SolicitudId
      ? await this.RepositorioSolicitudes.BuscarPorId(Datos.SolicitudId)
      : null;
    if (Datos.SolicitudId && !Solicitud)
      throw new ErrorAplicacion(
        "La solicitud asociada no existe.",
        "SOLICITUD_NO_EXISTE",
        404,
      );
    const Pago = Datos.PagoId
      ? await this.RepositorioPagos.BuscarPorId(Datos.PagoId)
      : null;
    if (Datos.PagoId && !Pago)
      throw new ErrorAplicacion(
        "El pago asociado no existe.",
        "PAGO_NO_EXISTE",
        404,
      );
    if (Pago && Pago.estado !== "CONFIRMADO")
      throw new ErrorAplicacion(
        "El pago debe estar confirmado antes de registrarlo en caja.",
        "PAGO_NO_CONFIRMADO",
        409,
      );
    if (
      Pago &&
      Datos.SolicitudId &&
      Number(Pago.solicitud_id) !== Number(Datos.SolicitudId)
    )
      throw new ErrorAplicacion(
        "El pago no pertenece a la solicitud indicada.",
        "PAGO_SOLICITUD_INVALIDO",
        400,
      );
    if (
      Datos.PagoId &&
      (await this.RepositorioCaja.BuscarTransaccionPorPago(Datos.PagoId))
    )
      throw new ErrorConflicto("El pago ya fue registrado en la caja diaria.");
    const Transaccion = await this.RepositorioCaja.RegistrarTransaccion({
      CajaId: Caja.id,
      ...Datos,
    });
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "REGISTRAR_PAGO_CAJA",
      "TRANSACCION_CAJA",
      Transaccion.id,
      Datos,
    );
    return { Transaccion, Caja: await this.ObtenerCajaActual(CajeraId) };
  }
  // Retira efectivo sin modificar el total de ventas.
  async RegistrarSangria(CajeraId, Monto, Motivo, Usuario) {
    const Caja = await this.ObtenerCajaActual(CajeraId);
    if (!Caja || Caja.estado !== "ABIERTA")
      throw new ErrorAplicacion(
        "La caja no se encuentra abierta.",
        "CAJA_CERRADA",
        409,
      );
    const Disponible = CalcularEfectivoEsperado(
      Caja.fondo_inicial,
      Caja.Totales.efectivo,
      Caja.Totales.sangrias,
    );
    if (Number(Monto) > Disponible)
      throw new ErrorAplicacion(
        "La sangría no puede superar el efectivo disponible.",
        "SANGRIA_EXCESIVA",
        400,
      );
    const Sangria = await this.RepositorioCaja.RegistrarSangria({
      CajaId: Caja.id,
      Monto,
      Motivo,
    });
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "REGISTRAR_SANGRIA",
      "SANGRIA",
      Sangria.id,
      { Monto, Motivo },
    );
    return { Sangria, Caja: await this.ObtenerCajaActual(CajeraId) };
  }
  // Compara el efectivo contado con el efectivo esperado.
  async RealizarArqueo(CajeraId, EfectivoFisico, Usuario) {
    const Caja = await this.ObtenerCajaActual(CajeraId);
    if (!Caja || Caja.estado !== "ABIERTA")
      throw new ErrorAplicacion(
        "La caja no se encuentra abierta.",
        "CAJA_CERRADA",
        409,
      );
    const Esperado = CalcularEfectivoEsperado(
      Caja.fondo_inicial,
      Caja.Totales.efectivo,
      Caja.Totales.sangrias,
    );
    const Diferencia = Number(EfectivoFisico) - Esperado;
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "REALIZAR_ARQUEO",
      "CAJA",
      Caja.id,
      { EfectivoFisico, Esperado, Diferencia },
    );
    if (Math.abs(Diferencia) >= 0.01) {
      const AlertaExistente =
        await this.RepositorioAlertas.BuscarDescuadrePendiente(Caja.id);
      if (!AlertaExistente) {
        const NombreCajera =
          `${Usuario?.nombres || "Cajera"} ${Usuario?.apellido_paterno || ""}`.trim();
        await this.RepositorioAlertas.Crear({
          CajeraId,
          CajaId: Caja.id,
          Tipo: "DESCUADRE_CAJA",
          Mensaje: `${NombreCajera} presenta un descuadre de caja de S/ ${Diferencia.toFixed(2)}.`,
          Detalles: { EfectivoFisico, Esperado, Diferencia },
        });
      }
    }
    return {
      EfectivoFisico: Number(EfectivoFisico),
      EfectivoEsperado: Esperado,
      Diferencia,
      Cuadra: Math.abs(Diferencia) < 0.01,
    };
  }
  // Impide cerrar mientras exista cualquier descuadre.
  async CerrarCaja(CajeraId, EfectivoFisico, Usuario) {
    const Caja = await this.ObtenerCajaActual(CajeraId);
    if (!Caja || Caja.estado !== "ABIERTA")
      throw new ErrorAplicacion(
        "La caja no se encuentra abierta.",
        "CAJA_CERRADA",
        409,
      );
    const Arqueo = await this.RealizarArqueo(CajeraId, EfectivoFisico, Usuario);
    if (!Arqueo.Cuadra) {
      await this.ServicioAuditoria.Registrar(
        Usuario,
        "DESCUADRE_CAJA",
        "CAJA",
        Caja.id,
        Arqueo,
      );
      throw new ErrorAplicacion(
        `No puede cerrar la caja. Existe un descuadre de S/ ${Arqueo.Diferencia.toFixed(2)}.`,
        "DESCUADRE_CAJA",
        409,
        Arqueo,
      );
    }
    const Cerrada = await this.RepositorioCaja.Cerrar(
      Caja.id,
      Arqueo.EfectivoFisico,
      Arqueo.EfectivoEsperado,
      Arqueo.Diferencia,
    );
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "CERRAR_CAJA",
      "CAJA",
      Caja.id,
      Arqueo,
    );
    return Cerrada;
  }
  // Calcula totales y determina si la sangría es obligatoria.
  async CompletarCaja(Caja) {
    const Totales = await this.RepositorioCaja.ObtenerTotales(Caja.id);
    const Umbral = Number(
      await this.RepositorioConfiguracion.ObtenerValor(
        "UmbralSangria",
        Constantes.UmbralSangriaPredeterminado,
      ),
    );
    const Datos = {
      efectivo: Number(Totales.efectivo),
      yape: Number(Totales.yape),
      plin: Number(Totales.plin),
      sangrias: Number(Totales.sangrias),
    };
    return {
      ...Caja,
      Totales: Datos,
      EfectivoEnRegistradora: CalcularEfectivoEsperado(
        Caja.fondo_inicial,
        Datos.efectivo,
        Datos.sangrias,
      ),
      UmbralSangria: Umbral,
      RequiereSangria: Datos.efectivo - Datos.sangrias >= Umbral,
    };
  }
}