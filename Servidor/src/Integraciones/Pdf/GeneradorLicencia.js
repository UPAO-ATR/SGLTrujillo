// Genera la licencia PDF y su marca de agua de vencimiento.

import PDFDocument from "pdfkit";
import { PDFDocument as PdfLib, rgb, degrees } from "pdf-lib";
import { fileURLToPath } from "node:url";

const RutaPlantilla = fileURLToPath(
  new URL("../../../Recursos/IMAGEN_LICENCIA.jpeg", import.meta.url),
);

// Superpone los datos sobre la plantilla institucional.
export function GenerarLicenciaPdf(Datos) {
  return new Promise((Resolver, Rechazar) => {
    const Documento = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
    });
    const Partes = [];

    Documento.on("data", (Parte) => Partes.push(Parte));
    Documento.on("end", () => Resolver(Buffer.concat(Partes)));
    Documento.on("error", Rechazar);

    // La plantilla oficial funciona como fondo y los datos se superponen.
    Documento.image(RutaPlantilla, 0, 0, {
      width: Documento.page.width,
      height: Documento.page.height,
    });

    Documento.fillColor("#17365d")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("MUNICIPALIDAD DISTRITAL DE TRUJILLO", 90, 82, {
        width: Documento.page.width - 180,
        align: "center",
      });

    Documento.fillColor("#17365d")
      .font("Helvetica-Bold")
      .fontSize(23)
      .text("LICENCIA DE FUNCIONAMIENTO", 90, 105, {
        width: Documento.page.width - 180,
        align: "center",
      });

    Documento.fontSize(16).text(Datos.NumeroLicencia, 90, 145, {
      width: Documento.page.width - 180,
      align: "center",
    });

    const Campos = [
      ["Razón social", Datos.RazonSocial],
      ["RUC", Datos.Ruc],
      ["Domicilio fiscal", Datos.DomicilioFiscal],
      ["Ubigeo", Datos.Ubigeo],
      ["Expediente", Datos.Expediente],
      ["Fecha de generación", Datos.FechaGeneracion],
      ["Válida hasta", Datos.FechaVencimiento],
    ];

    let PosicionVertical = 215;
    for (const [Etiqueta, Valor] of Campos) {
      Documento.fillColor("#17365d")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`${Etiqueta}:`, 115, PosicionVertical, {
          width: 170,
        });
      Documento.fillColor("#111827")
        .font("Helvetica")
        .fontSize(12)
        .text(String(Valor || ""), 285, PosicionVertical, {
          width: 435,
          height: 42,
        });
      PosicionVertical += Etiqueta === "Domicilio fiscal" ? 58 : 43;
    }

    Documento.end();
  });
}

// Añade una marca visible sin reemplazar el PDF original.
export async function AplicarMarcaAguaVencida(BufferPdf) {
  const Documento = await PdfLib.load(BufferPdf);
  for (const Pagina of Documento.getPages()) {
    const { width, height } = Pagina.getSize();
    Pagina.drawText("LICENCIA VENCIDA", {
      x: width * 0.18,
      y: height * 0.45,
      size: 54,
      color: rgb(0.75, 0.1, 0.1),
      opacity: 0.35,
      rotate: degrees(30),
    });
  }
  return Buffer.from(await Documento.save());
}