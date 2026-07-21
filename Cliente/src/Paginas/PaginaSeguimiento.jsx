import { useState } from "react";
import { Api } from "../Servicios/ClienteApi.js";
import { Boton, Campo, EtiquetaEstado, Mensaje, Seccion, Selector } from "../Componentes/Comunes.jsx";

function Fecha(Valor) { return Valor ? new Date(`${String(Valor).slice(0,10)}T12:00:00`).toLocaleDateString("es-PE") : "-"; }

export default function PaginaSeguimiento() {
  const [Ruc, DefinirRuc] = useState("");
  const [Datos, DefinirDatos] = useState(null);
  const [Seleccion, DefinirSeleccion] = useState("");
  const [Error, DefinirError] = useState("");
  async function Buscar(Evento) {
    Evento.preventDefault(); DefinirError(""); DefinirDatos(null);
    try {
      const Resultado = await Api.Get(`/publico/seguimiento/${Ruc}`);
      DefinirDatos(Resultado);
      DefinirSeleccion(Resultado.Registros?.[0]?.local_codigo || "");
    } catch (Falla) { DefinirError(Falla.message); }
  }
  const Registro = Datos?.Registros?.find((Item) => String(Item.local_codigo) === String(Seleccion));
  return <div className="pagina"><h1>Seguimiento de licencia</h1><p>Ingresa el RUC y selecciona el local cuando existan varias direcciones.</p><form className="busqueda" onSubmit={Buscar}><Campo etiqueta="RUC" value={Ruc} maxLength="11" onChange={(e) => DefinirRuc(e.target.value.replace(/\D/g,""))} required /><Boton>Consultar</Boton></form><Mensaje tipo="error">{Error}</Mensaje>{Datos?.Mensaje && <Mensaje>{Datos.Mensaje}</Mensaje>}{Datos?.Registros?.length > 0 && <Seccion titulo="Resultado"><Selector etiqueta="Local" value={Seleccion} onChange={(e) => DefinirSeleccion(e.target.value)}>{Datos.Registros.map((Item) => <option key={Item.id} value={Item.local_codigo}>{Item.direccion}</option>)}</Selector>{Registro && <div className="detalle"><div><span>Razón social</span><b>{Registro.razon_social}</b></div><div><span>Dirección</span><b>{Registro.direccion}</b></div><div><span>Estado</span><EtiquetaEstado estado={Registro.estado} /></div>{Registro.estado === "EN_PROCESO" && <div><span>Primera inspección</span><b>{Fecha(Registro.primera_inspeccion)}</b></div>}{Registro.estado === "EN_OBSERVACION" && <><div><span>Observaciones</span><b>{Registro.observaciones_primera}</b></div><div><span>Segunda inspección</span><b>{Fecha(Registro.segunda_inspeccion)}</b></div></>}{["APROBADO","VENCIDO"].includes(Registro.estado) && <><div><span>Número de licencia</span><b>{Registro.numero_licencia}</b></div><div><span>Vence</span><b>{Fecha(Registro.fecha_vencimiento)}</b></div><a className="boton enlace" target="_blank" rel="noreferrer" href={`/api/publico/licencias/${Registro.id}/${Ruc}`}>{Registro.estado === "VENCIDO" ? "Descargar licencia vencida" : "Descargar licencia"}</a></>}</div>}</Seccion>}</div>;
}
