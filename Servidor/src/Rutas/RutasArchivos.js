// Define las rutas privadas para descargar archivos.

import { Router } from "express";
import { ErrorNoAutorizado } from "../Dominio/Errores.js";
export function CrearRutasArchivos(Almacen) {
  const R = Router();
  R.get("/local/:token", async (S, Resp) => {
    const Ruta = Almacen.ValidarTokenLocal(S.params.token);
    if (!Ruta)
      throw new ErrorNoAutorizado(
        "El enlace de descarga es inválido o venció.",
      );
    Resp.setHeader("Content-Type", "application/octet-stream");
    Resp.send(await Almacen.Leer(Ruta));
  });
  return R;
}