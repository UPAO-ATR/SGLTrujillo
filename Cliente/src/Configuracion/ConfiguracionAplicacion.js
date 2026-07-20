// Centraliza la dirección y los datos visibles de la aplicación.

export const ConfiguracionAplicacion = Object.freeze({
  UrlApi:
    import.meta.env.VITE_URL_API ||
    (import.meta.env.DEV ? "http://localhost:3000/api" : "/api"),
  NombreCorto: "SGL Trujillo",
  NombreSistema: "Sistema de Gestión de Licencias de Funcionamiento",
  NombreEntidad: "Municipalidad Distrital de Trujillo",
  MontoOficial: 180,
  RucDemostracion: "20481234567",
  DniInspectorDemostracion: "71234567",
  DniCajeraDemostracion: "72345678",
});