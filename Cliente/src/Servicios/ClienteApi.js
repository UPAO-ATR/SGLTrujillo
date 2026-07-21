const Base = "/api";

export async function Solicitar(Ruta, Opciones = {}) {
  const Token = localStorage.getItem("SglToken");
  const Encabezados = new Headers(Opciones.headers || {});
  if (Token) Encabezados.set("Authorization", `Bearer ${Token}`);
  if (Opciones.body && !(Opciones.body instanceof FormData)) Encabezados.set("Content-Type", "application/json");
  const Respuesta = await fetch(`${Base}${Ruta}`, { ...Opciones, headers: Encabezados });
  const Tipo = Respuesta.headers.get("content-type") || "";
  if (!Respuesta.ok) {
    const Cuerpo = Tipo.includes("application/json") ? await Respuesta.json() : {};
    const ErrorApi = new Error(Cuerpo.Mensaje || "No se pudo completar la operación.");
    ErrorApi.Codigo = Cuerpo.Codigo || "ERROR_API";
    ErrorApi.EstadoHttp = Respuesta.status;
    throw ErrorApi;
  }
  if (Tipo.includes("application/json")) return Respuesta.json();
  return Respuesta.blob();
}

export const Api = {
  Get: (Ruta) => Solicitar(Ruta),
  Post: (Ruta, Datos) => Solicitar(Ruta, { method: "POST", body: Datos instanceof FormData ? Datos : JSON.stringify(Datos || {}) }),
  Put: (Ruta, Datos) => Solicitar(Ruta, { method: "PUT", body: JSON.stringify(Datos || {}) }),
  Delete: (Ruta) => Solicitar(Ruta, { method: "DELETE" })
};

export async function AbrirArchivoProtegido(Ruta) {
  const Blob = await Solicitar(Ruta);
  window.open(URL.createObjectURL(Blob), "_blank", "noopener,noreferrer");
}
