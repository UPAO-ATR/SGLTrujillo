// Presenta las inspecciones pendientes del día.

import { useEffect, useState } from "react";
import Boton from "../Componentes/Boton.jsx";
import Estado from "../Componentes/Estado.jsx";
import Mensaje from "../Componentes/Mensaje.jsx";
import Panel from "../Componentes/Panel.jsx";
import Tabla from "../Componentes/Tabla.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";
import {
  ListarInspecciones,
  ObtenerInspeccion,
  RegistrarResultadoInspeccion,
} from "../Servicios/ServicioInspecciones.js";
import DetalleInspeccion from "../Inspecciones/DetalleInspeccion.jsx";

export default function PaginaInspector() {
  const [Inspecciones, setInspecciones] = useState([]);
  const [Seleccionada, setSeleccionada] = useState(null);
  const [Observaciones, setObservaciones] = useState("");
  const [MensajeError, setMensajeError] = useState("");
  const [MensajeExito, setMensajeExito] = useState("");
  const [Cargando, setCargando] = useState(true);
  const [Ocupado, setOcupado] = useState(false);

  // Carga únicamente las inspecciones pendientes del día.
  async function CargarInspecciones() {
    try {
      setCargando(true);
      setMensajeError("");
      setInspecciones(await ListarInspecciones());
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    CargarInspecciones();
  }, []);

  async function VerDetalle(Inspeccion) {
    try {
      setOcupado(true);
      setMensajeError("");
      setSeleccionada(await ObtenerInspeccion(Inspeccion.id));
      setObservaciones("");
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  // Envía la aprobación o las observaciones registradas.
  async function Registrar(Resultado) {
    if (Resultado === "OBSERVADO" && !Observaciones.trim()) {
      setMensajeError("Debe escribir al menos una observación.");
      return;
    }

    try {
      setOcupado(true);
      setMensajeError("");
      await RegistrarResultadoInspeccion(
        Seleccionada.id,
        Resultado,
        Observaciones.trim(),
      );
      setMensajeExito(
        Resultado === "APROBADO"
          ? "La inspección fue aprobada y la licencia se generó."
          : "Las observaciones fueron registradas.",
      );
      setSeleccionada(null);
      await CargarInspecciones();
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  // Retira de la lista cada inspección ya resuelta.
  return (
    <>
      <TituloPagina
        Titulo="Inspecciones del día"
        Descripcion="Solo se muestran las inspecciones pendientes asignadas para la fecha actual. Al registrar el resultado, la inspección desaparecerá de la lista."
      />
      <div className="space-y-4">
        <Mensaje Tipo="error">{MensajeError}</Mensaje>
        <Mensaje Tipo="exito">{MensajeExito}</Mensaje>
      </div>

      <Panel className="mt-5" Titulo="Agenda de trabajo">
        {Cargando ? (
          <p className="py-6 text-center text-[#536174]">
            Cargando inspecciones...
          </p>
        ) : (
          <Tabla
            Filas={Inspecciones}
            MensajeVacio="No hay inspecciones pendientes para hoy."
            Columnas={[
              { Clave: "orden_dia", Titulo: "Orden" },
              { Clave: "hora_programada", Titulo: "Hora" },
              { Clave: "razon_social", Titulo: "Negocio" },
              { Clave: "ruc", Titulo: "RUC" },
              { Clave: "numero_visita", Titulo: "Visita" },
              {
                Clave: "estado",
                Titulo: "Estado",
                Renderizar: (Fila) => <Estado Valor={Fila.estado} />,
              },
              {
                Clave: "acciones",
                Titulo: "Acciones",
                Renderizar: (Fila) => (
                  <Boton
                    Variante="secundario"
                    onClick={() => VerDetalle(Fila)}
                    Ocupado={Ocupado}
                  >
                    Ver detalle
                  </Boton>
                ),
              },
            ]}
          />
        )}
      </Panel>

      <DetalleInspeccion
        Inspeccion={Seleccionada}
        Observaciones={Observaciones}
        AlCambiarObservaciones={setObservaciones}
        AlAprobar={() => Registrar("APROBADO")}
        AlObservar={() => Registrar("OBSERVADO")}
        AlCerrar={() => setSeleccionada(null)}
        AlInformarError={setMensajeError}
        Ocupado={Ocupado}
      />
    </>
  );
}