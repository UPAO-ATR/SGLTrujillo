// Impide abrir una página sin sesión o sin el rol requerido.

import { Navigate, useLocation } from "react-router-dom";
import { UsarAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import Cargando from "./Cargando.jsx";

// Redirige cuando la sesión no cumple los permisos.
export default function RutaProtegida({ RolesPermitidos, children }) {
  const { Usuario, CargandoSesion } = UsarAutenticacion();
  const Ubicacion = useLocation();

  if (CargandoSesion) return <Cargando Texto="Verificando sesión..." />;
  if (!Usuario)
    return (
      <Navigate to="/login" replace state={{ Desde: Ubicacion.pathname }} />
    );
  if (RolesPermitidos && !RolesPermitidos.includes(Usuario.rol))
    return <Navigate to="/" replace />;

  return children;
}