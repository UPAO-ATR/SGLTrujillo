import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("QR fijo y simulador D", () => {
  it("mantiene bloqueado el pago hasta simularlo", () => {
    const Ruta = path.resolve(process.cwd(), "src/Paginas/PaginaCajero.jsx");
    const Codigo = fs.readFileSync(Ruta, "utf8");

    expect(Codigo).toContain('src="/QRYapeSGL.png"');
    expect(Codigo).toContain("function SimuladorPago");
    expect(Codigo).toContain("!PagoSimulado");
    expect(Codigo).toContain("maxLength={8}");
    expect(Codigo).toContain('replace(/\\D/g, "").slice(0, 8)');
    expect(Codigo).toContain('onClick={AbrirSimulador}>D</Boton>');
    expect(Codigo).toContain('typeof window === "undefined"');
    expect(Codigo).not.toContain("QRCode.toDataURL");
  });
});
