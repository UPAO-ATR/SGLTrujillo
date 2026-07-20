// Presenta la atención presencial y el control diario de caja.

import { useEffect, useState } from "react";
import Boton from "../Componentes/Boton.jsx";
import CampoFormulario from "../Componentes/CampoFormulario.jsx";
import Estado from "../Componentes/Estado.jsx";
import Mensaje from "../Componentes/Mensaje.jsx";
import Panel from "../Componentes/Panel.jsx";
import SelectorFormulario from "../Componentes/SelectorFormulario.jsx";
import Tabla from "../Componentes/Tabla.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";
import PaginaNegocio from "./PaginaNegocio.jsx";
import {
  AbrirCaja,
  CerrarCaja,
  ObtenerCajaActual,
  RealizarArqueo,
  RegistrarSangria,
} from "../Servicios/ServicioCaja.js";

export default function PaginaCajera() {
  // Mantiene el estado de la caja y sus formularios.
  const [Seccion, setSeccion] = useState("SOLICITUD");
  const [Caja, setCaja] = useState(null);
  const [FiltroMedio, setFiltroMedio] = useState("");
  const [MontoSangria, setMontoSangria] = useState(3000);
  const [EfectivoFisico, setEfectivoFisico] = useState("");
  const [MensajeError, setMensajeError] = useState("");
  const [MensajeExito, setMensajeExito] = useState("");
  const [Ocupado, setOcupado] = useState(false);

  // Actualiza totales e historial según el filtro elegido.
  async function CargarCaja(MedioPago = FiltroMedio) {
    try {
      setOcupado(true);
      setCaja(await ObtenerCajaActual(MedioPago));
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  useEffect(() => {
    CargarCaja();
    // La caja se consulta al ingresar al panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unifica el control de errores de las operaciones de caja.
  async function Ejecutar(Operacion, Mensaje) {
    try {
      setOcupado(true);
      setMensajeError("");
      await Operacion();
      setMensajeExito(Mensaje);
      await CargarCaja();
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  const EfectivoEsperado = Caja?.EfectivoEnRegistradora;
  const Bloqueada = Caja?.RequiereSangria;

  // Bloquea los cobros cuando la caja exige una sangría.
  return (
    <>
      <TituloPagina
        Titulo="Atención presencial"
        Descripcion="Registre solicitudes, cobros, sangrías y el cierre diario de caja."
      />
      <div className="mb-5 flex flex-wrap gap-2 border-b border-[#cbd2dc] pb-3">
        {[
          ["SOLICITUD", "Nueva solicitud"],
          ["RENOVACION", "Renovación"],
          ["CAJA", "Caja diaria"],
          ["HISTORIAL", "Historial"],
        ].map(([Valor, Etiqueta]) => (
          <Boton
            key={Valor}
            Variante={Seccion === Valor ? "principal" : "neutro"}
            onClick={() => setSeccion(Valor)}
          >
            {Etiqueta}
          </Boton>
        ))}
      </div>

      <div className="space-y-4">
        <Mensaje Tipo="error">{MensajeError}</Mensaje>
        <Mensaje Tipo="exito">{MensajeExito}</Mensaje>
      </div>

      {["SOLICITUD", "RENOVACION"].includes(Seccion) && !Caja ? (
        <Panel
          className="mt-5"
          Titulo="Debe abrir la caja"
          Descripcion="La atención presencial requiere una caja abierta para registrar el cobro del trámite."
        >
          <Boton onClick={() => setSeccion("CAJA")}>Ir a caja diaria</Boton>
        </Panel>
      ) : null}

      {Seccion === "SOLICITUD" && Caja ? (
        <div className="mt-5">
          <PaginaNegocio
            Origen="CAJERA"
            AlCompletar={(Codigo) => {
              setMensajeExito(
                `Trámite presencial completado. Código: ${Codigo}`,
              );
              CargarCaja();
            }}
          />
        </div>
      ) : null}

      {Seccion === "RENOVACION" && Caja ? (
        <div className="mt-5">
          <PaginaNegocio
            Origen="CAJERA"
            SoloRenovacionDirecta
            AlCompletar={(Codigo) => {
              setMensajeExito(
                `Renovación presencial completada. Código: ${Codigo}`,
              );
              CargarCaja();
            }}
          />
        </div>
      ) : null}

      {Seccion === "CAJA" && !Caja && (
        <Panel
          className="mt-5"
          Titulo="Abrir caja"
          Descripcion="Cada jornada inicia con un fondo fijo de S/ 1,000.00."
        >
          <Boton
            onClick={() =>
              Ejecutar(
                () => AbrirCaja(1000),
                "La caja fue abierta correctamente.",
              )
            }
            Ocupado={Ocupado}
          >
            Abrir caja con S/ 1,000.00
          </Boton>
        </Panel>
      )}

      {Seccion === "CAJA" && Caja && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel Titulo="Estado de caja">
            <div className="space-y-3">
              <p>
                <strong>Fecha:</strong> {String(Caja.fecha || "").slice(0, 10)}
              </p>
              <p>
                <strong>Fondo inicial:</strong> S/{" "}
                {Number(Caja.fondo_inicial || 0).toFixed(2)}
              </p>
              <p>
                <strong>Ventas en efectivo:</strong> S/{" "}
                {Number(Caja.Totales?.efectivo || 0).toFixed(2)}
              </p>
              <p>
                <strong>Sangrías:</strong> S/{" "}
                {Number(Caja.Totales?.sangrias || 0).toFixed(2)}
              </p>
              <p>
                <strong>Efectivo esperado:</strong> S/{" "}
                {Number(EfectivoEsperado || 0).toFixed(2)}
              </p>
              <p>
                <strong>Estado:</strong> <Estado Valor={Caja.estado} />
              </p>
            </div>
            {Bloqueada ? (
              <div className="mt-5">
                <Mensaje Tipo="advertencia">
                  La pantalla de ventas está bloqueada. Registre una sangría
                  para continuar con pagos en efectivo.
                </Mensaje>
              </div>
            ) : null}
          </Panel>

          <Panel
            Titulo="Registrar sangría"
            Descripcion="El retiro reduce el efectivo físico, pero no modifica las ventas registradas."
          >
            <div className="space-y-4">
              <CampoFormulario
                Etiqueta="Monto a retirar"
                Tipo="number"
                min="0.01"
                step="0.01"
                value={MontoSangria}
                onChange={(Evento) => setMontoSangria(Evento.target.value)}
              />
              <Boton
                Variante="advertencia"
                onClick={() =>
                  Ejecutar(
                    () =>
                      RegistrarSangria(
                        Number(MontoSangria),
                        "Retiro preventivo de efectivo",
                      ),
                    "La sangría fue registrada.",
                  )
                }
                Ocupado={Ocupado}
              >
                Registrar sangría
              </Boton>
            </div>
          </Panel>

          <Panel Titulo="Arqueo y cierre">
            <div className="space-y-4">
              <CampoFormulario
                Etiqueta="Efectivo físico contado"
                Tipo="number"
                min="0"
                step="0.01"
                value={EfectivoFisico}
                onChange={(Evento) => setEfectivoFisico(Evento.target.value)}
                Obligatorio
              />
              <div className="flex flex-wrap gap-3">
                <Boton
                  Variante="secundario"
                  onClick={() =>
                    Ejecutar(
                      () => RealizarArqueo(Number(EfectivoFisico)),
                      "El arqueo fue calculado.",
                    )
                  }
                  Ocupado={Ocupado}
                >
                  Realizar arqueo
                </Boton>
                <Boton
                  Variante="peligro"
                  onClick={() =>
                    Ejecutar(
                      () => CerrarCaja(Number(EfectivoFisico)),
                      "La caja fue cerrada correctamente.",
                    )
                  }
                  Ocupado={Ocupado}
                >
                  Cerrar caja
                </Boton>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {Seccion === "HISTORIAL" && (
        <Panel className="mt-5" Titulo="Movimientos del día">
          <div className="mb-5 max-w-sm">
            <SelectorFormulario
              Etiqueta="Filtrar por medio de pago"
              value={FiltroMedio}
              onChange={(Evento) => {
                setFiltroMedio(Evento.target.value);
                CargarCaja(Evento.target.value);
              }}
              Opciones={[
                { Valor: "", Etiqueta: "Todos" },
                { Valor: "EFECTIVO", Etiqueta: "Efectivo" },
                { Valor: "YAPE", Etiqueta: "Yape" },
                { Valor: "PLIN", Etiqueta: "Plin" },
              ]}
            />
          </div>
          {Caja ? (
            <p className="mb-5 border-l-4 border-[#174a7e] bg-[#f4f7fa] p-4">
              Efectivo: S/ {Number(Caja.Totales?.efectivo || 0).toFixed(2)} ·
              Yape: S/ {Number(Caja.Totales?.yape || 0).toFixed(2)} · Plin: S/{" "}
              {Number(Caja.Totales?.plin || 0).toFixed(2)}
            </p>
          ) : null}
          <Tabla
            Filas={Caja?.Transacciones || []}
            MensajeVacio="No existen movimientos para el filtro seleccionado."
            Columnas={[
              {
                Clave: "fecha_hora",
                Titulo: "Fecha y hora",
                Renderizar: (Fila) =>
                  String(Fila.fecha_hora || "")
                    .replace("T", " ")
                    .slice(0, 19),
              },
              { Clave: "medio_pago", Titulo: "Medio" },
              {
                Clave: "monto",
                Titulo: "Monto",
                Renderizar: (Fila) => `S/ ${Number(Fila.monto).toFixed(2)}`,
              },
              {
                Clave: "referencia",
                Titulo: "Referencia",
                Renderizar: (Fila) => Fila.referencia || "—",
              },
            ]}
          />
        </Panel>
      )}
    </>
  );
}