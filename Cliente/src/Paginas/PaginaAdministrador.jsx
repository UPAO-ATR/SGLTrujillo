// Presenta las funciones de supervisión y configuración del administrador.

import { useEffect, useState } from "react";
import Boton from "../Componentes/Boton.jsx";
import CampoFormulario from "../Componentes/CampoFormulario.jsx";
import Estado from "../Componentes/Estado.jsx";
import Mensaje from "../Componentes/Mensaje.jsx";
import Panel from "../Componentes/Panel.jsx";
import SelectorFormulario from "../Componentes/SelectorFormulario.jsx";
import Tabla from "../Componentes/Tabla.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";
import DetalleInspeccion from "../Inspecciones/DetalleInspeccion.jsx";
import {
  CambiarHabilitacion,
  ConsultarDni,
  CrearTrabajador,
  GuardarConfiguracion,
  GuardarFeriado,
  ListarAlertas,
  ListarAuditoria,
  ListarCajeras,
  ListarConfiguraciones,
  ListarFeriados,
  ListarInspectores,
  MarcarAlertaAtendida,
} from "../Servicios/ServicioAdministracion.js";
import {
  ListarInspecciones,
  ObtenerInspeccion,
  PrepararInspeccionDemostracion,
  ReprogramarInspecciones,
} from "../Servicios/ServicioInspecciones.js";

const Secciones = [
  ["INSPECCIONES", "Inspecciones"],
  ["TRABAJADORES", "Trabajadores"],
  ["CONFIGURACION", "Configuración"],
  ["FERIADOS", "Feriados"],
  ["AUDITORIA", "Auditoría"],
];

