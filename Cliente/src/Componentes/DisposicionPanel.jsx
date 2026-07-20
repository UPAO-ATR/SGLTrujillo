// Organiza la estructura visual de los paneles internos.

import { Outlet } from "react-router-dom";
import BarraPanel from "./BarraPanel.jsx";

export default function DisposicionPanel() {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <BarraPanel />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}