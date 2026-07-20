// Organiza la estructura visual de las páginas públicas.

import { Outlet } from "react-router-dom";
import EncabezadoPublico from "./EncabezadoPublico.jsx";

export default function DisposicionPublica() {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <EncabezadoPublico />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mt-10 border-t border-[#cbd2dc] bg-white px-4 py-5 text-center text-sm text-[#536174]">
        Sistema demostrativo de gestión de licencias de funcionamiento.
      </footer>
    </div>
  );
}