import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("confirmacion manual de pagos", () => {
  it("separa la confirmacion del formulario de solicitud", () => {
    const Ruta = path.resolve(process.cwd(), "src/Paginas/PaginaCajero.jsx");
    const Codigo = fs.readFileSync(Ruta, "utf8");

    expect(Codigo).toContain('DefinirPestana("pagos")');
    expect(Codigo).toContain("function ConfirmacionPagos");
    expect(Codigo).toContain('Item.estado === "PENDIENTE_PAGO"');
    expect(Codigo).toContain("Pago verificado: continuar tr");
    expect(Codigo).not.toMatch(/Tramite && !ResultadoPago[\s\S]{0,300}<PagoDemostrativo/);
  });
});
