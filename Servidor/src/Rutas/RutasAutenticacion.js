// Define las rutas de autenticación y contraseña.

import { Router } from "express";
import { ValidarCuerpo } from "../Middleware/Validacion.js";
import {
  EsquemaLogin,
  EsquemaCambiarContrasena,
} from "../Validadores/Esquemas.js";
export function CrearRutasAutenticacion(Controlador, Autenticar) {
  const Rutas = Router();
  Rutas.post("/login", ValidarCuerpo(EsquemaLogin), Controlador.IniciarSesion);
  Rutas.get("/sesion", Autenticar, Controlador.ObtenerSesion);
  Rutas.post(
    "/cambiarContrasena",
    Autenticar,
    ValidarCuerpo(EsquemaCambiarContrasena),
    Controlador.CambiarContrasena,
  );
  return Rutas;
}