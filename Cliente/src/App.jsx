// Define las rutas y pantallas principales del cliente.

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DisposicionPanel from "./Componentes/DisposicionPanel.jsx";
import DisposicionPublica from "./Componentes/DisposicionPublica.jsx";
import RutaProtegida from "./Componentes/RutaProtegida.jsx";
import { ProveedorAutenticacion } from "./Contextos/ContextoAutenticacion.jsx";
import PaginaAdministrador from "./Paginas/PaginaAdministrador.jsx";
import PaginaCajera from "./Paginas/PaginaCajera.jsx";
import PaginaCambiarContrasena from "./Paginas/PaginaCambiarContrasena.jsx";
import PaginaInicio from "./Paginas/PaginaInicio.jsx";
import PaginaInspector from "./Paginas/PaginaInspector.jsx";
import PaginaLogin from "./Paginas/PaginaLogin.jsx";
import PaginaNegocio from "./Paginas/PaginaNegocio.jsx";
import PaginaNoEncontrada from "./Paginas/PaginaNoEncontrada.jsx";
import PaginaPanel from "./Paginas/PaginaPanel.jsx";
import PaginaSeguimiento from "./Paginas/PaginaSeguimiento.jsx";
import PaginaSuperAdministrador from "./Paginas/PaginaSuperAdministrador.jsx";

// Relaciona cada dirección con su pantalla correspondiente.
export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAutenticacion>
        <Routes>
          <Route element={<DisposicionPublica />}>
            <Route index element={<PaginaInicio />} />
            <Route path="negocio" element={<PaginaNegocio />} />
            <Route path="seguimiento" element={<PaginaSeguimiento />} />
            <Route path="login" element={<PaginaLogin />} />
          </Route>

          <Route
            element={
              <RutaProtegida>
                <DisposicionPanel />
              </RutaProtegida>
            }
          >
            <Route path="panel" element={<PaginaPanel />} />
            <Route
              path="cambiarContrasena"
              element={<PaginaCambiarContrasena />}
            />
            <Route
              path="panel/inspector"
              element={
                <RutaProtegida RolesPermitidos={["INSPECTOR"]}>
                  <PaginaInspector />
                </RutaProtegida>
              }
            />
            <Route
              path="panel/cajera"
              element={
                <RutaProtegida RolesPermitidos={["CAJERA"]}>
                  <PaginaCajera />
                </RutaProtegida>
              }
            />
            <Route
              path="panel/administrador"
              element={
                <RutaProtegida RolesPermitidos={["ADMINISTRADOR"]}>
                  <PaginaAdministrador />
                </RutaProtegida>
              }
            />
            <Route
              path="panel/superAdministrador"
              element={
                <RutaProtegida RolesPermitidos={["SUPER_ADMINISTRADOR"]}>
                  <PaginaSuperAdministrador />
                </RutaProtegida>
              }
            />
          </Route>

          <Route path="/inicio" element={<Navigate to="/" replace />} />
          <Route element={<DisposicionPublica />}>
            <Route path="*" element={<PaginaNoEncontrada />} />
          </Route>
        </Routes>
      </ProveedorAutenticacion>
    </BrowserRouter>
  );
}