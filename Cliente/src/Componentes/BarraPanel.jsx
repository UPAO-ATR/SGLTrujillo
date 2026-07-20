// Muestra la navegación principal de los usuarios autenticados.

import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, KeyRound } from "lucide-react";
import { UsarAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import { ConfiguracionAplicacion } from "../Configuracion/ConfiguracionAplicacion.js";

function ObtenerNombreRol(Rol) {
  return (
    {
      INSPECTOR: "Inspector",
      CAJERA: "Cajera",
      ADMINISTRADOR: "Administrador",
      SUPER_ADMINISTRADOR: "Super administrador",
    }[Rol] || Rol
  );
}

export default function BarraPanel() {
  const { Usuario, CerrarSesion } = UsarAutenticacion();
  const Navegar = useNavigate();

  function Salir() {
    CerrarSesion();
    Navegar("/login");
  }

  return (
    <header className="border-b border-[#cbd2dc] bg-[#17365d] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/panel" className="text-lg font-bold">
            {ConfiguracionAplicacion.NombreCorto}
          </Link>
          <p className="text-xs text-[#b9c9d8]">
            {ConfiguracionAplicacion.NombreSistema}
          </p>
          <p className="mt-1 text-sm text-[#d8e4ef]">
            {Usuario?.nombres} {Usuario?.apellido_paterno} ·{" "}
            {ObtenerNombreRol(Usuario?.rol)}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          <NavLink to="/panel" className="font-semibold hover:text-[#f0b429]">
            Panel
          </NavLink>
          <NavLink
            to="/cambiarContrasena"
            className="flex items-center gap-2 font-semibold hover:text-[#f0b429]"
          >
            <KeyRound size={18} /> Cambiar contraseña
          </NavLink>
          <button
            type="button"
            onClick={Salir}
            className="flex items-center gap-2 font-semibold hover:text-[#f0b429]"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}