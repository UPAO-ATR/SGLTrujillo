import { Configuracion } from "../../Configuracion/Configuracion.js";

function EscaparHtml(Valor) {
  return String(Valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class ClienteCorreo {
  Configurado() {
    return Boolean(Configuracion.BrevoApiKey && Configuracion.CorreoRemitente);
  }

  Estado() {
    return this.Configurado() ? "BREVO_CONFIGURADO" : "REGISTRO_LOCAL";
  }

  async Enviar(Destino, Asunto, Mensaje) {
    if (!this.Configurado()) {
      console.log(`[CORREO LOCAL] Para: ${Destino} | ${Asunto} | ${Mensaje}`);
      return { Modo: "REGISTRO_LOCAL" };
    }
    const Respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": Configuracion.BrevoApiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { email: Configuracion.CorreoRemitente, name: Configuracion.NombreRemitente },
        to: [{ email: Destino }],
        subject: Asunto,
        htmlContent: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>SGL Trujillo</h2><p>${EscaparHtml(Mensaje)}</p></div>`,
        textContent: Mensaje
      })
    });
    if (!Respuesta.ok) {
      const Cuerpo = await Respuesta.text();
      throw new Error(`Brevo rechazó el correo: ${Cuerpo}`);
    }
    return { Modo: "BREVO" };
  }
}
