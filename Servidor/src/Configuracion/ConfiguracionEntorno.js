// Lee y valida las variables de entorno del servidor.

import "dotenv/config";

function LeerBooleano(Valor, Predeterminado = false) {
  return Valor === undefined
    ? Predeterminado
    : String(Valor).toLowerCase() === "true";
}

function LeerNumero(Valor, Predeterminado) {
  const Numero = Number(Valor);
  return Number.isFinite(Numero) ? Numero : Predeterminado;
}

const UrlPublicaServidor =
  process.env.URL_PUBLICA_SERVIDOR ||
  process.env.RENDER_EXTERNAL_URL ||
  "http://localhost:3000";

export const ConfiguracionEntorno = Object.freeze({
  Entorno: process.env.NODE_ENV || "development",
  Puerto: LeerNumero(process.env.PORT || process.env.PUERTO, 3000),
  UrlBaseDatos:
    process.env.URL_BASE_DATOS ||
    "postgresql://postgres:postgres@localhost:5432/sgl",
  OrigenCliente:
    process.env.ORIGEN_CLIENTE ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://localhost:5173",
  ClaveJwt: process.env.CLAVE_JWT || "clave-solo-desarrollo-cambie-esto",
  DuracionJwt: process.env.DURACION_JWT || "8h",
  ZonaHoraria: process.env.ZONA_HORARIA || "America/Lima",
  ModoDemostracion: LeerBooleano(process.env.MODO_DEMOSTRACION, true),
  CodartToken: process.env.CODART_TOKEN || "",
  CodartUrl:
    process.env.CODART_URL || "https://api-codart.cgrt.org/api/v1/consultas",
  MercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
  MercadoPagoClaveWebhook: process.env.MERCADOPAGO_CLAVE_WEBHOOK || "",
  MercadoPagoUrlRetorno:
    process.env.MERCADOPAGO_URL_RETORNO || `${UrlPublicaServidor}/seguimiento`,
  MontoCobroDemostracion: LeerNumero(process.env.MONTO_COBRO_DEMOSTRACION, 1),
  GcsNombreBucket:
    process.env.GCS_NOMBRE_BUCKET || "sgl-trujillo-licencias-planos",
  GcsProyectoId: process.env.GCS_PROYECTO_ID || "",
  GcsCorreoCliente: process.env.GCS_CORREO_CLIENTE || "",
  GcsClavePrivada: (process.env.GCS_CLAVE_PRIVADA || "").replace(/\\n/g, "\n"),
  BrevoApiKey: process.env.BREVO_API_KEY || "",
  CorreoRemitente: process.env.CORREO_REMITENTE || "",
  NombreRemitente: process.env.NOMBRE_REMITENTE || "SGL Trujillo",
  UrlPublicaServidor,
});

export function ValidarConfiguracionMinima() {
  const Errores = [];
  if (!ConfiguracionEntorno.UrlBaseDatos) Errores.push("Falta URL_BASE_DATOS.");
  if (ConfiguracionEntorno.ClaveJwt.length < 16)
    Errores.push("CLAVE_JWT debe tener al menos 16 caracteres.");
  if (Errores.length && ConfiguracionEntorno.Entorno === "production")
    throw new Error(Errores.join(" "));
  return Errores;
}