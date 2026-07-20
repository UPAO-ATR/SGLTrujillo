// Crea respaldos verificables de datos y archivos.

import fs from "node:fs/promises";
import path from "node:path";

const TablasRespaldadas = [
  "configuraciones",
  "usuarios",
  "negocios",
  "solicitudes",
  "pagos",
  "boletas",
  "feriados",
  "inspecciones",
  "licencias",
  "cajas",
  "transacciones_caja",
  "sangrias",
  "notificaciones",
  "alertas_administracion",
  "auditorias",
];

export class ServicioRespaldos {
  constructor(BaseDatos, AlmacenArchivos) {
    this.BaseDatos = BaseDatos;
    this.AlmacenArchivos = AlmacenArchivos;
  }

  // Guarda una copia identificada y registra su verificación.
  async CrearRespaldo() {
    const Identificador = new Date().toISOString().replace(/[:.]/g, "");
    const Respaldo = {
      Fecha: new Date().toISOString(),
      Tablas: {},
    };

    for (const Tabla of TablasRespaldadas) {
      const Resultado = await this.BaseDatos.query(`SELECT * FROM ${Tabla}`);
      Respaldo.Tablas[Tabla] = Resultado.rows;
    }

    const Carpeta = path.resolve("Respaldos", Identificador);
    await fs.mkdir(Carpeta, { recursive: true });
    const ArchivoBaseDatos = path.join(Carpeta, "BaseDatos.json");
    const ContenidoBaseDatos = JSON.stringify(Respaldo, null, 2);
    await fs.writeFile(ArchivoBaseDatos, ContenidoBaseDatos, "utf8");

    let RutaBaseDatosRespaldada = ArchivoBaseDatos;
    if (this.AlmacenArchivos.UsaGoogleCloud()) {
      // El respaldo de la base de datos debe sobrevivir al disco temporal de Render.
      RutaBaseDatosRespaldada = await this.AlmacenArchivos.Subir(
        Buffer.from(ContenidoBaseDatos, "utf8"),
        `respaldos/${Identificador}/BaseDatos.json`,
        "application/json",
      );
    }

    const Archivos = await this.AlmacenArchivos.RespaldarArchivos(
      Identificador,
      Carpeta,
    );

    return {
      Identificador,
      ArchivoBaseDatos: RutaBaseDatosRespaldada,
      Archivos,
      Fecha: Respaldo.Fecha,
    };
  }
}