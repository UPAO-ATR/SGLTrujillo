// Informa que la dirección solicitada no existe.

import { Link } from "react-router-dom";
import Boton from "../Componentes/Boton.jsx";
import Panel from "../Componentes/Panel.jsx";

export default function PaginaNoEncontrada() {
  return (
    <Panel Titulo="Página no encontrada">
      <p className="mb-5 text-[#536174]">
        La dirección ingresada no corresponde a una sección disponible.
      </p>
      <Link to="/">
        <Boton>Volver al inicio</Boton>
      </Link>
    </Panel>
  );
}