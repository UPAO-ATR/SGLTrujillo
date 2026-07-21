import { createContext, useContext, useMemo, useState } from "react";
import { Api } from "../Servicios/ClienteApi.js";

const Contexto = createContext(null);

function LeerUsuario() {
  try { return JSON.parse(localStorage.getItem("SglUsuario") || "null"); } catch { return null; }
}

export function ProveedorAutenticacion({ children }) {
  const [Usuario, DefinirUsuario] = useState(LeerUsuario);
  async function Entrar(correo, clave) {
    const Resultado = await Api.Post("/auth/login", { correo, clave });
    localStorage.setItem("SglToken", Resultado.Token);
    localStorage.setItem("SglUsuario", JSON.stringify(Resultado.Usuario));
    DefinirUsuario(Resultado.Usuario);
    return Resultado.Usuario;
  }
  function Salir() {
    localStorage.removeItem("SglToken");
    localStorage.removeItem("SglUsuario");
    DefinirUsuario(null);
  }
  const Valor = useMemo(() => ({ Usuario, Entrar, Salir }), [Usuario]);
  return <Contexto.Provider value={Valor}>{children}</Contexto.Provider>;
}

export const useAutenticacion = () => useContext(Contexto);
