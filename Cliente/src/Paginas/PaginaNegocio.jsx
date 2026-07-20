// Guía al ciudadano durante la solicitud o renovación de licencia.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AreaTexto from "../Componentes/AreaTexto.jsx";
import Boton from "../Componentes/Boton.jsx";
import CampoFormulario from "../Componentes/CampoFormulario.jsx";
import Estado from "../Componentes/Estado.jsx";
import Mensaje from "../Componentes/Mensaje.jsx";
import Panel from "../Componentes/Panel.jsx";
import Pasos from "../Componentes/Pasos.jsx";
import SelectorFormulario from "../Componentes/SelectorFormulario.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";
import { ConfiguracionAplicacion } from "../Configuracion/ConfiguracionAplicacion.js";
import {
  EsArchivoPermitidoCajera,
  EsArchivoPermitidoCiudadano,
  EsCorreoValido,
  EsRucValido,
  LimpiarRuc,
} from "../Utilidades/ValidadoresFormulario.js";
import {
  ConfirmarPagoDemostracion,
  ConfirmarPagoPresencial,
  ConsultarRuc,
  CrearPago,
  CrearSolicitud,
  SubirPlano,
} from "../Servicios/ServicioSolicitudes.js";

const PasosTramite = [
  "Validar RUC",
  "Crear solicitud",
  "Subir plano",
  "Realizar pago",
];

function ObtenerMensajeError(Error) {
  return Error?.message || "No se pudo completar la operación.";
}

