// Valida los campos antes de enviarlos al servidor.

export function LimpiarRuc(Valor) {
  return String(Valor || "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

// Comprueba la longitud y el contenido numérico del RUC.
export function EsRucValido(Valor) {
  return /^\d{11}$/.test(String(Valor || ""));
}

export function LimpiarDni(Valor) {
  return String(Valor || "")
    .replace(/\D/g, "")
    .slice(0, 8);
}

// Comprueba la longitud y el contenido numérico del DNI.
export function EsDniValido(Valor) {
  return /^\d{8}$/.test(String(Valor || ""));
}

// Comprueba el formato antes de consultar el servidor.
export function EsCorreoValido(Valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(Valor || "").trim());
}

export function EsArchivoPermitidoCiudadano(Archivo) {
  if (!Archivo) return false;
  return (
    Archivo.type === "application/pdf" ||
    String(Archivo.name || "")
      .toLowerCase()
      .endsWith(".pdf")
  );
}

export function EsArchivoPermitidoCajera(Archivo) {
  if (!Archivo) return false;
  const Nombre = String(Archivo.name || "").toLowerCase();
  return (
    ["application/pdf", "image/jpeg", "image/png"].includes(Archivo.type) ||
    [".pdf", ".jpg", ".jpeg", ".png"].some((Extension) =>
      Nombre.endsWith(Extension),
    )
  );
}