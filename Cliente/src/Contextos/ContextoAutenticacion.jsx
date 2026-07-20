// Comparte la sesión del usuario entre todas las pantallas.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  IniciarSesion as IniciarSesionApi,
  ObtenerSesion,
} from "../Servicios/ServicioAutenticacion.js";

const ContextoAutenticacion = createContext(null);

// Restaura la sesión guardada al iniciar la aplicación.
export function ProveedorAutenticacion({ children }) {
  const [Usuario, setUsuario] = useState(null);
  const [CargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    async function RestaurarSesion() {
      const Token = localStorage.getItem("TokenSgl");
      if (!Token) {
        setCargandoSesion(false);
        return;
      }

      try {
        setUsuario(await ObtenerSesion());
      } catch {
        localStorage.removeItem("TokenSgl");
      } finally {
        setCargandoSesion(false);
      }
    }

    RestaurarSesion();
  }, []);

  // Guarda el token y los datos del usuario autenticado.
  async function IniciarSesion(Correo, Contrasena) {
    const Datos = await IniciarSesionApi(Correo, Contrasena);
    localStorage.setItem("TokenSgl", Datos.Token);
    setUsuario(Datos.Usuario);
    return Datos.Usuario;
  }

  // Elimina toda la información local de la sesión.
  function CerrarSesion() {
    localStorage.removeItem("TokenSgl");
    setUsuario(null);
  }

  const Valor = useMemo(
    () => ({ Usuario, CargandoSesion, IniciarSesion, CerrarSesion }),
    [Usuario, CargandoSesion],
  );

  return (
    <ContextoAutenticacion.Provider value={Valor}>
      {children}
    </ContextoAutenticacion.Provider>
  );
}

export function UsarAutenticacion() {
  return useContext(ContextoAutenticacion);
}