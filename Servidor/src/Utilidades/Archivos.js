// Valida el contenido real de los archivos recibidos.

// Comprueba el contenido real y no solo la extensión.
export function DetectarTipoArchivo(BufferArchivo) {
  if (!BufferArchivo?.length) return null;
  if (BufferArchivo.subarray(0, 5).toString() === "%PDF-")
    return "application/pdf";
  if (
    BufferArchivo[0] === 0xff &&
    BufferArchivo[1] === 0xd8 &&
    BufferArchivo[2] === 0xff
  )
    return "image/jpeg";
  const FirmaPng = "89504e470d0a1a0a";
  if (BufferArchivo.subarray(0, 8).toString("hex") === FirmaPng)
    return "image/png";
  return null;
}
export function LimpiarNombreArchivo(Nombre) {
  return (
    String(Nombre || "archivo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.]/g, "")
      .slice(0, 100) || "archivo"
  );
}