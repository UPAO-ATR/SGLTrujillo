import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProveedorAutenticacion, useAutenticacion } from "./Contextos/ContextoAutenticacion.jsx";
import { DisposicionPanel, DisposicionPublica } from "./Componentes/Disposicion.jsx";
import RutaProtegida from "./Componentes/RutaProtegida.jsx";
import PaginaInicio from "./Paginas/PaginaInicio.jsx";
import PaginaLogin from "./Paginas/PaginaLogin.jsx";
import PaginaSeguimiento from "./Paginas/PaginaSeguimiento.jsx";
import PaginaPanel from "./Paginas/PaginaPanel.jsx";

function RutasAplicacion() {
  const { Salir } = useAutenticacion();
  return <Routes><Route element={<DisposicionPublica />}><Route index element={<PaginaInicio />} /><Route path="seguimiento" element={<PaginaSeguimiento />} /><Route path="login" element={<PaginaLogin />} /></Route><Route path="panel" element={<RutaProtegida><DisposicionPanel /></RutaProtegida>}><Route index element={<PaginaPanel />} /></Route><Route path="salir" element={<button onClick={Salir}>Salir</button>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}

export default function App() {
  return <BrowserRouter><ProveedorAutenticacion><RutasAplicacion /></ProveedorAutenticacion></BrowserRouter>;
}
