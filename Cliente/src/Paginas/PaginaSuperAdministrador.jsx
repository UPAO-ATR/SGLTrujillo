// Permite crear al único administrador habilitado.

import { useEffect, useState } from "react";
import Boton from "../Componentes/Boton.jsx";
import CampoFormulario from "../Componentes/CampoFormulario.jsx";
import Mensaje from "../Componentes/Mensaje.jsx";
import Panel from "../Componentes/Panel.jsx";
import Tabla from "../Componentes/Tabla.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";
import {
  CrearAdministrador,
  ListarAuditoria,
} from "../Servicios/ServicioAdministracion.js";

export default function PaginaSuperAdministrador() {
  const [Dni, setDni] = useState("");
  const [Auditoria, setAuditoria] = useState([]);
  const [MensajeError, setMensajeError] = useState("");
  const [MensajeExito, setMensajeExito] = useState("");
  const [Ocupado, setOcupado] = useState(false);

  async function CargarAuditoria() {
    try {
      setAuditoria(await ListarAuditoria());
    } catch (Error) {
      setMensajeError(Error.message);
    }
  }

  useEffect(() => {
    CargarAuditoria();
  }, []);

  async function Enviar(Evento) {
    Evento.preventDefault();
    try {
      setOcupado(true);
      setMensajeError("");
      const Resultado = await CrearAdministrador(Dni);
      setMensajeExito(
        `Administrador creado: ${Resultado.Administrador.correo_institucional}. Contraseña temporal: ${Resultado.ContrasenaTemporal}`,
      );
      setDni("");
      await CargarAuditoria();
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <TituloPagina
        Titulo="Super administración"
        Descripcion="Este rol único puede crear un solo administrador habilitado y revisar la auditoría."
      />
      <div className="space-y-4">
        <Mensaje Tipo="error">{MensajeError}</Mensaje>
        <Mensaje Tipo="exito">{MensajeExito}</Mensaje>
      </div>
      <Panel className="mt-5" Titulo="Crear administrador">
        <form
          onSubmit={Enviar}
          className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <CampoFormulario
              Etiqueta="DNI del administrador"
              value={Dni}
              onChange={(Evento) =>
                setDni(Evento.target.value.replace(/\D/g, "").slice(0, 8))
              }
              maxLength={8}
              Obligatorio
              Ayuda="El sistema validará existencia, mayoría de edad y duplicidad."
            />
          </div>
          <Boton Tipo="submit" Ocupado={Ocupado}>
            Crear administrador
          </Boton>
        </form>
      </Panel>
      <Panel className="mt-5" Titulo="Auditoría reciente">
        <Tabla
          Filas={Auditoria}
          Columnas={[
            {
              Clave: "fecha_hora",
              Titulo: "Fecha",
              Renderizar: (Fila) =>
                String(Fila.fecha_hora).replace("T", " ").slice(0, 19),
            },
            { Clave: "nombre_usuario", Titulo: "Usuario" },
            { Clave: "accion", Titulo: "Acción" },
            { Clave: "entidad", Titulo: "Entidad" },
          ]}
        />
      </Panel>
    </>
  );
}