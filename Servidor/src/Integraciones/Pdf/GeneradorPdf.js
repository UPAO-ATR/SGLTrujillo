import PDFDocument from "pdfkit";

function CrearDocumento(Trabajo) {
  return new Promise((Resolver, Rechazar) => {
    const Documento = new PDFDocument({ size: "A4", margin: 52 });
    const Partes = [];
    Documento.on("data", (Parte) => Partes.push(Parte));
    Documento.on("end", () => Resolver(Buffer.concat(Partes)));
    Documento.on("error", Rechazar);
    Trabajo(Documento);
    Documento.end();
  });
}

function Cabecera(Documento, Titulo) {
  Documento.fontSize(18).text("MUNICIPALIDAD DISTRITAL DE TRUJILLO", { align: "center" });
  Documento.moveDown(0.4).fontSize(14).text("Sistema de Gestión de Licencias de Funcionamiento", { align: "center" });
  Documento.moveDown().fontSize(16).text(Titulo, { align: "center" });
  Documento.moveDown();
}

function Fila(Documento, Etiqueta, Valor) {
  Documento.font("Helvetica-Bold").text(`${Etiqueta}: `, { continued: true });
  Documento.font("Helvetica").text(String(Valor ?? "-"));
}

export async function GenerarComprobante(Datos) {
  return CrearDocumento((Documento) => {
    Cabecera(Documento, Datos.Tipo === "SOLICITUD" ? "FACTURA DEMOSTRATIVA" : "BOLETA DEMOSTRATIVA");
    Fila(Documento, "Código", Datos.Codigo);
    Fila(Documento, "Fecha", Datos.Fecha);
    Fila(Documento, "RUC", Datos.Ruc);
    Fila(Documento, "Razón social", Datos.RazonSocial);
    Fila(Documento, "DNI del solicitante", Datos.Dni);
    Fila(Documento, "Local", Datos.Direccion);
    Documento.moveDown();
    Fila(Documento, "Tasa oficial", `S/ ${Number(Datos.MontoOficial).toFixed(2)}`);
    Fila(Documento, "Monto demostrativo", `S/ ${Number(Datos.Total).toFixed(2)}`);
    Fila(Documento, "Efectivo", `S/ ${Number(Datos.Efectivo).toFixed(2)}`);
    Fila(Documento, "Yape/Plin", `S/ ${Number(Datos.Digital).toFixed(2)}`);
    Fila(Documento, "Operación digital", Datos.Operacion || "No aplica");
    Documento.moveDown(2).fontSize(10).text("Documento académico demostrativo. No constituye un comprobante electrónico autorizado por SUNAT.", { align: "center" });
  });
}

export async function GenerarLicencia(Datos, Vencida = false) {
  return CrearDocumento((Documento) => {
    Cabecera(Documento, "LICENCIA DE FUNCIONAMIENTO");
    Documento.rect(48, 145, 499, 430).stroke();
    Documento.moveDown();
    Fila(Documento, "Número de licencia", Datos.NumeroLicencia);
    Fila(Documento, "RUC", Datos.Ruc);
    Fila(Documento, "Razón social", Datos.RazonSocial);
    Fila(Documento, "Dirección autorizada", Datos.Direccion);
    Fila(Documento, "Ubigeo", Datos.Ubigeo);
    Fila(Documento, "Fecha de aprobación", Datos.FechaAprobacion);
    Fila(Documento, "Fecha de vencimiento", Datos.FechaVencimiento);
    Documento.moveDown(3).fontSize(11).text("La presente licencia corresponde al local identificado y fue generada dentro del sistema académico SGL Trujillo.", { align: "justify" });
    if (Vencida) {
      Documento.save();
      Documento.rotate(-35, { origin: [300, 430] });
      Documento.fillColor("red").opacity(0.25).fontSize(72).text("VENCIDA", 80, 370, { width: 440, align: "center" });
      Documento.restore();
    }
  });
}
