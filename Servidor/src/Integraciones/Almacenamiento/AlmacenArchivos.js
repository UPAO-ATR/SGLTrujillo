// Guarda archivos privados y genera enlaces temporales de descarga.

import fs from "node:fs/promises";
import path from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { ConfiguracionEntorno } from "../../Configuracion/ConfiguracionEntorno.js";
import { ErrorAplicacion } from "../../Dominio/Errores.js";
export class AlmacenArchivos {
  constructor(C = ConfiguracionEntorno) {
    this.C = C;
    this.Carpeta = path.resolve("AlmacenLocal");
    this.Storage =
      C.GcsProyectoId && C.GcsCorreoCliente && C.GcsClavePrivada
        ? new Storage({
            projectId: C.GcsProyectoId,
            credentials: {
              client_email: C.GcsCorreoCliente,
              private_key: C.GcsClavePrivada,
            },
          })
        : null;
    this.Bucket = this.Storage?.bucket(C.GcsNombreBucket);
  }
  // Distingue el almacenamiento real del modo demostración.
  UsaGoogleCloud() {
    return Boolean(this.Bucket);
  }
  // Reintenta operaciones temporales antes de informar el error.
  async EjecutarConReintentos(Operacion, Intentos = 3) {
    let UltimoError;
    for (let Intento = 1; Intento <= Intentos; Intento += 1) {
      try {
        return await Operacion();
      } catch (Error) {
        UltimoError = Error;
        if (Intento < Intentos)
          await new Promise((Resolver) => setTimeout(Resolver, Intento * 500));
      }
    }
    throw UltimoError;
  }
  // Mantiene los archivos privados al guardarlos.
  async Subir(Buffer, Ruta, Tipo) {
    if (this.Bucket) {
      await this.EjecutarConReintentos(() =>
        this.Bucket.file(Ruta).save(Buffer, {
          contentType: Tipo,
          resumable: false,
          metadata: { cacheControl: "private,no-store" },
        }),
      );
      return Ruta;
    }
    const Completa = path.join(this.Carpeta, Ruta);
    await fs.mkdir(path.dirname(Completa), { recursive: true });
    await fs.writeFile(Completa, Buffer);
    return Ruta;
  }
  async Leer(Ruta) {
    if (this.Bucket) {
      const [BufferArchivo] = await this.EjecutarConReintentos(() =>
        this.Bucket.file(Ruta).download(),
      );
      return BufferArchivo;
    }
    try {
      return await fs.readFile(path.join(this.Carpeta, Ruta));
    } catch {
      throw new ErrorAplicacion(
        "El archivo solicitado no está disponible.",
        "ARCHIVO_NO_DISPONIBLE",
        404,
      );
    }
  }
  // Crea un enlace que deja de funcionar después del plazo.
  async GenerarUrlTemporal(Ruta, Minutos = 15) {
    if (this.Bucket) {
      const [Url] = await this.EjecutarConReintentos(() =>
        this.Bucket.file(Ruta).getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + Minutos * 60000,
        }),
      );
      return Url;
    }
    const Expira = Date.now() + Minutos * 60000,
      Contenido = `${Ruta}|${Expira}`,
      Firma = createHmac("sha256", this.C.ClaveJwt)
        .update(Contenido)
        .digest("hex"),
      Token = Buffer.from(`${Contenido}|${Firma}`).toString("base64url");
    return `${this.C.UrlPublicaServidor}/api/archivos/local/${Token}`;
  }
  // Copia los archivos del modo local dentro del respaldo.
  async RespaldarArchivos(Identificador, CarpetaRespaldo) {
    if (this.Bucket) {
      const [Archivos] = await this.Bucket.getFiles();
      const Copiados = [];
      for (const Archivo of Archivos) {
        if (Archivo.name.startsWith("respaldos/")) continue;
        const Destino = `respaldos/${Identificador}/${Archivo.name}`;
        await this.EjecutarConReintentos(() =>
          Archivo.copy(this.Bucket.file(Destino)),
        );
        Copiados.push(Destino);
      }
      return Copiados;
    }

    const Destino = path.join(CarpetaRespaldo, "Archivos");
    try {
      await fs.cp(this.Carpeta, Destino, { recursive: true });
      return [Destino];
    } catch (Error) {
      if (Error.code === "ENOENT") return [];
      throw Error;
    }
  }

  ValidarTokenLocal(Token) {
    try {
      const [Ruta, Expira, Firma] = Buffer.from(Token, "base64url")
        .toString()
        .split("|");
      if (Date.now() > Number(Expira)) return null;
      const Esperada = createHmac("sha256", this.C.ClaveJwt)
        .update(`${Ruta}|${Expira}`)
        .digest("hex");
      if (!timingSafeEqual(Buffer.from(Firma), Buffer.from(Esperada)))
        return null;
      return Ruta;
    } catch {
      return null;
    }
  }
}