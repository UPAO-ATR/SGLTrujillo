import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAutenticacion } from "../Contextos/ContextoAutenticacion.jsx";
import { Boton, Campo, Mensaje } from "../Componentes/Comunes.jsx";

export default function PaginaLogin() {
  const { Usuario, Entrar } = useAutenticacion();
  const [Correo, DefinirCorreo] = useState("");
  const [Clave, DefinirClave] = useState("");
  const [MensajeError, DefinirMensajeError] = useState("");
  const [Cargando, DefinirCargando] = useState(false);

  if (Usuario) return <Navigate to="/panel" replace />;

  async function Enviar(Evento) {
    Evento.preventDefault();
    DefinirMensajeError("");
    DefinirCargando(true);

    try {
      await Entrar(Correo, Clave);
      window.location.replace("/panel");
    } catch (Falla) {
      DefinirMensajeError(
        Falla?.message || "No fue posible iniciar sesión."
      );
      DefinirCargando(false);
    }
  }

  return (
    <div className="login">
      <form className="seccion" onSubmit={Enviar}>
        <h1>Acceso interno</h1>
        <p>
          Solo para cajeros, inspector, administrador y
          superadministrador.
        </p>

        <Mensaje tipo="error">{MensajeError}</Mensaje>

        <Campo
          etiqueta="Correo"
          type="email"
          value={Correo}
          onChange={(e) => DefinirCorreo(e.target.value)}
          required
        />

        <Campo
          etiqueta="Contraseña"
          type="password"
          value={Clave}
          onChange={(e) => DefinirClave(e.target.value)}
          required
        />

        <Boton disabled={Cargando}>
          {Cargando ? "Ingresando..." : "Ingresar"}
        </Boton>

        <details>
          <summary>Usuarios de demostración</summary>
          <code>cajero1@sgl.pe / Cajero123!</code>
          <code>inspector@sgl.pe / Inspector123!</code>
          <code>admin@sgl.pe / Admin123!</code>
          <code>superadmin@sgl.pe / SuperAdmin123!</code>
        </details>
      </form>
    </div>
  );
}

