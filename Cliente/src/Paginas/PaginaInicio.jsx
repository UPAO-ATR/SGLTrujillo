// Presenta los accesos públicos principales de SGL Trujillo.

import { Link } from "react-router-dom";
import { ClipboardList, Search, ShieldCheck } from "lucide-react";
import Boton from "../Componentes/Boton.jsx";
import Panel from "../Componentes/Panel.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";

export default function PaginaInicio() {
  return (
    <>
      <TituloPagina
        Titulo="Sistema de Gestión de Licencias de Funcionamiento"
        Descripcion="Municipalidad Distrital de Trujillo. Solicite, renueve o consulte el avance de una licencia sin crear una cuenta."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          Titulo="Nueva licencia"
          Descripcion="Inicie el trámite con el RUC del negocio."
        >
          <ClipboardList className="mb-4 text-[#174a7e]" size={34} />
          <p className="mb-5 text-[#536174]">
            El sistema validará el estado y el domicilio fiscal antes de
            permitir la solicitud.
          </p>
          <Link to="/negocio">
            <Boton>Iniciar trámite</Boton>
          </Link>
        </Panel>

        <Panel
          Titulo="Revisión de proceso"
          Descripcion="Consulte fechas, observaciones y documentos."
        >
          <Search className="mb-4 text-[#174a7e]" size={34} />
          <p className="mb-5 text-[#536174]">
            Use el código de pago o el código de inspección impreso en su
            constancia.
          </p>
          <Link to="/seguimiento">
            <Boton Variante="secundario">Consultar expediente</Boton>
          </Link>
        </Panel>

        <Panel
          Titulo="Acceso institucional"
          Descripcion="Ingreso para trabajadores autorizados."
        >
          <ShieldCheck className="mb-4 text-[#174a7e]" size={34} />
          <p className="mb-5 text-[#536174]">
            Inspector, cajera, administrador y super administrador acceden con
            sus credenciales.
          </p>
          <Link to="/login">
            <Boton Variante="neutro">Ingresar al sistema</Boton>
          </Link>
        </Panel>
      </div>

      <section className="mt-8 border-l-4 border-[#174a7e] bg-white p-5">
        <h2 className="text-xl font-bold text-[#17365d]">
          Importe oficial del trámite
        </h2>
        <p className="mt-2 text-2xl font-bold">S/ 180.00</p>
        <p className="mt-2 text-[#536174]">
          En el entorno demostrativo, la pasarela puede procesar un importe
          mínimo de prueba.
        </p>
      </section>
    </>
  );
}