import { useEffect, useState } from "react";
import { Api } from "../Servicios/ClienteApi.js";
import { Boton, Campo, Mensaje, Seccion } from "../Componentes/Comunes.jsx";

export default function PaginaSuperAdministrador() {
  const [Administrador, DefinirAdministrador] = useState(null);
  const [Formulario, DefinirFormulario] = useState({ correo: "", clave: "" });
  const [Mensaje, DefinirMensaje] = useState("");
  async function Cargar() { try { const R = await Api.Get("/superadministrador/administrador"); DefinirAdministrador(R.Administrador); } catch (Error) { DefinirMensaje(Error.message); } }
  useEffect(() => { Cargar(); }, []);
  async function Guardar(Evento) { Evento.preventDefault(); try { const R = await Api.Put("/superadministrador/administrador", Formulario); DefinirAdministrador(R.Administrador); DefinirFormulario({ correo: "", clave: "" }); DefinirMensaje("Credenciales del administrador actualizadas."); } catch (Error) { DefinirMensaje(Error.message); } }
  return <div className="pagina"><h1>Superadministración</h1><p>Este perfil existe únicamente para cambiar el correo o restablecer la contraseña del único administrador.</p><Mensaje>{Mensaje}</Mensaje><Seccion titulo="Administrador único"><div className="detalle"><div><span>Nombre</span><b>{Administrador?.nombre || "-"}</b></div><div><span>Correo</span><b>{Administrador?.correo || "-"}</b></div></div><form className="rejilla dos" onSubmit={Guardar}><Campo etiqueta="Nuevo correo" type="email" value={Formulario.correo} onChange={(e) => DefinirFormulario({ ...Formulario, correo: e.target.value })} /><Campo etiqueta="Nueva contraseña" type="password" minLength="8" value={Formulario.clave} onChange={(e) => DefinirFormulario({ ...Formulario, clave: e.target.value })} /><Boton>Actualizar credenciales</Boton></form></Seccion></div>;
}
