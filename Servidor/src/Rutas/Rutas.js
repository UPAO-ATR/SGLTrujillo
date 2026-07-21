import { Router } from "express";
import multer from "multer";
import { Uno } from "../BaseDatos/Conexion.js";
import { IniciarSesion } from "../Servicios/ServicioAutenticacion.js";
import { Autenticar, Autorizar } from "../Middleware/Autenticacion.js";
import { Contenedor } from "../Contenedor.js";
import { Configuracion } from "../Configuracion/Configuracion.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";

const Subida = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const Ruta = Router();
const Async = (Funcion) => (Req, Res, Next) => Promise.resolve(Funcion(Req, Res, Next)).catch(Next);
const IdUsuario = (Req) => Number(Req.Usuario.Id);

Ruta.get("/health", Async(async (Req, Res) => {
  await Uno("SELECT 1 valor");
  Res.json({
    Exito: true,
    Estado: "OPERATIVO",
    Sistema: "SGL Trujillo - Flujo corregido",
    BaseDatos: true,
    Esquema: Configuracion.Esquema,
    Codart: Configuracion.CodartToken ? "CONFIGURADO" : "DEMOSTRACION",
    Correo: Configuracion.BrevoApiKey && Configuracion.CorreoRemitente ? "BREVO_CONFIGURADO" : "REGISTRO_LOCAL",
    Almacenamiento: Contenedor.Almacen.Estado(),
    Pago: "HIBRIDO_DEMOSTRATIVO"
  });
}));

Ruta.post("/auth/login", Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await IniciarSesion(Req.body.correo, Req.body.clave)) });
}));

Ruta.get("/tiempo", Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Tiempo.Estado()) });
}));
Ruta.put("/tiempo", Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Tiempo.CambiarFecha(Req.body.fecha)) });
}));

Ruta.get("/publico/seguimiento/:ruc", Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Tramites.Seguimiento(Req.params.ruc)) });
}));
Ruta.get("/publico/licencias/:id/:ruc", Async(async (Req, Res) => {
  const Pdf = await Contenedor.Tramites.DescargarLicencia(Number(Req.params.id), Req.params.ruc);
  Res.type("application/pdf").set("Content-Disposition", "inline; filename=Licencia-SGL.pdf").send(Pdf);
}));

Ruta.use(Autenticar);

Ruta.get("/caja/actual", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Caja.Actual(IdUsuario(Req))) });
}));
Ruta.post("/caja/apertura", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.status(201).json({ Exito: true, Solicitud: await Contenedor.Caja.SolicitarApertura(IdUsuario(Req)) });
}));
Ruta.post("/caja/inyeccion", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.status(201).json({ Exito: true, Solicitud: await Contenedor.Caja.SolicitarInyeccion(IdUsuario(Req), Number(Req.body.monto)) });
}));
Ruta.post("/caja/cierre", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.status(201).json({ Exito: true, Solicitud: await Contenedor.Caja.SolicitarCierre(IdUsuario(Req), Number(Req.body.montoContado)) });
}));

