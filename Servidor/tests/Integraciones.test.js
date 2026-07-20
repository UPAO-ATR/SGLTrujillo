// Comprueba el comportamiento de Integraciones.

import { afterEach, describe, expect, it, vi } from "vitest";
import { ClienteCodart } from "../src/Integraciones/Codart/ClienteCodart.js";
import { ClienteCorreo } from "../src/Integraciones/Correo/ClienteCorreo.js";

function CrearConfiguracionCodart(Cambios = {}) {
  return {
    CodartToken: "",
    CodartUrl: "https://api-codart.cgrt.org/api/v1/consultas",
    ModoDemostracion: true,
    ...Cambios,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Integración CODART", () => {
  it("usa el respaldo local cuando no existe token", async () => {
    const Cliente = new ClienteCodart(CrearConfiguracionCodart());
    const Negocio = await Cliente.ConsultarRuc("20481234567");
    expect(Negocio.Ubigeo).toBe("130101");
  });

  it("consulta CODART cuando existe token aunque el RUC tenga respaldo", async () => {
    const Consultar = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          numero_documento: "20481234567",
          razon_social: "NEGOCIO REAL DE PRUEBA",
          estado: "ACTIVO",
          condicion: "HABIDO",
          direccion: "AV. PRUEBA 123",
          ubigeo: "130101",
          distrito: "TRUJILLO",
          provincia: "TRUJILLO",
          departamento: "LA LIBERTAD",
        },
      }),
    });
    vi.stubGlobal("fetch", Consultar);

    const Cliente = new ClienteCodart(
      CrearConfiguracionCodart({ CodartToken: "token-prueba" }),
    );
    const Negocio = await Cliente.ConsultarRuc("20481234567");

    expect(Consultar).toHaveBeenCalledOnce();
    expect(Negocio.RazonSocial).toBe("NEGOCIO REAL DE PRUEBA");
  });

  it("envía el token únicamente en la cabecera del backend", async () => {
    const Consultar = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        result: {
          document_number: "71234567",
          first_name: "ANA",
          first_last_name: "PEREZ",
          second_last_name: "DIAZ",
          full_name: "ANA PEREZ DIAZ",
          birth_date: "1990-01-01",
        },
      }),
    });
    vi.stubGlobal("fetch", Consultar);

    const Cliente = new ClienteCodart(
      CrearConfiguracionCodart({ CodartToken: "token-privado" }),
    );
    await Cliente.ConsultarDni("71234567");

    const [, Opciones] = Consultar.mock.calls[0];
    expect(Opciones.headers.Authorization).toBe("Bearer token-privado");
  });
});

describe("Integración Brevo", () => {
  it("registra el correo localmente cuando Brevo no está configurado", async () => {
    const Consola = vi.spyOn(console, "log").mockImplementation(() => {});
    const Cliente = new ClienteCorreo({
      BrevoApiKey: "",
      CorreoRemitente: "",
      NombreRemitente: "SGL Trujillo",
    });

    const Resultado = await Cliente.Enviar(
      "destino@ejemplo.com",
      "Prueba",
      "Contenido",
    );

    expect(Resultado.Id).toBe("LOCAL");
    expect(Consola).toHaveBeenCalledOnce();
  });

  it("envía el correo real mediante la API de Brevo", async () => {
    const Enviar = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "mensaje-brevo" }),
    });
    vi.stubGlobal("fetch", Enviar);

    const Cliente = new ClienteCorreo({
      BrevoApiKey: "clave-brevo",
      CorreoRemitente: "remitente@ejemplo.com",
      NombreRemitente: "SGL Trujillo",
    });
    const Resultado = await Cliente.Enviar(
      "destino@ejemplo.com",
      "Inspección programada",
      "Su inspección fue programada.",
    );

    expect(Resultado.Id).toBe("mensaje-brevo");
    expect(Enviar).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({ method: "POST" }),
    );
  });
});