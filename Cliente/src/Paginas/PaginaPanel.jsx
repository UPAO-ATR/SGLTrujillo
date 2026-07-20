// Dirige al usuario al panel correspondiente a su rol.

import { Navigate } from "react-router-dom";
import { UsarAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";

export default function PaginaPanel() {
  const { Usuario } = UsarAutenticacion();
  const Rutas = {
    INSPECTOR: "/panel/inspector",
    CAJERA: "/panel/cajera",
    ADMINISTRADOR: "/panel/administrador",
    SUPER_ADMINISTRADOR: "/panel/superAdministrador",
  };
  return <Navigate to={Rutas[Usuario?.rol] || "/"} replace />;
}