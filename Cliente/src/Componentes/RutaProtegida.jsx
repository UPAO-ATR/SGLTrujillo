import { Navigate } from "react-router-dom";
import { useAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";

export default function RutaProtegida({ children }) {
  const { Usuario } = useAutenticacion();
  return Usuario ? children : <Navigate to="/login" replace />;
}
