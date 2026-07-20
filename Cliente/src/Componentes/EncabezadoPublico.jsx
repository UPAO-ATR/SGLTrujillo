// Muestra la identidad institucional en las páginas públicas.

import { Link, NavLink } from "react-router-dom";
import { Building2 } from "lucide-react";
import { UsarAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import { ConfiguracionAplicacion } from "../Configuracion/ConfiguracionAplicacion.js";

function EstiloEnlace({ isActive }) {
  return `border-b-2 px-1 py-2 font-semibold ${isActive ? "border-[#f0b429] text-white" : "border-transparent text-[#d8e4ef] hover:text-white"}`;
}

export default function EncabezadoPublico() {
  const { Usuario } = UsarAutenticacion();

  return (
    <header className="bg-[#17365d] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="flex items-start gap-3">
          <Building2 className="mt-1" aria-hidden="true" />
          <span>
            <span className="block text-lg font-bold">
              {ConfiguracionAplicacion.NombreCorto}
            </span>
            <span className="block text-sm text-[#d8e4ef]">
              {ConfiguracionAplicacion.NombreSistema}
            </span>
            <span className="block text-xs text-[#b9c9d8]">
              {ConfiguracionAplicacion.NombreEntidad}
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap gap-5" aria-label="Navegación principal">
          <NavLink to="/negocio" className={EstiloEnlace}>
            Nueva licencia
          </NavLink>
          <NavLink to="/seguimiento" className={EstiloEnlace}>
            Revisión de proceso
          </NavLink>
          <NavLink to={Usuario ? "/panel" : "/login"} className={EstiloEnlace}>
            {Usuario ? "Panel de trabajo" : "Ingreso de trabajadores"}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}