export default function PaginaNegocio({
  Origen = "CIUDADANO",
  AlCompletar,
  SoloRenovacionDirecta = false,
}) {
  const Navegar = useNavigate();
  // Guarda los datos de cada paso del trámite.
  const [PasoActual, setPasoActual] = useState(0);
  const [Ruc, setRuc] = useState("");
  const [Correo, setCorreo] = useState("");
  const [DatosNegocio, setDatosNegocio] = useState(null);
  const [Tipo, setTipo] = useState("NUEVA");
  const [OpcionRenovacion, setOpcionRenovacion] = useState("");
  const [Solicitud, setSolicitud] = useState(null);
  const [Archivo, setArchivo] = useState(null);
  const [MedioPago, setMedioPago] = useState(
    Origen === "CAJERA" ? "EFECTIVO" : "TARJETA",
  );
  const [Referencia, setReferencia] = useState("");
  const [Pago, setPago] = useState(null);
  const [MensajeError, setMensajeError] = useState("");
  const [MensajeExito, setMensajeExito] = useState("");
  const [Ocupado, setOcupado] = useState(false);

  const EsRenovacion = Boolean(DatosNegocio?.Licencia);
  const RequierePlano =
    Tipo === "NUEVA" || OpcionRenovacion === "NUEVA_INSPECCION";

  // Consulta el RUC antes de mostrar el formulario.
  async function ValidarRuc(Evento) {
    Evento.preventDefault();
    setMensajeError("");
    setMensajeExito("");
    if (!EsRucValido(Ruc)) {
      setMensajeError("El RUC debe contener exactamente 11 números.");
      return;
    }

    try {
      setOcupado(true);
      const Datos = await ConsultarRuc(Ruc);
      if (SoloRenovacionDirecta && !Datos.Licencia)
        throw new Error(
          "El RUC consultado no tiene una licencia aprobada para renovar.",
        );
      if (!Datos.EsActivo)
        throw new Error("El contribuyente no se encuentra en estado ACTIVO.");
      if (!Datos.PerteneceATrujillo)
        throw new Error(
          "El domicilio fiscal no pertenece al ubigeo 130101 de Trujillo.",
        );
      setDatosNegocio(Datos);
      if (Datos.Licencia) {
        setTipo("RENOVACION");
        setOpcionRenovacion("PAGO_DIRECTO");
      }
      setPasoActual(1);
      setMensajeExito("El RUC fue validado correctamente.");
    } catch (Error) {
      setMensajeError(ObtenerMensajeError(Error));
    } finally {
      setOcupado(false);
    }
  }

  // Crea la solicitud con los datos ya validados.
  async function RegistrarSolicitud(Evento) {
    Evento.preventDefault();
    setMensajeError("");
    setMensajeExito("");

    if (!EsCorreoValido(Correo)) {
      setMensajeError("Ingrese un correo electrónico válido.");
      return;
    }

    try {
      setOcupado(true);
      const TipoSolicitud =
        EsRenovacion && OpcionRenovacion === "PAGO_DIRECTO"
          ? "RENOVACION"
          : "NUEVA";
      const Creada = await CrearSolicitud({
        Ruc,
        Correo,
        Tipo: TipoSolicitud,
        OpcionRenovacion: EsRenovacion ? OpcionRenovacion : undefined,
        Origen,
      });
      setSolicitud(Creada);
      setPasoActual(RequierePlano ? 2 : 3);
      setMensajeExito(
        `Solicitud creada. Su código de inspección es ${Creada.codigo_inspeccion}.`,
      );
    } catch (Error) {
      setMensajeError(ObtenerMensajeError(Error));
    } finally {
      setOcupado(false);
    }
  }

  // Sube el plano antes de habilitar el pago.
  async function GuardarPlano(Evento) {
    Evento.preventDefault();
    setMensajeError("");
    setMensajeExito("");

    if (!Archivo) {
      setMensajeError("Debe seleccionar el plano del local.");
      return;
    }
    const ArchivoPermitido =
      Origen === "CAJERA"
        ? EsArchivoPermitidoCajera(Archivo)
        : EsArchivoPermitidoCiudadano(Archivo);
    if (!ArchivoPermitido) {
      setMensajeError(
        Origen === "CAJERA"
          ? "La cajera solo puede subir archivos PDF, JPG o PNG."
          : "El ciudadano solo puede subir el plano en formato PDF.",
      );
      return;
    }

    try {
      setOcupado(true);
      await SubirPlano(Solicitud.id, Solicitud.codigo_inspeccion, Archivo);
      setPasoActual(3);
      setMensajeExito("El plano se guardó correctamente.");
    } catch (Error) {
      setMensajeError(ObtenerMensajeError(Error));
    } finally {
      setOcupado(false);
    }
  }

  // Crea la operación según el medio seleccionado.
  async function PrepararPago(Evento) {
    Evento.preventDefault();
    setMensajeError("");
    setMensajeExito("");

    try {
      setOcupado(true);
      const Creado = await CrearPago(
        Solicitud.id,
        Solicitud.codigo_inspeccion,
        MedioPago,
        Referencia,
      );
      setPago(Creado);

      if (Creado.Preferencia?.UrlPago || Creado.Preferencia?.UrlPagoPrueba) {
        window.open(
          Creado.Preferencia.UrlPagoPrueba || Creado.Preferencia.UrlPago,
          "_blank",
          "noopener,noreferrer",
        );
        setMensajeExito(
          "La pasarela se abrió en otra pestaña. Regrese aquí después de completar el pago.",
        );
      } else {
        setMensajeExito(
          "El pago de demostración fue preparado. Confírmelo para continuar con el flujo.",
        );
      }
    } catch (Error) {
      setMensajeError(ObtenerMensajeError(Error));
    } finally {
      setOcupado(false);
    }
  }

  // Confirma manualmente el pago en modo demostración.
  async function ConfirmarPago() {
    try {
      setOcupado(true);
      setMensajeError("");
      if (Origen === "CAJERA")
        await ConfirmarPagoPresencial(Pago.Pago.id);
      else
        await ConfirmarPagoDemostracion(
          Pago.Pago.id,
          Solicitud.codigo_inspeccion,
        );
      setMensajeExito(
        "El pago fue confirmado y la constancia ya está disponible.",
      );
      if (AlCompletar) AlCompletar(Solicitud.codigo_inspeccion);
      else
        setTimeout(
          () => Navegar(`/seguimiento?Codigo=${Solicitud.codigo_inspeccion}`),
          500,
        );
    } catch (Error) {
      setMensajeError(ObtenerMensajeError(Error));
    } finally {
      setOcupado(false);
    }
  }

  // Limpia el formulario para iniciar otro trámite.
  function Reiniciar() {
    setPasoActual(0);
    setRuc("");
    setCorreo("");
    setDatosNegocio(null);
    setTipo("NUEVA");
    setOpcionRenovacion("");
    setSolicitud(null);
    setArchivo(null);
    setPago(null);
    setMensajeError("");
    setMensajeExito("");
  }

  // Muestra un flujo guiado sin ocultar el paso actual.
  return (
    <>
      {Origen === "CIUDADANO" ? (
        <TituloPagina
          Titulo="Trámite de licencia"
          Descripcion="Complete cada paso en orden. Los datos tributarios serán obtenidos automáticamente y no podrán editarse."
        />
      ) : null}

      <Pasos PasosDisponibles={PasosTramite} PasoActual={PasoActual} />
      <div className="mt-5 space-y-4">
        <Mensaje Tipo="error">{MensajeError}</Mensaje>
        <Mensaje Tipo="exito">{MensajeExito}</Mensaje>
      </div>

      {PasoActual === 0 && (
        <Panel
          className="mt-5"
          Titulo="Validar negocio"
          Descripcion="Ingrese el RUC registrado para el establecimiento."
        >
          <form onSubmit={ValidarRuc} className="max-w-xl space-y-5">
            <CampoFormulario
              Etiqueta="Número de RUC"
              value={Ruc}
              onChange={(Evento) => setRuc(LimpiarRuc(Evento.target.value))}
              inputMode="numeric"
              maxLength={11}
              Obligatorio
              Ayuda={`RUC de demostración: ${ConfiguracionAplicacion.RucDemostracion}`}
            />
            <Boton Tipo="submit" Ocupado={Ocupado}>
              Consultar RUC
            </Boton>
          </form>
        </Panel>
      )}

      {PasoActual === 1 && DatosNegocio && (
        <Panel
          className="mt-5"
          Titulo={EsRenovacion ? "Renovación de licencia" : "Nueva solicitud"}
        >
          <div className="mb-6 grid gap-3 border-l-4 border-[#174a7e] bg-[#f4f7fa] p-4 md:grid-cols-2">
            <p>
              <strong>Razón social:</strong> {DatosNegocio.RazonSocial}
            </p>
            <p>
              <strong>RUC:</strong> {DatosNegocio.Ruc}
            </p>
            <p>
              <strong>Domicilio fiscal:</strong> {DatosNegocio.DomicilioFiscal}
            </p>
            <p>
              <strong>Ubigeo:</strong> {DatosNegocio.Ubigeo}
            </p>
          </div>

          {EsRenovacion && (
            <div className="mb-6 border border-[#cbd2dc] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#17365d]">
                    Licencia actual: {DatosNegocio.Licencia.NumeroLicencia}
                  </h3>
                  <p className="text-[#536174]">
                    Vigencia hasta:{" "}
                    {String(DatosNegocio.Licencia.FechaVencimiento).slice(
                      0,
                      10,
                    )}
                  </p>
                </div>
                <Estado Valor={DatosNegocio.Licencia.Estado} />
              </div>
            </div>
          )}

          {SoloRenovacionDirecta && EsRenovacion ? (
            <div className="mb-5 border-l-4 border-[#174a7e] bg-[#f4f7fa] p-4">
              La atención presencial procesará únicamente el pago de renovación,
              sin solicitar un plano nuevo ni programar otra inspección.
            </div>
          ) : null}

          <form onSubmit={RegistrarSolicitud} className="max-w-2xl space-y-5">
            <CampoFormulario
              Etiqueta="Correo electrónico"
              type="email"
              value={Correo}
              onChange={(Evento) =>
                setCorreo(Evento.target.value.slice(0, 160))
              }
              Obligatorio
              Ayuda="Se utilizará para informar la fecha de inspección y cualquier reprogramación."
            />

            {EsRenovacion && !SoloRenovacionDirecta && (
              <SelectorFormulario
                Etiqueta="Modalidad de renovación"
                value={OpcionRenovacion}
                onChange={(Evento) => setOpcionRenovacion(Evento.target.value)}
                Obligatorio
                Opciones={[
                  {
                    Valor: "PAGO_DIRECTO",
                    Etiqueta: "Pago directo sin nueva inspección",
                  },
                  {
                    Valor: "NUEVA_INSPECCION",
                    Etiqueta: "Renovar con plano nuevo e inspección",
                  },
                ]}
              />
            )}

            <div className="flex flex-wrap gap-3">
              <Boton Tipo="submit" Ocupado={Ocupado}>
                Crear solicitud
              </Boton>
              <Boton Variante="neutro" onClick={Reiniciar}>
                Cambiar RUC
              </Boton>
            </div>
          </form>
        </Panel>
      )}

      {PasoActual === 2 && Solicitud && (
        <Panel
          className="mt-5"
          Titulo="Subir plano del local"
          Descripcion={
            Origen === "CAJERA"
              ? "Puede seleccionar PDF, JPG o PNG."
              : "El ciudadano debe presentar el plano exclusivamente en PDF."
          }
        >
          <form onSubmit={GuardarPlano} className="max-w-2xl space-y-5">
            <CampoFormulario
              Etiqueta="Archivo del plano"
              Tipo="file"
              accept={
                Origen === "CAJERA"
                  ? ".pdf,.jpg,.jpeg,.png"
                  : ".pdf,application/pdf"
              }
              onChange={(Evento) =>
                setArchivo(Evento.target.files?.[0] || null)
              }
              Obligatorio
              Ayuda="El tamaño máximo se controla desde la configuración del administrador."
            />
            <Boton Tipo="submit" Ocupado={Ocupado}>
              Guardar plano
            </Boton>
          </form>
        </Panel>
      )}

      {PasoActual === 3 && Solicitud && (
        <Panel
          className="mt-5"
          Titulo="Pago del trámite"
          Descripcion={`Importe oficial: S/ ${ConfiguracionAplicacion.MontoOficial.toFixed(2)}`}
        >
          <form onSubmit={PrepararPago} className="max-w-2xl space-y-5">
            <SelectorFormulario
              Etiqueta="Medio de pago"
              value={MedioPago}
              onChange={(Evento) => setMedioPago(Evento.target.value)}
              Opciones={
                Origen === "CAJERA"
                  ? [
                      { Valor: "EFECTIVO", Etiqueta: "Efectivo" },
                      { Valor: "YAPE", Etiqueta: "Yape" },
                      { Valor: "PLIN", Etiqueta: "Plin" },
                    ]
                  : [
                      {
                        Valor: "TARJETA",
                        Etiqueta: "Tarjeta mediante Checkout",
                      },
                      { Valor: "YAPE", Etiqueta: "Yape / QR dinámico" },
                      { Valor: "PLIN", Etiqueta: "Plin / QR dinámico" },
                      { Valor: "CIP", Etiqueta: "CIP para pago en agencia" },
                    ]
              }
              Obligatorio
            />

            {["YAPE", "PLIN"].includes(MedioPago) && Origen === "CAJERA" ? (
              <CampoFormulario
                Etiqueta="Número de operación"
                value={Referencia}
                onChange={(Evento) =>
                  setReferencia(
                    Evento.target.value
                      .replace(/[^A-Za-z0-9-]/g, "")
                      .slice(0, 100),
                  )
                }
                Obligatorio
              />
            ) : null}

            <div className="border-l-4 border-[#d99000] bg-[#fff8e6] p-4 text-[#744900]">
              La interfaz muestra S/ 180.00. En modo demostración, la pasarela
              puede cobrar el importe mínimo configurado.
            </div>

            {!Pago ? (
              <Boton Tipo="submit" Ocupado={Ocupado}>
                Preparar pago
              </Boton>
            ) : null}
          </form>

          {Pago && (
            <div className="mt-6 border-t border-[#d7dde5] pt-5">
              <p>
                <strong>Pago registrado:</strong> {Pago.Pago.id}
              </p>
              <p>
                <strong>Código de inspección:</strong>{" "}
                {Solicitud.codigo_inspeccion}
              </p>
              <p>
                <strong>Código de pago:</strong> {Solicitud.codigo_pago}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {Origen === "CAJERA" || Pago.Preferencia?.Modo === "DEMOSTRACION" ? (
                  <Boton onClick={ConfirmarPago} Ocupado={Ocupado}>
                    {Origen === "CAJERA"
                      ? "Confirmar cobro presencial"
                      : "Confirmar pago de demostración"}
                  </Boton>
                ) : null}
                <Boton
                  Variante="secundario"
                  onClick={() =>
                    Navegar(
                      `/seguimiento?Codigo=${Solicitud.codigo_inspeccion}`,
                    )
                  }
                >
                  Ir al seguimiento
                </Boton>
              </div>
            </div>
          )}
        </Panel>
      )}
    </>
  );
}