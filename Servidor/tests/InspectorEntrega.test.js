import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/BaseDatos/Conexion.js", () => ({
  Consultar: vi.fn(),
  Transaccion: vi.fn(),
  Uno: vi.fn()
}));

import { Consultar } from "../src/BaseDatos/Conexion.js";
import { ServicioInspecciones } from "../src/Servicios/ServicioInspecciones.js";

describe("entrega de inspecciones al inspector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reasigna incluso inspecciones sin inspector y luego las muestra", async () => {
    const Tiempo = {
      ProcesarEventos: vi.fn().mockResolvedValue({}),
      ObtenerFecha: vi.fn().mockResolvedValue("2026-08-13")
    };

    Consultar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 91 }] })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id: 91,
          numero: 1,
          fecha_programada: "2026-08-13",
          ruc: "20354619734"
        }]
      });

    const Servicio = new ServicioInspecciones({
      Tiempo,
      Programacion: {},
      Almacen: {}
    });

    const Resultado = await Servicio.Hoy(3);

    expect(Tiempo.ProcesarEventos).toHaveBeenCalledTimes(1);
    expect(Tiempo.ObtenerFecha).toHaveBeenCalledTimes(1);

    expect(Consultar).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("inspector_id IS DISTINCT FROM $1"),
      [3, "2026-08-13"]
    );

    expect(Consultar).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("WHERE i.inspector_id=$1"),
      [3, "2026-08-13"]
    );

    expect(Resultado.Fecha).toBe("2026-08-13");
    expect(Resultado.Inspecciones).toHaveLength(1);
  });
});