export default function PaginaAdministrador() {
  // Mantiene la información de cada sección administrativa.
  const [Seccion, setSeccion] = useState("INSPECCIONES");
  const [Inspecciones, setInspecciones] = useState([]);
  const [Detalle, setDetalle] = useState(null);
  const [Inspectores, setInspectores] = useState([]);
  const [Cajeras, setCajeras] = useState([]);
  const [Configuraciones, setConfiguraciones] = useState([]);
  const [Feriados, setFeriados] = useState([]);
  const [Auditoria, setAuditoria] = useState([]);
  const [Alertas, setAlertas] = useState([]);
  const [DatosDni, setDatosDni] = useState(null);
  const [Filtros, setFiltros] = useState({
    FechaDesde: "",
    FechaHasta: "",
    Estado: "",
    NombreNegocio: "",
  });
  const [NuevoTrabajador, setNuevoTrabajador] = useState({
    Dni: "",
    Rol: "CAJERA",
  });
  const [NuevoFeriado, setNuevoFeriado] = useState({
    Fecha: "",
    Descripcion: "",
    Activo: true,
  });
  const [FechaReprogramacion, setFechaReprogramacion] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [MensajeError, setMensajeError] = useState("");
  const [MensajeExito, setMensajeExito] = useState("");
  const [Ocupado, setOcupado] = useState(false);

  // Unifica mensajes, carga y actualización de datos.
  async function Ejecutar(Operacion, Mensaje, Recargar) {
    try {
      setOcupado(true);
      setMensajeError("");
      setMensajeExito("");
      await Operacion();
      if (Mensaje) setMensajeExito(Mensaje);
      if (Recargar) await Recargar();
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  // Aplica los filtros antes de solicitar las inspecciones.
  async function CargarInspecciones() {
    const [DatosInspecciones, DatosAlertas] = await Promise.all([
      ListarInspecciones(Filtros),
      ListarAlertas(),
    ]);
    setInspecciones(DatosInspecciones);
    setAlertas(DatosAlertas);
  }

  async function CargarTrabajadores() {
    const [DatosInspectores, DatosCajeras] = await Promise.all([
      ListarInspectores(),
      ListarCajeras(),
    ]);
    setInspectores(DatosInspectores);
    setCajeras(DatosCajeras);
  }

  async function CargarConfiguracion() {
    setConfiguraciones(await ListarConfiguraciones());
  }

  async function CargarFeriados() {
    setFeriados(await ListarFeriados());
  }

  async function CargarAuditoria() {
    setAuditoria(await ListarAuditoria());
  }

  useEffect(() => {
    Ejecutar(CargarInspecciones, "");
    // La carga inicial se ejecuta una sola vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const Cargas = {
      INSPECCIONES: CargarInspecciones,
      TRABAJADORES: CargarTrabajadores,
      CONFIGURACION: CargarConfiguracion,
      FERIADOS: CargarFeriados,
      AUDITORIA: CargarAuditoria,
    };
    Ejecutar(Cargas[Seccion], "");
    // La sección seleccionada determina la información necesaria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Seccion]);

  // Abre la inspección en modo de solo lectura.
  async function VerDetalle(Fila) {
    await Ejecutar(
      async () => setDetalle(await ObtenerInspeccion(Fila.id)),
      "",
    );
  }

  function ActualizarFiltro(Clave, Valor) {
    setFiltros((Actual) => ({ ...Actual, [Clave]: Valor }));
  }

  // Muestra únicamente acciones permitidas al administrador.
  return (
    <>
      <TituloPagina
        Titulo="Panel de administración"
        Descripcion="Supervise las inspecciones y gestione trabajadores, horarios, capacidad y feriados. El administrador no puede aprobar ni rechazar inspecciones."
      />
      <div className="mb-5 flex flex-wrap gap-2 border-b border-[#cbd2dc] pb-3">
        {Secciones.map(([Valor, Etiqueta]) => (
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

      {Seccion === "INSPECCIONES" && (
        <div className="mt-5 space-y-5">
          {Alertas.length > 0 ? (
            <Panel
              Titulo="Alertas de caja"
              Descripcion="Se muestran los descuadres pendientes reportados por las cajeras."
            >
              <div className="space-y-3">
                {Alertas.map((Alerta) => (
                  <div
                    key={Alerta.id}
                    className="border-l-4 border-[#a62b2b] bg-[#fff4f4] p-4"
                  >
                    <p className="font-semibold text-[#812121]">
                      {Alerta.mensaje}
                    </p>
                    <p className="mt-1 text-sm text-[#536174]">
                      {String(Alerta.fecha_creacion || "")
                        .replace("T", " ")
                        .slice(0, 19)}
                    </p>
                    <div className="mt-3">
                      <Boton
                        Variante="secundario"
                        onClick={() =>
                          Ejecutar(
                            () => MarcarAlertaAtendida(Alerta.id),
                            "La alerta fue marcada como atendida.",
                            CargarInspecciones,
                          )
                        }
                      >
                        Marcar como atendida
                      </Boton>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
          <Panel
            Titulo="Preparar exposición"
            Descripcion="Mueve una inspección pendiente al día de hoy. Esta herramienta solo funciona cuando el sistema está en modo de demostración."
          >
            <div className="flex flex-wrap gap-3">
              <Boton
                Variante="secundario"
                onClick={() =>
                  Ejecutar(
                    () => PrepararInspeccionDemostracion(1),
                    "La primera inspección fue preparada para hoy.",
                    CargarInspecciones,
                  )
                }
                Ocupado={Ocupado}
              >
                Preparar primera visita
              </Boton>
              <Boton
                Variante="secundario"
                onClick={() =>
                  Ejecutar(
                    () => PrepararInspeccionDemostracion(2),
                    "La segunda inspección fue preparada para hoy.",
                    CargarInspecciones,
                  )
                }
                Ocupado={Ocupado}
              >
                Preparar segunda visita
              </Boton>
            </div>
          </Panel>
          <Panel Titulo="Filtros de inspección">
            <form
              onSubmit={(Evento) => {
                Evento.preventDefault();
                Ejecutar(CargarInspecciones, "");
              }}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <CampoFormulario
                Etiqueta="Fecha desde"
                Tipo="date"
                value={Filtros.FechaDesde}
                onChange={(Evento) =>
                  ActualizarFiltro("FechaDesde", Evento.target.value)
                }
              />
              <CampoFormulario
                Etiqueta="Fecha hasta"
                Tipo="date"
                value={Filtros.FechaHasta}
                onChange={(Evento) =>
                  ActualizarFiltro("FechaHasta", Evento.target.value)
                }
              />
              <SelectorFormulario
                Etiqueta="Estado"
                value={Filtros.Estado}
                onChange={(Evento) =>
                  ActualizarFiltro("Estado", Evento.target.value)
                }
                Opciones={[
                  { Valor: "", Etiqueta: "Todos" },
                  { Valor: "PENDIENTE", Etiqueta: "Pendientes" },
                  { Valor: "REALIZADA", Etiqueta: "Realizadas" },
                  { Valor: "FALLIDA", Etiqueta: "Con observaciones" },
                  { Valor: "PENDIENTE_ESPERA", Etiqueta: "En espera" },
                ]}
              />
              <CampoFormulario
                Etiqueta="Nombre del negocio"
                value={Filtros.NombreNegocio}
                onChange={(Evento) =>
                  ActualizarFiltro(
                    "NombreNegocio",
                    Evento.target.value.slice(0, 160),
                  )
                }
              />
              <div className="md:col-span-2 lg:col-span-4">
                <Boton Tipo="submit" Ocupado={Ocupado}>
                  Aplicar filtros
                </Boton>
              </div>
            </form>
          </Panel>
          <Panel Titulo="Inspecciones registradas">
            <Tabla
              Filas={Inspecciones}
              Columnas={[
                {
                  Clave: "fecha_programada",
                  Titulo: "Fecha",
                  Renderizar: (Fila) =>
                    Fila.fecha_programada
                      ? String(Fila.fecha_programada).slice(0, 10)
                      : "Sin asignar",
                },
                { Clave: "hora_programada", Titulo: "Hora" },
                { Clave: "razon_social", Titulo: "Negocio" },
                { Clave: "numero_visita", Titulo: "Visita" },
                {
                  Clave: "estado",
                  Titulo: "Estado",
                  Renderizar: (Fila) => <Estado Valor={Fila.estado} />,
                },
                {
                  Clave: "acciones",
                  Titulo: "Detalle",
                  Renderizar: (Fila) => (
                    <Boton
                      Variante="secundario"
                      onClick={() => VerDetalle(Fila)}
                    >
                      Ver detalles
                    </Boton>
                  ),
                },
              ]}
            />
          </Panel>
          <Panel
            Titulo="Ejecutar reprogramación de cierre"
            Descripcion="Mueve las inspecciones pendientes al siguiente día hábil y aplica el corrimiento en cascada."
          >
            <div className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <CampoFormulario
                  Etiqueta="Fecha a cerrar"
                  Tipo="date"
                  value={FechaReprogramacion}
                  onChange={(Evento) =>
                    setFechaReprogramacion(Evento.target.value)
                  }
                />
              </div>
              <Boton
                Variante="advertencia"
                onClick={() =>
                  Ejecutar(
                    () => ReprogramarInspecciones(FechaReprogramacion),
                    "La reprogramación fue ejecutada.",
                    CargarInspecciones,
                  )
                }
                Ocupado={Ocupado}
              >
                Reprogramar pendientes
              </Boton>
            </div>
          </Panel>
          <DetalleInspeccion
            Inspeccion={Detalle}
            SoloLectura
            AlCerrar={() => setDetalle(null)}
            AlInformarError={setMensajeError}
            Ocupado={Ocupado}
          />
        </div>
      )}

      {Seccion === "TRABAJADORES" && (
        <div className="mt-5 space-y-5">
          <Panel
            Titulo="Crear trabajador"
            Descripcion="Para reemplazar al inspector, primero deshabilite al inspector actual."
          >
            <form
              onSubmit={(Evento) => {
                Evento.preventDefault();
                Ejecutar(
                  async () => {
                    const Resultado = await CrearTrabajador(
                      NuevoTrabajador.Dni,
                      NuevoTrabajador.Rol,
                    );
                    setMensajeExito(
                      `Trabajador creado: ${Resultado.Trabajador.correo_institucional}. Contraseña temporal: ${Resultado.ContrasenaTemporal}`,
                    );
                    setNuevoTrabajador({ Dni: "", Rol: "CAJERA" });
                    setDatosDni(null);
                  },
                  "",
                  CargarTrabajadores,
                );
              }}
              className="grid max-w-2xl gap-4 md:grid-cols-2"
            >
              <CampoFormulario
                Etiqueta="DNI"
                value={NuevoTrabajador.Dni}
                onChange={(Evento) => {
                  setNuevoTrabajador((Actual) => ({
                    ...Actual,
                    Dni: Evento.target.value.replace(/\D/g, "").slice(0, 8),
                  }));
                  setDatosDni(null);
                }}
                maxLength={8}
                Obligatorio
              />
              <SelectorFormulario
                Etiqueta="Rol"
                value={NuevoTrabajador.Rol}
                onChange={(Evento) =>
                  setNuevoTrabajador((Actual) => ({
                    ...Actual,
                    Rol: Evento.target.value,
                  }))
                }
                Opciones={[
                  { Valor: "CAJERA", Etiqueta: "Cajera" },
                  { Valor: "INSPECTOR", Etiqueta: "Inspector" },
                ]}
              />
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Boton
                  Variante="secundario"
                  onClick={() =>
                    Ejecutar(
                      async () =>
                        setDatosDni(await ConsultarDni(NuevoTrabajador.Dni)),
                      "El DNI fue validado y los nombres se completaron automáticamente.",
                    )
                  }
                  Ocupado={Ocupado}
                >
                  Consultar DNI
                </Boton>
                <Boton Tipo="submit" Ocupado={Ocupado} disabled={!DatosDni}>
                  Crear trabajador
                </Boton>
              </div>
              {DatosDni ? (
                <div className="md:col-span-2 border-l-4 border-[#174a7e] bg-[#f4f7fa] p-4">
                  <p>
                    <strong>Nombres:</strong> {DatosDni.Nombres}
                  </p>
                  <p>
                    <strong>Apellidos:</strong> {DatosDni.ApellidoPaterno}{" "}
                    {DatosDni.ApellidoMaterno}
                  </p>
                  <p>
                    <strong>Mayor de edad:</strong>{" "}
                    {DatosDni.PuedeValidarEdad
                      ? DatosDni.Edad >= 18
                        ? "Sí"
                        : "No"
                      : "No disponible"}
                  </p>
                </div>
              ) : null}
            </form>
          </Panel>
          <Panel Titulo="Inspector">
            <Tabla
              Filas={Inspectores}
              Columnas={[
                { Clave: "dni", Titulo: "DNI" },
                { Clave: "nombres", Titulo: "Nombres" },
                { Clave: "correo_institucional", Titulo: "Correo" },
                {
                  Clave: "habilitado",
                  Titulo: "Estado",
                  Renderizar: (Fila) =>
                    Fila.habilitado ? "Habilitado" : "Deshabilitado",
                },
                {
                  Clave: "accion",
                  Titulo: "Acción",
                  Renderizar: (Fila) => (
                    <Boton
                      Variante={Fila.habilitado ? "peligro" : "secundario"}
                      onClick={() =>
                        Ejecutar(
                          () => CambiarHabilitacion(Fila.id, !Fila.habilitado),
                          "La habilitación fue actualizada.",
                          CargarTrabajadores,
                        )
                      }
                    >
                      {Fila.habilitado ? "Deshabilitar" : "Habilitar"}
                    </Boton>
                  ),
                },
              ]}
            />
          </Panel>
          <Panel Titulo="Cajeras">
            <Tabla
              Filas={Cajeras}
              Columnas={[
                { Clave: "dni", Titulo: "DNI" },
                { Clave: "nombres", Titulo: "Nombres" },
                { Clave: "correo_institucional", Titulo: "Correo" },
                {
                  Clave: "habilitado",
                  Titulo: "Estado",
                  Renderizar: (Fila) =>
                    Fila.habilitado ? "Habilitada" : "Deshabilitada",
                },
                {
                  Clave: "accion",
                  Titulo: "Acción",
                  Renderizar: (Fila) => (
                    <Boton
                      Variante={Fila.habilitado ? "peligro" : "secundario"}
                      onClick={() =>
                        Ejecutar(
                          () => CambiarHabilitacion(Fila.id, !Fila.habilitado),
                          "La habilitación fue actualizada.",
                          CargarTrabajadores,
                        )
                      }
                    >
                      {Fila.habilitado ? "Deshabilitar" : "Habilitar"}
                    </Boton>
                  ),
                },
              ]}
            />
          </Panel>
        </div>
      )}

      {Seccion === "CONFIGURACION" && (
        <Panel className="mt-5" Titulo="Parámetros configurables">
          <div className="space-y-4">
            {Configuraciones.map((Configuracion) => (
              <ConfiguracionEditable
                key={Configuracion.clave}
                Configuracion={Configuracion}
                AlGuardar={(Valor) =>
                  Ejecutar(
                    () => GuardarConfiguracion(Configuracion.clave, Valor),
                    "La configuración fue actualizada.",
                    CargarConfiguracion,
                  )
                }
                Ocupado={Ocupado}
              />
            ))}
          </div>
        </Panel>
      )}

      {Seccion === "FERIADOS" && (
        <div className="mt-5 space-y-5">
          <Panel Titulo="Registrar feriado">
            <form
              onSubmit={(Evento) => {
                Evento.preventDefault();
                Ejecutar(
                  () => GuardarFeriado(NuevoFeriado),
                  "El feriado fue guardado.",
                  CargarFeriados,
                );
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              <CampoFormulario
                Etiqueta="Fecha"
                Tipo="date"
                value={NuevoFeriado.Fecha}
                onChange={(Evento) =>
                  setNuevoFeriado((Actual) => ({
                    ...Actual,
                    Fecha: Evento.target.value,
                  }))
                }
                Obligatorio
              />
              <CampoFormulario
                Etiqueta="Descripción"
                value={NuevoFeriado.Descripcion}
                onChange={(Evento) =>
                  setNuevoFeriado((Actual) => ({
                    ...Actual,
                    Descripcion: Evento.target.value.slice(0, 200),
                  }))
                }
                Obligatorio
              />
              <div className="md:col-span-2">
                <Boton Tipo="submit" Ocupado={Ocupado}>
                  Guardar feriado
                </Boton>
              </div>
            </form>
          </Panel>
          <Panel Titulo="Calendario registrado">
            <Tabla
              Filas={Feriados}
              Columnas={[
                {
                  Clave: "fecha",
                  Titulo: "Fecha",
                  Renderizar: (Fila) => String(Fila.fecha).slice(0, 10),
                },
                { Clave: "descripcion", Titulo: "Descripción" },
                {
                  Clave: "activo",
                  Titulo: "Estado",
                  Renderizar: (Fila) => (Fila.activo ? "Activo" : "Inactivo"),
                },
              ]}
            />
          </Panel>
        </div>
      )}

      {Seccion === "AUDITORIA" && (
        <Panel
          className="mt-5"
          Titulo="Registro de auditoría"
          Descripcion="Este historial es de solo lectura y no ofrece acciones para modificar o eliminar registros."
        >
          <Tabla
            Filas={Auditoria}
            Columnas={[
              {
                Clave: "fecha_hora",
                Titulo: "Fecha",
                Renderizar: (Fila) =>
                  String(Fila.fecha_hora).replace("T", " ").slice(0, 19),
              },
              { Clave: "nombre_usuario", Titulo: "Usuario" },
              { Clave: "accion", Titulo: "Acción" },
              { Clave: "entidad", Titulo: "Entidad" },
              {
                Clave: "detalles",
                Titulo: "Detalles",
                Renderizar: (Fila) =>
                  Fila.detalles ? JSON.stringify(Fila.detalles) : "—",
              },
            ]}
          />
        </Panel>
      )}
    </>
  );
}

// Permite cambiar un parámetro sin editar los demás.
function ConfiguracionEditable({ Configuracion, AlGuardar, Ocupado }) {
  const [Valor, setValor] = useState(Configuracion.valor);
  useEffect(() => setValor(Configuracion.valor), [Configuracion.valor]);
  return (
    <div className="grid items-end gap-3 border-b border-[#d7dde5] pb-4 md:grid-cols-[1fr_280px_auto]">
      <div>
        <strong className="text-[#17365d]">{Configuracion.clave}</strong>
        <p className="text-sm text-[#536174]">Tipo: {Configuracion.tipo}</p>
      </div>
      <CampoFormulario
        Etiqueta="Valor"
        value={Valor}
        onChange={(Evento) => setValor(Evento.target.value)}
      />
      <Boton
        Variante="secundario"
        onClick={() => AlGuardar(Valor)}
        Ocupado={Ocupado}
      >
        Guardar
      </Boton>
    </div>
  );
}