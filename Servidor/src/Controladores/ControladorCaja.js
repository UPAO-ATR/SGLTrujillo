// Atiende las operaciones diarias de caja.

import { Constantes } from "../Configuracion/Constantes.js";
export class ControladorCaja {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  ObtenerActual = async (Solicitud, Respuesta) => {
    const Caja = await this.ServicioCaja.ObtenerCajaActual(
      Solicitud.Usuario.id,
    );
    if (Caja)
      Caja.Transacciones = await this.RepositorioCaja.ListarTransacciones(
        Caja.id,
        Solicitud.query.MedioPago,
      );
    Respuesta.json({ Exito: true, Datos: Caja });
  };
  Abrir = async (Solicitud, Respuesta) =>
    Respuesta.status(201).json({
      Exito: true,
      Datos: await this.ServicioCaja.AbrirCaja(
        Solicitud.Usuario.id,
        Solicitud.DatosValidados?.FondoInicial ?? Constantes.FondoInicialCaja,
        Solicitud.Usuario,
      ),
    });
  RegistrarTransaccion = async (Solicitud, Respuesta) =>
    Respuesta.status(201).json({
      Exito: true,
      Datos: await this.ServicioCaja.RegistrarTransaccion(
        Solicitud.Usuario.id,
        Solicitud.DatosValidados,
        Solicitud.Usuario,
      ),
    });
  RegistrarSangria = async (Solicitud, Respuesta) =>
    Respuesta.status(201).json({
      Exito: true,
      Datos: await this.ServicioCaja.RegistrarSangria(
        Solicitud.Usuario.id,
        Solicitud.DatosValidados.Monto,
        Solicitud.DatosValidados.Motivo,
        Solicitud.Usuario,
      ),
    });
  RealizarArqueo = async (Solicitud, Respuesta) =>
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioCaja.RealizarArqueo(
        Solicitud.Usuario.id,
        Solicitud.DatosValidados.EfectivoFisico,
        Solicitud.Usuario,
      ),
    });
  Cerrar = async (Solicitud, Respuesta) =>
    Respuesta.json({
      Exito: true,
      Datos: await this.ServicioCaja.CerrarCaja(
        Solicitud.Usuario.id,
        Solicitud.DatosValidados.EfectivoFisico,
        Solicitud.Usuario,
      ),
    });
}