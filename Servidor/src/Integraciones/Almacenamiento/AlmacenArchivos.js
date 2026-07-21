import fs from "node:fs/promises";
import path from "node:path";
import { Storage } from "@google-cloud/storage";
import { Configuracion } from "../../Configuracion/Configuracion.js";
import { ClaveArchivo } from "../../Utilidades/Codigos.js";

export class AlmacenArchivos {
  constructor() {
    this.Carpeta = path.resolve("Servidor", "AlmacenLocal");
    this.UsaGcs = Boolean(Configuracion.GcsNombreBucket && Configuracion.GcsProyectoId && Configuracion.GcsCorreoCliente && Configuracion.GcsClavePrivada);
    if (this.UsaGcs) {
      this.Storage = new Storage({ projectId: Configuracion.GcsProyectoId, credentials: { client_email: Configuracion.GcsCorreoCliente, private_key: Configuracion.GcsClavePrivada } });
      this.Bucket = this.Storage.bucket(Configuracion.GcsNombreBucket);
    }
  }

  async Guardar(Buffer, Nombre, Mime, Prefijo) {
    const Clave = ClaveArchivo(Prefijo, Nombre);
    if (this.UsaGcs) {
      await this.Bucket.file(Clave).save(Buffer, { contentType: Mime, resumable: false, metadata: { cacheControl: "private, max-age=0" } });
    } else {
      const Destino = path.join(this.Carpeta, Clave);
      await fs.mkdir(path.dirname(Destino), { recursive: true });
      await fs.writeFile(Destino, Buffer);
    }
    return Clave;
  }

  async Leer(Clave) {
    if (this.UsaGcs) {
      const [Buffer] = await this.Bucket.file(Clave).download();
      return Buffer;
    }
    return fs.readFile(path.join(this.Carpeta, Clave));
  }

  Estado() {
    return this.UsaGcs ? "GCS_CONFIGURADO" : "LOCAL_DEMOSTRACION";
  }
}
