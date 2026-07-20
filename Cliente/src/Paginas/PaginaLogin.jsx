// Permite iniciar sesión con credenciales institucionales.

import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Boton from "../Componentes/Boton.jsx";
import CampoFormulario from "../Componentes/CampoFormulario.jsx";
import Mensaje from "../Componentes/Mensaje.jsx";
import Panel from "../Componentes/Panel.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";
import { UsarAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";

const CredencialesPrueba = [
  ["Administrador", "admin@trujillo.pe", "Admin@123"],
  ["Inspector", "inspector1@municipalidad.pe", "inspector123"],
  ["Cajera", "cajera1@municipalidad.pe", "cajera123"],
  ["Super administrador", "superadmin@sgl.muni.pe", "SuperAdmin123!"],
];

export default function PaginaLogin() {
  const { Usuario, IniciarSesion } = UsarAutenticacion();
  const Navegar = useNavigate();
  const Ubicacion = useLocation();
  const [Correo, setCorreo] = useState("");
  const [Contrasena, setContrasena] = useState("");
  const [MensajeError, setMensajeError] = useState("");
  const [Ocupado, setOcupado] = useState(false);

  if (Usuario) return <Navigate to="/panel" replace />;

  async function Enviar(Evento) {
    Evento.preventDefault();
    setMensajeError("");

    try {
      setOcupado(true);
      await IniciarSesion(Correo.trim().toLowerCase(), Contrasena);
      Navegar(Ubicacion.state?.Desde || "/panel", { replace: true });
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  function UsarCredencial(CorreoPrueba, ContrasenaPrueba) {
    setCorreo(CorreoPrueba);
    setContrasena(ContrasenaPrueba);
  }

  return (
    <>
      <TituloPagina
        Titulo="Ingreso institucional"
        Descripcion="Acceso exclusivo para trabajadores habilitados."
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.7fr)]">
        <Panel Titulo="Iniciar sesión">
          <form onSubmit={Enviar} className="space-y-5">
            <CampoFormulario
              Etiqueta="Correo institucional"
              type="email"
              value={Correo}
              onChange={(Evento) => setCorreo(Evento.target.value)}
              Obligatorio
            />
            <CampoFormulario
              Etiqueta="Contraseña"
              Tipo="password"
              value={Contrasena}
              onChange={(Evento) => setContrasena(Evento.target.value)}
              Obligatorio
            />
            <Mensaje Tipo="error">{MensajeError}</Mensaje>
            <Boton Tipo="submit" Ocupado={Ocupado}>
              Ingresar
            </Boton>
          </form>
        </Panel>

        <Panel
          Titulo="Usuarios de demostración"
          Descripcion="Seleccione una cuenta para completar los campos."
        >
          <div className="space-y-3">
            {CredencialesPrueba.map(([Rol, CorreoPrueba, ContrasenaPrueba]) => (
              <button
                key={CorreoPrueba}
                type="button"
                onClick={() => UsarCredencial(CorreoPrueba, ContrasenaPrueba)}
                className="block w-full border border-[#cbd2dc] p-3 text-left hover:border-[#174a7e] hover:bg-[#edf4fa]"
              >
                <strong className="block text-[#17365d]">{Rol}</strong>
                <span className="block text-sm text-[#536174]">
                  {CorreoPrueba}
                </span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}