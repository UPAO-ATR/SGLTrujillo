import { Link, NavLink, Outlet } from "react-router-dom";
import { useAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import SimuladorTiempo from "./SimuladorTiempo.jsx";

export function DisposicionPublica() {
  return (
    <>
      <header className="cabecera-publica">
        <Link to="/" className="marca">SGL Trujillo</Link>
        <nav>
          <NavLink to="/seguimiento">Seguimiento</NavLink>
          <NavLink to="/login">Acceso interno</NavLink>
        </nav>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      <SimuladorTiempo />
    </>
  );
}

export function DisposicionPanel({ children }) {
  const { Usuario, Salir } = useAutenticacion();

  function CerrarSesion() {
    Salir();
    window.location.replace("/");
  }

  return (
    <div className="panel">
      <aside className="barra-lateral">
        <div>
          <strong>SGL Trujillo</strong>
          <span>Flujo corregido</span>
        </div>

        <div className="usuario">
          <b>{Usuario?.Nombre || "Usuario"}</b>
          <small>{Usuario?.Rol || "SIN ROL"}</small>
        </div>

        <nav>
          <NavLink to="/panel">Panel principal</NavLink>
          <NavLink to="/seguimiento">Seguimiento público</NavLink>
        </nav>

        <button type="button" onClick={CerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <main className="contenido-panel">
        {children}
      </main>

      <SimuladorTiempo />
    </div>
  );
}

