import { useAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import PaginaCajero from "./PaginaCajero.jsx";
import PaginaInspector from "./PaginaInspector.jsx";
import PaginaAdministrador from "./PaginaAdministrador.jsx";
import PaginaSuperAdministrador from "./PaginaSuperAdministrador.jsx";

export default function PaginaPanel() {
  const { Usuario } = useAutenticacion();
  const Rol = String(Usuario?.Rol ?? Usuario?.rol ?? "")
    .trim()
    .toUpperCase();

  if (Rol === "CAJERO") return <PaginaCajero />;
  if (Rol === "INSPECTOR") return <PaginaInspector />;
  if (Rol === "ADMINISTRADOR") return <PaginaAdministrador />;
  if (Rol === "SUPERADMINISTRADOR") {
    return <PaginaSuperAdministrador />;
  }

  return (
    <div className="pagina">
      <h1>Rol no reconocido</h1>
      <p>
        La sesión fue iniciada, pero el perfil no contiene un rol permitido.
      </p>
      <button
        className="boton"
        type="button"
        onClick={() => {
          localStorage.removeItem("SglToken");
          localStorage.removeItem("SglUsuario");
          window.location.replace("/login");
        }}
      >
        Volver a iniciar sesión
      </button>
    </div>
  );
}

