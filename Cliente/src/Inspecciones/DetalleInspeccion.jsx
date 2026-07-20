// Muestra el detalle de una inspección en modo editable o lectura.

import AreaTexto from "../Componentes/AreaTexto.jsx";
import Boton from "../Componentes/Boton.jsx";
import Estado from "../Componentes/Estado.jsx";
import Panel from "../Componentes/Panel.jsx";
import { ObtenerPlano } from "../Servicios/ServicioSolicitudes.js";

// Adapta los controles según el modo de lectura o edición.
export default function DetalleInspeccion({
  Inspeccion,
  SoloLectura = false,
  Observaciones = "",
  AlCambiarObservaciones,
  AlAprobar,
  AlObservar,
  AlCerrar,
  AlInformarError,
  Ocupado = false,
}) {
  if (!Inspeccion) return null;

  async function AbrirPlano() {
    try {
      const Datos = await ObtenerPlano(Inspeccion.solicitud_id);
      window.open(Datos.Url, "_blank", "noopener,noreferrer");
    } catch (Error) {
      AlInformarError?.(Error.message);
    }
  }

  return (
    <Panel
      className="mt-5"
      Titulo={`Detalle de la visita ${Inspeccion.numero_visita}${
        SoloLectura ? " en modo solo lectura" : ""
      }`}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <p>
          <strong>Razón social:</strong> {Inspeccion.razon_social}
        </p>
        <p>
          <strong>RUC:</strong> {Inspeccion.ruc}
        </p>
        <p className="md:col-span-2">
          <strong>Domicilio fiscal:</strong> {Inspeccion.domicilio_fiscal}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          {Inspeccion.fecha_programada
            ? String(Inspeccion.fecha_programada).slice(0, 10)
            : "Sin asignar"}
        </p>
        <p>
          <strong>Hora:</strong> {Inspeccion.hora_programada || "Sin asignar"}
        </p>
        <p>
          <strong>Estado:</strong> <Estado Valor={Inspeccion.estado} />
        </p>
        <p>
          <strong>Número de visita:</strong> {Inspeccion.numero_visita}
        </p>
      </div>

      {Number(Inspeccion.numero_visita) === 2 ? (
        <div className="mt-5 border-l-4 border-[#d99000] bg-[#fff8e6] p-4">
          <strong>Observaciones de la primera visita:</strong>
          <p className="mt-2 whitespace-pre-wrap">
            {Inspeccion.observaciones_anteriores ||
              "No se encontraron observaciones anteriores."}
          </p>
        </div>
      ) : null}

      {SoloLectura && Inspeccion.observaciones ? (
        <div className="mt-5 border-l-4 border-[#a62b2b] bg-[#fff4f4] p-4">
          <strong>Observaciones registradas:</strong>
          <p className="mt-2 whitespace-pre-wrap">
            {Inspeccion.observaciones}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Boton Variante="secundario" onClick={AbrirPlano} Ocupado={Ocupado}>
          Abrir plano del local
        </Boton>
        {SoloLectura ? (
          <Boton Variante="neutro" onClick={AlCerrar}>
            Cerrar detalle
          </Boton>
        ) : null}
      </div>

      {!SoloLectura ? (
        <div className="mt-6 max-w-3xl space-y-4 border-t border-[#d7dde5] pt-5">
          <AreaTexto
            Etiqueta="Observaciones encontradas"
            value={Observaciones}
            onChange={(Evento) =>
              AlCambiarObservaciones?.(Evento.target.value.slice(0, 2000))
            }
            maxLength={2000}
            Ayuda="Este campo es obligatorio cuando la inspección se marca con observaciones."
          />
          <div className="flex flex-wrap gap-3">
            <Boton onClick={AlAprobar} Ocupado={Ocupado}>
              Aprobar inspección
            </Boton>
            <Boton
              Variante="advertencia"
              onClick={AlObservar}
              Ocupado={Ocupado}
            >
              Registrar observaciones
            </Boton>
            <Boton Variante="neutro" onClick={AlCerrar}>
              Cerrar detalle
            </Boton>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}