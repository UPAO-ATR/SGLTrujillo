import { Link, NavLink, Outlet } from "react-router-dom";
import { useAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import SimuladorTiempo from "./SimuladorTiempo.jsx";

export function DisposicionPublica() {
  return <><header className="cabecera-publica"><Link to="/" className="marca">SGL Trujillo</Link><nav><NavLink to="/seguimiento">Seguimiento</NavLink><NavLink to="/login">Acceso interno</NavLink></nav></header><main className="contenido"><Outlet /></main><SimuladorTiempo /></>;
}

export function DisposicionPanel() {
  const { Usuario, Salir } = useAutenticacion();
  return <div className="panel"><aside className="barra-lateral"><div><strong>SGL Trujillo</strong><span>Flujo corregido</span></div><div className="usuario"><b>{Usuario?.Nombre}</b><small>{Usuario?.Rol}</small></div><nav><NavLink to="/panel">Panel principal</NavLink><NavLink to="/seguimiento">Seguimiento público</NavLink></nav><button onClick={Salir}>Cerrar sesión</button></aside><main className="contenido-panel"><Outlet /></main><SimuladorTiempo /></div>;
}
