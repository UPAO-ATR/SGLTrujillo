import { createContext, useContext, useMemo, useState } from "react";
import { Api } from "../Servicios/ClienteApi.js";

const Contexto = createContext(null);

function NormalizarUsuario(Datos) {
  if (!Datos || typeof Datos !== "object") return null;

  const Rol = String(Datos.Rol ?? Datos.rol ?? "").trim().toUpperCase();
  const Nombre = String(Datos.Nombre ?? Datos.nombre ?? "").trim();
  const Correo = String(Datos.Correo ?? Datos.correo ?? "").trim();
  const Id = String(Datos.Id ?? Datos.id ?? "").trim();

  if (!Rol || !Correo) return null;

  return { Id, Nombre, Correo, Rol };
}

function LeerUsuario() {
  try {
    return NormalizarUsuario(
      JSON.parse(localStorage.getItem("SglUsuario") || "null")
    );
  } catch {
    localStorage.removeItem("SglUsuario");
    localStorage.removeItem("SglToken");
    return null;
  }
}

export function ProveedorAutenticacion({ children }) {
  const [Usuario, DefinirUsuario] = useState(LeerUsuario);

  async function Entrar(correo, clave) {
    const Resultado = await Api.Post("/auth/login", { correo, clave });
    const Token = Resultado?.Token ?? Resultado?.token;
    const UsuarioNormalizado = NormalizarUsuario(
      Resultado?.Usuario ?? Resultado?.usuario
    );

    if (!Token || !UsuarioNormalizado) {
      throw new globalThis.Error(
        "El servidor respondiÃ³ sin una sesiÃ³n vÃ¡lida."
      );
    }

    localStorage.setItem("SglToken", Token);
    localStorage.setItem(
      "SglUsuario",
      JSON.stringify(UsuarioNormalizado)
    );
    DefinirUsuario(UsuarioNormalizado);

    return UsuarioNormalizado;
  }

  function Salir() {
    localStorage.removeItem("SglToken");
    localStorage.removeItem("SglUsuario");
    DefinirUsuario(null);
  }

  const Valor = useMemo(
    () => ({ Usuario, Entrar, Salir }),
    [Usuario]
  );

  return (
    <Contexto.Provider value={Valor}>
      {children}
    </Contexto.Provider>
  );
}

export function useAutenticacion() {
  const Valor = useContext(Contexto);

  if (!Valor) {
    throw new globalThis.Error(
      "El contexto de autenticaciÃ³n no estÃ¡ disponible."
    );
  }

  return Valor;
}
