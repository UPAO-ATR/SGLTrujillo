// Permite cambiar la contraseña del usuario autenticado.

import { useState } from "react";
import Boton from "../Componentes/Boton.jsx";
import CampoFormulario from "../Componentes/CampoFormulario.jsx";
import Mensaje from "../Componentes/Mensaje.jsx";
import Panel from "../Componentes/Panel.jsx";
import TituloPagina from "../Componentes/TituloPagina.jsx";
import { CambiarContrasena } from "../Servicios/ServicioAutenticacion.js";

export default function PaginaCambiarContrasena() {
  const [Datos, setDatos] = useState({
    ContrasenaActual: "",
    ContrasenaNueva: "",
    ConfirmacionContrasena: "",
  });
  const [MensajeError, setMensajeError] = useState("");
  const [MensajeExito, setMensajeExito] = useState("");
  const [Ocupado, setOcupado] = useState(false);

  function CambiarCampo(Campo, Valor) {
    setDatos((Actual) => ({ ...Actual, [Campo]: Valor }));
  }

  async function Enviar(Evento) {
    Evento.preventDefault();
    setMensajeError("");
    setMensajeExito("");

    if (Datos.ContrasenaNueva !== Datos.ConfirmacionContrasena) {
      setMensajeError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    try {
      setOcupado(true);
      const Resultado = await CambiarContrasena(Datos);
      setMensajeExito(Resultado.Mensaje);
      setDatos({
        ContrasenaActual: "",
        ContrasenaNueva: "",
        ConfirmacionContrasena: "",
      });
    } catch (Error) {
      setMensajeError(Error.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <TituloPagina
        Titulo="Cambiar contraseña"
        Descripcion="La contraseña anterior quedará invalidada inmediatamente."
      />
      <Panel className="max-w-2xl" Titulo="Datos de seguridad">
        <form onSubmit={Enviar} className="space-y-5">
          <CampoFormulario
            Etiqueta="Contraseña actual"
            Tipo="password"
            value={Datos.ContrasenaActual}
            onChange={(Evento) =>
              CambiarCampo("ContrasenaActual", Evento.target.value)
            }
            Obligatorio
          />
          <CampoFormulario
            Etiqueta="Contraseña nueva"
            Tipo="password"
            value={Datos.ContrasenaNueva}
            onChange={(Evento) =>
              CambiarCampo("ContrasenaNueva", Evento.target.value)
            }
            minLength={8}
            Obligatorio
            Ayuda="Debe tener al menos 8 caracteres y ser diferente de la contraseña actual."
          />
          <CampoFormulario
            Etiqueta="Confirmar contraseña nueva"
            Tipo="password"
            value={Datos.ConfirmacionContrasena}
            onChange={(Evento) =>
              CambiarCampo("ConfirmacionContrasena", Evento.target.value)
            }
            minLength={8}
            Obligatorio
          />
          <Mensaje Tipo="error">{MensajeError}</Mensaje>
          <Mensaje Tipo="exito">{MensajeExito}</Mensaje>
          <Boton Tipo="submit" Ocupado={Ocupado}>
            Guardar contraseña
          </Boton>
        </form>
      </Panel>
    </>
  );
}