// Envía correos y controla los reintentos del proveedor.

import { ConfiguracionEntorno } from "../../Configuracion/ConfiguracionEntorno.js";

export class ClienteCorreo {
  constructor(Configuracion = ConfiguracionEntorno) {
    this.Configuracion = Configuracion;
  }

  EstaConfigurado() {
    return Boolean(
      this.Configuracion.BrevoApiKey &&
        this.Configuracion.CorreoRemitente &&
        this.Configuracion.NombreRemitente,
    );
  }

  // Usa Brevo cuando existe una clave configurada.
  async Enviar(Destinatario, Asunto, Contenido) {
    if (!this.EstaConfigurado()) {
      console.log(
        `[CORREO DEMOSTRACION] ${Destinatario} | ${Asunto} | ${Contenido}`,
      );
      return { Id: "LOCAL" };
    }

    const Respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": this.Configuracion.BrevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          email: this.Configuracion.CorreoRemitente,
          name: this.Configuracion.NombreRemitente,
        },
        to: [{ email: Destinatario }],
        subject: Asunto,
        textContent: Contenido,
      }),
    });

    const Datos = await Respuesta.json().catch(() => null);
    if (!Respuesta.ok) {
      throw new Error(
        Datos?.message || "Brevo no pudo enviar el correo electrónico.",
      );
    }

    return { Id: Datos?.messageId || "BREVO" };
  }
}