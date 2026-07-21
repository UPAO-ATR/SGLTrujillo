import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Rutas from "./Rutas/Rutas.js";
import { Configuracion } from "./Configuracion/Configuracion.js";
import { ManejarErrores, RutaNoEncontrada } from "./Middleware/Errores.js";

const Aplicacion = express();
const DirectorioActual = path.dirname(fileURLToPath(import.meta.url));
const ClienteConstruido = path.resolve(DirectorioActual, "../../Cliente/dist");

Aplicacion.set("trust proxy", 1);
Aplicacion.use(helmet({ contentSecurityPolicy: false }));
Aplicacion.use(cors({ origin: Configuracion.Entorno === "production" ? true : Configuracion.OrigenCliente }));
Aplicacion.use(express.json({ limit: "2mb" }));
Aplicacion.use(express.urlencoded({ extended: true }));
Aplicacion.use("/api", rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }), Rutas);

if (Configuracion.Entorno === "production") {
  Aplicacion.use(express.static(ClienteConstruido));
  Aplicacion.get("/{*ruta}", (Req, Res) => Res.sendFile(path.join(ClienteConstruido, "index.html")));
} else {
  Aplicacion.get("/", (Req, Res) => Res.json({ Sistema: "SGL Trujillo - Flujo corregido", Api: "/api/health" }));
  Aplicacion.use(RutaNoEncontrada);
}

Aplicacion.use(ManejarErrores);
export default Aplicacion;
