import { useAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import PaginaCajero from "./PaginaCajero.jsx";
import PaginaInspector from "./PaginaInspector.jsx";
import PaginaAdministrador from "./PaginaAdministrador.jsx";
import PaginaSuperAdministrador from "./PaginaSuperAdministrador.jsx";

export default function PaginaPanel() {
  const { Usuario } = useAutenticacion();
  if (Usuario.Rol === "CAJERO") return <PaginaCajero />;
  if (Usuario.Rol === "INSPECTOR") return <PaginaInspector />;
  if (Usuario.Rol === "ADMINISTRADOR") return <PaginaAdministrador />;
  if (Usuario.Rol === "SUPERADMINISTRADOR") return <PaginaSuperAdministrador />;
  return <p>Rol no reconocido.</p>;
}
