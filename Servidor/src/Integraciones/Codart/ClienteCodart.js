import { Configuracion } from "../../Configuracion/Configuracion.js";
import { ErrorAplicacion } from "../../Dominio/ErrorAplicacion.js";
import { RucsDemostracion, DnisDemostracion } from "./DatosDemostracion.js";

function Texto(...Valores) {
  return Valores.find((Valor) => Valor !== undefined && Valor !== null && String(Valor).trim() !== "") ?? "";
}

function EstadoActivo(Valor) {
  const Estado = String(Valor ?? "ACTIVO").toUpperCase();
  return ["ACTIVO", "ACTIVA", "HABIDO", "HABILITADO", "1", "TRUE"].some((Parte) => Estado.includes(Parte));
}

function NormalizarLocal(Valor, Indice, Principal = false) {
  const Ubigeo = String(Texto(Valor.ubigeo, Valor.ubigeo_code, Valor.codigo_ubigeo, Valor.location_code));
  const Direccion = String(Texto(Valor.direccion, Valor.address, Valor.domicilio, Valor.direccion_completa, "Dirección no informada"));
  const Codigo = String(Texto(Valor.codigo, Valor.code, Valor.id, Principal ? "PRINCIPAL" : `ANEXO-${String(Indice).padStart(3, "0")}`));
  const Tipo = Principal ? "LOCAL PRINCIPAL" : String(Texto(Valor.tipo, Valor.type, "LOCAL ANEXO")).toUpperCase();
  return { Codigo, Tipo, Direccion, Ubigeo, Activo: EstadoActivo(Texto(Valor.estado, Valor.status, Valor.activo, "ACTIVO")) };
}

export class ClienteCodart {
  constructor() {
    this.Cache = new Map();
  }

  ObtenerCache(Clave) {
    const Dato = this.Cache.get(Clave);
    if (!Dato || Dato.Expira < Date.now()) return null;
    return Dato.Valor;
  }

  GuardarCache(Clave, Valor) {
    this.Cache.set(Clave, { Valor, Expira: Date.now() + 30 * 60 * 1000 });
    return Valor;
  }

  async ConsultarRuc(Ruc) {
    const Clave = `RUC:${Ruc}`;
    const Cache = this.ObtenerCache(Clave);
    if (Cache) return Cache;
    if (Configuracion.ModoDemostracion && RucsDemostracion[Ruc]) {
      return this.GuardarCache(Clave, RucsDemostracion[Ruc]);
    }
    if (!Configuracion.CodartToken) {
      throw new ErrorAplicacion("CODART no está configurado.", "CODART_NO_CONFIGURADO", 503);
    }
    const Respuesta = await this.Consultar(`${Configuracion.CodartUrl}/sunat/ruc/${Ruc}`);
    const Dato = Respuesta.result || Respuesta.data || Respuesta;
    const Colecciones = [Dato.establecimientos, Dato.locales_anexos, Dato.locales, Dato.sucursales, Dato.establishments].find(Array.isArray) || [];
    const Principal = NormalizarLocal({
      direccion: Texto(Dato.direccion, Dato.address),
      ubigeo: Texto(Dato.ubigeo, Dato.ubigeo_code),
      estado: Texto(Dato.estado, Dato.status)
    }, 0, true);
    const Locales = [Principal, ...Colecciones.map((Local, Indice) => NormalizarLocal(Local, Indice + 1, false))]
      .filter((Local, Indice, Lista) => Lista.findIndex((Otro) => Otro.Codigo === Local.Codigo && Otro.Direccion === Local.Direccion) === Indice);
    const Resultado = {
      Ruc: String(Texto(Dato.numero_documento, Dato.ruc, Ruc)),
      RazonSocial: String(Texto(Dato.razon_social, Dato.nombre_o_razon_social, Dato.name)),
      Estado: String(Texto(Dato.estado, Dato.status, "ACTIVO")),
      Condicion: String(Texto(Dato.condicion, Dato.condition, "HABIDO")),
      Locales
    };
    return this.GuardarCache(Clave, Resultado);
  }

  async ConsultarDni(Dni) {
    const Clave = `DNI:${Dni}`;
    const Cache = this.ObtenerCache(Clave);
    if (Cache) return Cache;
    if (Configuracion.ModoDemostracion && DnisDemostracion[Dni]) {
      return this.GuardarCache(Clave, DnisDemostracion[Dni]);
    }
    if (!Configuracion.CodartToken) {
      throw new ErrorAplicacion("CODART no está configurado.", "CODART_NO_CONFIGURADO", 503);
    }
    const Respuesta = await this.Consultar(`${Configuracion.CodartUrl}/reniec/dni/${Dni}`);
    const Dato = Respuesta.result || Respuesta.data || Respuesta;
    const Fecha = Texto(Dato.birth_date, Dato.fecha_nacimiento);
    const FechaValida = Fecha && !String(Fecha).toLowerCase().includes("credit") ? String(Fecha).slice(0, 10) : null;
    const Resultado = {
      Dni: String(Texto(Dato.document_number, Dato.dni, Dni)),
      NombreCompleto: String(Texto(Dato.full_name, Dato.nombre_completo, `${Texto(Dato.first_last_name)} ${Texto(Dato.second_last_name)} ${Texto(Dato.first_name)}`)).trim(),
      FechaNacimiento: FechaValida
    };
    return this.GuardarCache(Clave, Resultado);
  }

  async Consultar(Url) {
    const Control = new AbortController();
    const Temporizador = setTimeout(() => Control.abort(), 10000);
    try {
      const Respuesta = await fetch(Url, {
        headers: { Authorization: `Bearer ${Configuracion.CodartToken}`, Accept: "application/json", "Content-Type": "application/json" },
        signal: Control.signal
      });
      const Cuerpo = await Respuesta.json().catch(() => null);
      if (!Respuesta.ok || Cuerpo?.success === false) {
        throw new ErrorAplicacion(Cuerpo?.message || "CODART no pudo completar la consulta.", "ERROR_CODART", 502);
      }
      return Cuerpo;
    } catch (Error) {
      if (Error instanceof ErrorAplicacion) throw Error;
      if (Error.name === "AbortError") throw new ErrorAplicacion("CODART tardó demasiado en responder.", "TIEMPO_CODART", 504);
      throw new ErrorAplicacion("No fue posible comunicarse con CODART.", "ERROR_CODART", 502);
    } finally {
      clearTimeout(Temporizador);
    }
  }
}
