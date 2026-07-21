import { useEffect, useState } from "react";
import { Api } from "../Servicios/ClienteApi.js";

export default function SimuladorTiempo() {
  const [Fecha, DefinirFecha] = useState("");
  const [Mensaje, DefinirMensaje] = useState("");
  useEffect(() => { Api.Get("/tiempo").then((r) => DefinirFecha(r.Fecha)).catch(() => {}); }, []);
  async function Cambiar() {
    try {
      const Resultado = await Api.Put("/tiempo", { fecha: Fecha });
      DefinirMensaje(`Fecha simulada: ${Resultado.Fecha}`);
      window.dispatchEvent(new Event("tiempoActualizado"));
    } catch (Error) { DefinirMensaje(Error.message); }
  }
  return <aside className="simulador">
    <strong>Simulador de fecha</strong>
    <input type="date" value={Fecha} onChange={(e) => DefinirFecha(e.target.value)} />
    <button onClick={Cambiar}>Aplicar</button>
    {Mensaje && <small>{Mensaje}</small>}
  </aside>;
}
