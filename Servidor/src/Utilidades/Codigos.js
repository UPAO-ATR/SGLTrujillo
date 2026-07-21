import crypto from "node:crypto";

export function CodigoTramite() {
  const Fecha = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `SGL-${Fecha}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function NumeroLicencia(Id) {
  const Fecha = new Date().toISOString().slice(0, 4);
  return `LF-${Fecha}-${String(Id).padStart(6, "0")}`;
}

export function ClaveArchivo(Prefijo, Nombre = "archivo") {
  const Limpio = Nombre.replace(/[^a-zA-Z0-9.]/g, "-");
  return `${Prefijo}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${Limpio}`;
}