Ruta.get("/cajero/ruc/:ruc", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Datos: await Contenedor.Tramites.ConsultarRuc(Req.params.ruc) });
}));
Ruta.post("/cajero/dni", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Datos: await Contenedor.Tramites.ConsultarDni(String(Req.body.dni || ""), Req.body.fechaNacimiento || null) });
}));
Ruta.post("/cajero/solicitudes", Autorizar("CAJERO"), Subida.single("plano"), Async(async (Req, Res) => {
  Res.status(201).json({ Exito: true, ...(await Contenedor.Tramites.CrearSolicitud(IdUsuario(Req), Req.body, Req.file)) });
}));
Ruta.post("/cajero/solicitudes/:id/pago", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Tramites.PagarSolicitud(IdUsuario(Req), Number(Req.params.id), Req.body)) });
}));
Ruta.get("/cajero/renovaciones/:ruc", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Licencias: await Contenedor.Tramites.BuscarRenovaciones(Req.params.ruc) });
}));
Ruta.post("/cajero/renovaciones/:id", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Tramites.Renovar(IdUsuario(Req), Number(Req.params.id), Req.body)) });
}));
Ruta.get("/cajero/historial", Autorizar("CAJERO"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Tramites: await Contenedor.Tramites.HistorialCajero(IdUsuario(Req)) });
}));
Ruta.get("/cajero/comprobantes/:id", Autorizar("CAJERO"), Async(async (Req, Res) => {
  const Dato = await Uno("SELECT comprobante_clave,codigo,tipo FROM tramites WHERE id=$1 AND cajero_id=$2", [Number(Req.params.id), IdUsuario(Req)]);
  if (!Dato?.comprobante_clave) throw new ErrorAplicacion("El comprobante no está disponible.", "COMPROBANTE_NO_DISPONIBLE", 404);
  const Archivo = await Contenedor.Almacen.Leer(Dato.comprobante_clave);
  Res.type("application/pdf").set("Content-Disposition", `inline; filename=${Dato.tipo}-${Dato.codigo}.pdf`).send(Archivo);
}));

Ruta.get("/inspector/hoy", Autorizar("INSPECTOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Inspecciones.Hoy(IdUsuario(Req))) });
}));
Ruta.get("/inspector/inspecciones/:id", Autorizar("INSPECTOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Inspeccion: await Contenedor.Inspecciones.Detalle(IdUsuario(Req), Number(Req.params.id)) });
}));
Ruta.get("/inspector/inspecciones/:id/plano", Autorizar("INSPECTOR"), Async(async (Req, Res) => {
  const Archivo = await Contenedor.Inspecciones.DescargarPlano(IdUsuario(Req), Number(Req.params.id));
  Res.type("application/pdf").set("Content-Disposition", "inline; filename=Plano.pdf").send(Archivo);
}));
Ruta.post("/inspector/inspecciones/:id/aprobar", Autorizar("INSPECTOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Inspecciones.Aprobar(IdUsuario(Req), Number(Req.params.id))) });
}));
Ruta.post("/inspector/inspecciones/:id/observar", Autorizar("INSPECTOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Inspecciones.Observar(IdUsuario(Req), Number(Req.params.id), Req.body.observaciones)) });
}));

Ruta.get("/administrador/resumen", Autorizar("ADMINISTRADOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Administracion.Resumen()) });
}));
Ruta.post("/administrador/solicitudes-caja/:id", Autorizar("ADMINISTRADOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Resultado: await Contenedor.Administracion.ResolverSolicitud(IdUsuario(Req), Number(Req.params.id), Boolean(Req.body.aprobar), Req.body.monto) });
}));
Ruta.post("/administrador/cajeros", Autorizar("ADMINISTRADOR"), Async(async (Req, Res) => {
  Res.status(201).json({ Exito: true, Cajero: await Contenedor.Administracion.CrearCajero(IdUsuario(Req), Req.body) });
}));
Ruta.delete("/administrador/cajeros/:id", Autorizar("ADMINISTRADOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Administracion.QuitarCajero(IdUsuario(Req), Number(Req.params.id))) });
}));
Ruta.put("/administrador/inspector", Autorizar("ADMINISTRADOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Inspector: await Contenedor.Administracion.ModificarInspector(IdUsuario(Req), Req.body) });
}));
Ruta.put("/administrador/alertas/:id", Autorizar("ADMINISTRADOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, ...(await Contenedor.Administracion.MarcarAlerta(Number(Req.params.id))) });
}));

Ruta.get("/superadministrador/administrador", Autorizar("SUPERADMINISTRADOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Administrador: await Contenedor.SuperAdministracion.ObtenerAdministrador() });
}));
Ruta.put("/superadministrador/administrador", Autorizar("SUPERADMINISTRADOR"), Async(async (Req, Res) => {
  Res.json({ Exito: true, Administrador: await Contenedor.SuperAdministracion.Modificar(IdUsuario(Req), Req.body) });
}));

export default Ruta;
