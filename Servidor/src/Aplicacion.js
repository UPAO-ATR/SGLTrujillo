// Configura Express, la seguridad, las rutas y la interfaz web.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ConfiguracionEntorno } from "./Configuracion/ConfiguracionEntorno.js";
import { VerificarBaseDatos } from "./BaseDatos/ConexionBaseDatos.js";
import { Contenedor, Controladores } from "./Contenedor.js";
import {
  CrearMiddlewareAutenticacion,
  CrearMiddlewareAutenticacionOpcional,
} from "./Middleware/Autenticacion.js";
import {
  ManejarErrores,
  RutaNoEncontrada,
} from "./Middleware/ManejoErrores.js";
import { CrearRutasAutenticacion } from "./Rutas/RutasAutenticacion.js";
import { CrearRutasPublicas } from "./Rutas/RutasPublicas.js";
import { CrearRutasInspecciones } from "./Rutas/RutasInspecciones.js";
import { CrearRutasCaja } from "./Rutas/RutasCaja.js";
import { CrearRutasAdministracion } from "./Rutas/RutasAdministracion.js";
import { CrearRutasInspectores } from "./Rutas/RutasInspectores.js";
import { CrearRutasArchivos } from "./Rutas/RutasArchivos.js";

const CarpetaCliente = fileURLToPath(
  new URL("../../Cliente/dist", import.meta.url),
);
const ArchivoCliente = path.join(CarpetaCliente, "index.html");

// Construye la aplicación con todas sus rutas.
export function CrearAplicacion() {
  const Aplicacion = express();
  Aplicacion.set("trust proxy", 1);
  Aplicacion.use(
    // Aplica cabeceras de seguridad al servicio.
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  Aplicacion.use(
    cors({
      origin: ConfiguracionEntorno.OrigenCliente.split(",").map((Origen) =>
        Origen.trim(),
      ),
    }),
  );
  Aplicacion.use(express.json({ limit: "1mb" }));
  Aplicacion.use(express.urlencoded({ extended: false }));
  Aplicacion.use(
    "/api",
    // Limita las solicitudes repetidas a la API.
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  const Autenticar = CrearMiddlewareAutenticacion(
    Contenedor.RepositorioUsuarios,
  );
  const AutenticarOpcional = CrearMiddlewareAutenticacionOpcional(
    Contenedor.RepositorioUsuarios,
  );

  Aplicacion.get("/api/health", async (Solicitud, Respuesta) => {
    try {
      Respuesta.json({
        Exito: true,
        Estado: "OPERATIVO",
        Sistema: "SGL Trujillo",
        BaseDatos: await VerificarBaseDatos(),
        Almacenamiento: Contenedor.AlmacenArchivos.UsaGoogleCloud()
          ? "GOOGLE_CLOUD_STORAGE"
          : "LOCAL_DEMOSTRACION",
        MercadoPago: Contenedor.ClienteMercadoPago.EstaConfigurado()
          ? "CONFIGURADO"
          : "DEMOSTRACION",
        Correo: Contenedor.ClienteCorreo.EstaConfigurado()
          ? "BREVO_CONFIGURADO"
          : "REGISTRO_LOCAL",
        FechaHora: new Date().toISOString(),
      });
    } catch (Error) {
      Respuesta.status(503).json({
        Exito: false,
        Estado: "NO_OPERATIVO",
        Mensaje: Error.message,
      });
    }
  });

  Aplicacion.use(
    "/api/auth",
    CrearRutasAutenticacion(Controladores.Autenticacion, Autenticar),
  );
  Aplicacion.use(
    "/api",
    CrearRutasPublicas(Controladores, Autenticar, AutenticarOpcional),
  );
  Aplicacion.use(
    "/api/inspecciones",
    CrearRutasInspecciones(Controladores.Inspecciones, Autenticar),
  );
  Aplicacion.use(
    "/api/caja",
    CrearRutasCaja(Controladores.Caja, Autenticar),
  );
  Aplicacion.use(
    "/api/administracion",
    CrearRutasAdministracion(Controladores.Administracion, Autenticar),
  );
  Aplicacion.use(
    "/api/inspectores",
    CrearRutasInspectores(Controladores.Administracion, Autenticar),
  );
  Aplicacion.use(
    "/api/archivos",
    CrearRutasArchivos(Contenedor.AlmacenArchivos),
  );

  // Sirve React desde el mismo servicio en producción.
  if (fs.existsSync(ArchivoCliente)) {
    Aplicacion.use(express.static(CarpetaCliente));
    Aplicacion.use((Solicitud, Respuesta, Siguiente) => {
      if (Solicitud.method !== "GET" || Solicitud.path.startsWith("/api")) {
        Siguiente();
        return;
      }
      Respuesta.sendFile(ArchivoCliente);
    });
  }

  Aplicacion.use(RutaNoEncontrada);
  Aplicacion.use(ManejarErrores);
  return Aplicacion;
}