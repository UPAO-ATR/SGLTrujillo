import "dotenv/config";

function Booleano(Valor, Predeterminado = false) {
  if (Valor === undefined) return Predeterminado;
  return String(Valor).toLowerCase() === "true";
}

function Numero(Valor, Predeterminado) {
  const Resultado = Number(Valor);
  return Number.isFinite(Resultado) ? Resultado : Predeterminado;
}

function EsquemaSeguro(Valor) {
  const Texto = String(Valor || "sgl_flujo_corregido");
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(Texto)) {
    throw new Error("ESQUEMA_BASE_DATOS contiene caracteres no permitidos.");
  }
  return Texto;
}

export const Configuracion = Object.freeze({
  Entorno: process.env.NODE_ENV || "development",
  Puerto: Numero(process.env.PORT, 3000),
  UrlBaseDatos: process.env.URL_BASE_DATOS || "postgresql://postgres:postgres@localhost:5432/sgl",
  Esquema: EsquemaSeguro(process.env.ESQUEMA_BASE_DATOS),
  ClaveJwt: process.env.CLAVE_JWT || "clave-desarrollo-cambie-por-seguridad",
  DuracionJwt: process.env.DURACION_JWT || "10h",
  ModoDemostracion: Booleano(process.env.MODO_DEMOSTRACION, true),
  MontoDemostracion: Numero(process.env.MONTO_COBRO_FLUJO_CORREGIDO, 3),
  ZonaHoraria: process.env.ZONA_HORARIA || "America/Lima",
  OrigenCliente: process.env.ORIGEN_CLIENTE || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173",
  UrlPublica: process.env.RENDER_EXTERNAL_URL || process.env.URL_PUBLICA_SERVIDOR || "http://localhost:3000",
  CodartToken: process.env.CODART_TOKEN || "",
  CodartUrl: process.env.CODART_URL || "https://api-codart.cgrt.org/api/v1/consultas",
  BrevoApiKey: process.env.BREVO_API_KEY || "",
  CorreoRemitente: process.env.CORREO_REMITENTE || "",
  NombreRemitente: process.env.NOMBRE_REMITENTE || "SGL Trujillo",
  GcsNombreBucket: process.env.GCS_NOMBRE_BUCKET || "",
  GcsProyectoId: process.env.GCS_PROYECTO_ID || "",
  GcsCorreoCliente: process.env.GCS_CORREO_CLIENTE || "",
  GcsClavePrivada: (process.env.GCS_CLAVE_PRIVADA || "").replace(/\\n/g, "\n")
});

export function ValidarConfiguracion() {
  const Errores = [];
  if (!Configuracion.UrlBaseDatos) Errores.push("Falta URL_BASE_DATOS.");
  if (Configuracion.ClaveJwt.length < 16) Errores.push("CLAVE_JWT debe tener al menos 16 caracteres.");
  if (Configuracion.Entorno === "production" && Errores.length) throw new Error(Errores.join(" "));
  return Errores;
}
