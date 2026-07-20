// Genera la constancia de pago en formato PDF.

import PDFDocument from "pdfkit";

// Escribe los datos principales de la constancia de pago.
export function GenerarBoletaPdf(Datos) {
  return new Promise((Resolver, Rechazar) => {
    const Documento = new PDFDocument({ size: "A4", margin: 50 });
    const Partes = [];

    Documento.on("data", (Parte) => Partes.push(Parte));
    Documento.on("end", () => Resolver(Buffer.concat(Partes)));
    Documento.on("error", Rechazar);

    Documento.fontSize(12).text("Municipalidad Distrital de Trujillo", {
      align: "center",
    });
    Documento.fontSize(16).text(
      "Sistema de Gestión de Licencias de Funcionamiento",
      { align: "center" },
    );
    Documento.moveDown(0.7);
    Documento.fontSize(18).text("CONSTANCIA DE PAGO DEL TRÁMITE", {
      align: "center",
    });
    Documento.moveDown();

    const Campos = [
      ["Número de constancia", Datos.NumeroBoleta],
      ["Fecha de emisión", Datos.FechaEmision],
      ["RUC", Datos.Ruc],
      ["Razón social", Datos.RazonSocial],
      ["Domicilio fiscal", Datos.DomicilioFiscal],
      ["Tipo de solicitud", Datos.TipoSolicitud],
      ["Medio de pago", Datos.MedioPago],
      ["Importe oficial", `S/ ${Number(Datos.MontoOficial).toFixed(2)}`],
      [
        "Importe cobrado en prueba",
        `S/ ${Number(Datos.MontoCobrado).toFixed(2)}`,
      ],
      ["Código de pago", Datos.CodigoPago],
      ["Código de inspección", Datos.CodigoInspeccion],
    ];

    for (const [Etiqueta, Valor] of Campos) {
      Documento.font("Helvetica-Bold").text(`${Etiqueta}:`, {
        continued: true,
      });
      Documento.font("Helvetica").text(` ${Valor ?? ""}`);
      Documento.moveDown(0.4);
    }

    Documento.moveDown();
    Documento.fontSize(10).text(
      "Documento demostrativo. No constituye comprobante tributario electrónico.",
      { align: "center" },
    );
    Documento.end();
  });
}