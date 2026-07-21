import { fileTypeFromBuffer } from "file-type";
import { Configuracion } from "../Configuracion/Configuracion.js";
import { Consultar, Transaccion, Uno } from "../BaseDatos/Conexion.js";
import { EstadosTramite } from "../Dominio/Constantes.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";
import { CodigoTramite, NumeroLicencia } from "../Utilidades/Codigos.js";
import { CalcularEdad, FormatearFecha } from "../Utilidades/Fechas.js";
import { GenerarComprobante, GenerarLicencia } from "../Integraciones/Pdf/GeneradorPdf.js";
import { Auditar } from "./ServicioAuditoria.js";

function Numero(Valor) {
  const Resultado = Number(Valor);
  return Number.isFinite(Resultado) ? Math.round(Resultado * 100) / 100 : 0;
}

export class ServicioTramites {
  constructor({ Codart, Almacen, Tiempo, Caja, Programacion }) {
    this.Codart = Codart;
    this.Almacen = Almacen;
    this.Tiempo = Tiempo;
    this.Caja = Caja;
    this.Programacion = Programacion;
  }

  async ConsultarRuc(Ruc) {
    if (!/^20\d{9}$/.test(Ruc)) {
      throw new ErrorAplicacion(
        "El RUC debe tener 11 dígitos y comenzar con 20.",
        "RUC_INVALIDO"
      );
    }
    const Datos = await this.Codart.ConsultarRuc(Ruc);
    if (!String(Datos.Estado).toUpperCase().includes("ACTIV")) {
      throw new ErrorAplicacion(
        "El RUC no se encuentra activo.",
        "RUC_INACTIVO"
      );
    }
    const Locales = (Datos.Locales || []).filter(
      (Local) => Local.Activo && Local.Ubigeo === "130101"
    );
    if (!Locales.length) {
      throw new ErrorAplicacion(
        "No hay locales operativos en Trujillo.",
        "SIN_LOCALES_TRUJILLO",
        422
      );
    }
    return {
      ...Datos,
      Locales,
      SeleccionAutomatica: Locales.length === 1 ? Locales[0].Codigo : null
    };
  }

  async ConsultarDni(Dni, FechaNacimientoComplementaria = null) {
    if (!/^\d{8}$/.test(Dni)) {
      throw new ErrorAplicacion(
        "El DNI debe tener 8 dígitos.",
        "DNI_INVALIDO"
      );
    }
    const Datos = await this.Codart.ConsultarDni(Dni);
    const FechaActual = await this.Tiempo.ObtenerFecha();
    const FechaNacimiento =
      Datos.FechaNacimiento || FechaNacimientoComplementaria;
    const Edad = FechaNacimiento
      ? CalcularEdad(FechaNacimiento, FechaActual)
      : null;
    if (Edad !== null && Edad < 18) {
      throw new ErrorAplicacion(
        "El titular del DNI debe ser mayor de edad.",
        "MENOR_EDAD",
        422
      );
    }
    return {
      ...Datos,
      FechaNacimiento,
      Edad,
      RequiereFechaNacimiento: !FechaNacimiento
    };
  }

  async ValidarPlano(Archivo) {
    if (!Archivo?.buffer) {
      throw new ErrorAplicacion(
        "Debes adjuntar el plano del negocio en PDF.",
        "PLANO_REQUERIDO"
      );
    }
    const Tipo = await fileTypeFromBuffer(Archivo.buffer).catch(() => null);
    if (
      Tipo?.mime !== "application/pdf" ||
      !Archivo.originalname.toLowerCase().endsWith(".pdf")
    ) {
      throw new ErrorAplicacion(
        "El plano debe ser un archivo PDF válido.",
        "PLANO_INVALIDO"
      );
    }
  }

  async GuardarNegocioLocal(DatosRuc, CodigoLocal, Cliente) {
    const Local = DatosRuc.Locales.find(
      (Item) => Item.Codigo === CodigoLocal
    );
    if (!Local) {
      throw new ErrorAplicacion(
        "Selecciona un local válido de Trujillo.",
        "LOCAL_INVALIDO"
      );
    }
    const Negocio = await Cliente.query(
      `INSERT INTO negocios(ruc, razon_social, estado, condicion)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(ruc)
       DO UPDATE SET razon_social=EXCLUDED.razon_social,
                     estado=EXCLUDED.estado,
                     condicion=EXCLUDED.condicion,
                     actualizado_en=NOW()
       RETURNING *`,
      [
        DatosRuc.Ruc,
        DatosRuc.RazonSocial,
        DatosRuc.Estado,
        DatosRuc.Condicion
      ]
    );
    const LocalGuardado = await Cliente.query(
      `INSERT INTO locales(negocio_id, codigo, tipo, direccion, ubigeo, activo)
       VALUES($1,$2,$3,$4,$5,TRUE)
       ON CONFLICT(negocio_id, codigo, direccion)
       DO UPDATE SET tipo=EXCLUDED.tipo,
                     ubigeo=EXCLUDED.ubigeo,
                     activo=TRUE
       RETURNING *`,
      [
        Negocio.rows[0].id,
        Local.Codigo,
        Local.Tipo,
        Local.Direccion,
        Local.Ubigeo
      ]
    );
    return {
      Negocio: Negocio.rows[0],
      Local: LocalGuardado.rows[0]
    };
  }

  async CrearSolicitud(CajeroId, Campos, Archivo) {
    await this.Caja.CajaAbierta(CajeroId);
    await this.ValidarPlano(Archivo);

    const DatosRuc = await this.ConsultarRuc(String(Campos.ruc || ""));
    const DatosDni = await this.ConsultarDni(
      String(Campos.dni || ""),
      Campos.fechaNacimiento || null
    );
    if (DatosDni.RequiereFechaNacimiento) {
      throw new ErrorAplicacion(
        "CODART no devolvió la fecha de nacimiento. Completa el campo complementario.",
        "FECHA_NACIMIENTO_REQUERIDA"
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(String(Campos.correo || ""))) {
      throw new ErrorAplicacion(
        "Ingresa un correo válido.",
        "CORREO_INVALIDO"
      );
    }

    const ClavePlano = await this.Almacen.Guardar(
      Archivo.buffer,
      Archivo.originalname,
      "application/pdf",
      "planos"
    );
    const Codigo = CodigoTramite();

    const Resultado = await Transaccion(async (Cliente) => {
      const Entidades = await this.GuardarNegocioLocal(
        DatosRuc,
        Campos.codigoLocal,
        Cliente
      );
      const Ultimo = await Cliente.query(
        `SELECT id, estado
         FROM tramites
         WHERE local_id=$1
         ORDER BY id DESC
         LIMIT 1`,
        [Entidades.Local.id]
      );
      if (["PENDIENTE_PAGO", "EN_PROCESO", "EN_OBSERVACION", "APROBADO"].includes(Ultimo.rows[0]?.estado)) {
        throw new ErrorAplicacion(
          "Este local ya tiene un trámite o licencia activa.",
          "TRAMITE_EXISTENTE",
          409
        );
      }
      if (Ultimo.rows[0]?.estado === "VENCIDO") {
        throw new ErrorAplicacion(
          "La licencia está vencida. Usa el apartado de renovación.",
          "DEBE_RENOVAR",
          409
        );
      }

      const Tramite = await Cliente.query(
        `INSERT INTO tramites(
           codigo,tipo,negocio_id,local_id,ruc,dni,nombre_cliente,correo,
           estado,plano_clave,monto_demostracion,cajero_id
         )
         VALUES($1,'SOLICITUD',$2,$3,$4,$5,$6,$7,'PENDIENTE_PAGO',$8,$9,$10)
         RETURNING *`,
        [
          Codigo,
          Entidades.Negocio.id,
          Entidades.Local.id,
          DatosRuc.Ruc,
          DatosDni.Dni,
          DatosDni.NombreCompleto,
          Campos.correo,
          ClavePlano,
          Configuracion.MontoDemostracion,
          CajeroId
        ]
      );
      return {
        Tramite: Tramite.rows[0],
        Negocio: Entidades.Negocio,
        Local: Entidades.Local
      };
    });

    await Auditar(
      CajeroId,
      "CREAR_SOLICITUD",
      "TRAMITE",
      Resultado.Tramite.id
    );
    return {
      ...Resultado,
      MontoOficial: 180,
      MontoDemostracion: Configuracion.MontoDemostracion
    };
  }

  ValidarPago(Datos) {
    const Efectivo = Numero(Datos.montoEfectivo);
    const Digital = Numero(Datos.montoDigital);
    const Total = Numero(Efectivo + Digital);

    if (Efectivo < 0 || Digital < 0) {
      throw new ErrorAplicacion(
        "Los montos no pueden ser negativos.",
        "MONTO_INVALIDO"
      );
    }
    if (Math.abs(Total - Configuracion.MontoDemostracion) > 0.001) {
      throw new ErrorAplicacion(
        `El efectivo y Yape/Plin deben sumar exactamente S/ ${Configuracion.MontoDemostracion.toFixed(2)}.`,
        "TOTAL_INCORRECTO"
      );
    }
    if (
      Digital > 0 &&
      !["YAPE", "PLIN"].includes(Datos.medioDigital)
    ) {
      throw new ErrorAplicacion(
        "Selecciona Yape o Plin.",
        "MEDIO_DIGITAL_INVALIDO"
      );
    }
    if (
      Digital > 0 &&
      String(Datos.numeroOperacion || "").trim().length < 4
    ) {
      throw new ErrorAplicacion(
        "Registra el número de operación digital.",
        "OPERACION_REQUERIDA"
      );
    }

    return {
      Efectivo,
      Digital,
      Total,
      MedioDigital: Digital > 0 ? Datos.medioDigital : null,
      Operacion:
        Digital > 0
          ? String(Datos.numeroOperacion).trim()
          : null
    };
  }

  async PagarSolicitud(CajeroId, TramiteId, Datos) {
    const Pago = this.ValidarPago(Datos);
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Caja = await this.Caja.CajaAbierta(CajeroId);
    const FechaInspeccion =
      await this.Programacion.ProximaFecha(Fecha, 15);
    const Inspector = await Uno(
      "SELECT id FROM usuarios WHERE rol='INSPECTOR' AND activo=TRUE"
    );
    if (!Inspector) {
      throw new ErrorAplicacion(
        "No existe un inspector activo.",
        "SIN_INSPECTOR",
        409
      );
    }

    const Resultado = await Transaccion(async (Cliente) => {
      const Consulta = await Cliente.query(
        `SELECT t.*, n.razon_social, l.direccion, l.ubigeo
         FROM tramites t
         JOIN negocios n ON n.id=t.negocio_id
         JOIN locales l ON l.id=t.local_id
         WHERE t.id=$1 AND t.cajero_id=$2
         FOR UPDATE`,
        [TramiteId, CajeroId]
      );
      const Tramite = Consulta.rows[0];
      if (
        !Tramite ||
        Tramite.estado !== EstadosTramite.PENDIENTE_PAGO
      ) {
        throw new ErrorAplicacion(
          "La solicitud no está disponible para pago.",
          "PAGO_NO_DISPONIBLE",
          409
        );
      }

      await Cliente.query(
        `INSERT INTO pagos(
           tramite_id,caja_id,monto_efectivo,monto_digital,
           medio_digital,numero_operacion,total
         )
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [
          Tramite.id,
          Caja.id,
          Pago.Efectivo,
          Pago.Digital,
          Pago.MedioDigital,
          Pago.Operacion,
          Pago.Total
        ]
      );
      await this.Caja.RegistrarCobroEfectivo(
        Caja.id,
        Pago.Efectivo,
        Tramite.codigo,
        Cliente
      );
      await Cliente.query(
        "UPDATE tramites SET estado='EN_PROCESO', fecha_pago=$2 WHERE id=$1",
        [Tramite.id, Fecha]
      );
      await Cliente.query(
        `INSERT INTO inspecciones(
           tramite_id,numero,fecha_programada,inspector_id
         )
         VALUES($1,1,$2,$3)`,
        [Tramite.id, FechaInspeccion, Inspector.id]
      );
      return Tramite;
    });

    const Pdf = await GenerarComprobante({
      Tipo: "SOLICITUD",
      Codigo: Resultado.codigo,
      Fecha: FormatearFecha(Fecha),
      Ruc: Resultado.ruc,
      RazonSocial: Resultado.razon_social,
      Dni: Resultado.dni,
      Direccion: Resultado.direccion,
      MontoOficial: 180,
      Total: Pago.Total,
      Efectivo: Pago.Efectivo,
      Digital: Pago.Digital,
      Operacion: Pago.Operacion
    });
    const Clave = await this.Almacen.Guardar(
      Pdf,
      `Factura-${Resultado.codigo}.pdf`,
      "application/pdf",
      "comprobantes"
    );
    await Consultar(
      "UPDATE tramites SET comprobante_clave=$2 WHERE id=$1",
      [TramiteId, Clave]
    );

    await this.Tiempo.CrearNotificacion(
      `pago-${TramiteId}`,
      TramiteId,
      Resultado.correo,
      "Primera inspección programada",
      `Tu primera inspección es el ${FormatearFecha(FechaInspeccion)}.`,
      Fecha
    );
    await this.Tiempo.ProcesarEventos();
    await Auditar(
      CajeroId,
      "PAGAR_SOLICITUD",
      "TRAMITE",
      TramiteId,
      Pago
    );

    return {
      FechaInspeccion,
      FechaInspeccionFormateada: FormatearFecha(FechaInspeccion),
      ComprobanteDisponible: true
    };
  }

  async BuscarRenovaciones(Ruc) {
    if (!/^20\d{9}$/.test(Ruc)) {
      throw new ErrorAplicacion(
        "El RUC debe comenzar con 20.",
        "RUC_INVALIDO"
      );
    }
    await this.Tiempo.ProcesarEventos();
    const Resultado = await Consultar(
      `SELECT DISTINCT ON (t.local_id)
         t.id, t.codigo, t.estado, t.fecha_vencimiento, t.correo,
         l.id local_id, l.direccion, l.codigo local_codigo,
         n.razon_social, t.ruc
       FROM tramites t
       JOIN locales l ON l.id=t.local_id
       JOIN negocios n ON n.id=t.negocio_id
       WHERE t.ruc=$1
         AND t.estado IN ('APROBADO','VENCIDO')
       ORDER BY t.local_id, t.id DESC`,
      [Ruc]
    );
    return Resultado.rows;
  }

  async Renovar(CajeroId, TramiteAnteriorId, Datos) {
    const Pago = this.ValidarPago(Datos);
    const Fecha = await this.Tiempo.ObtenerFecha();
    const Caja = await this.Caja.CajaAbierta(CajeroId);
    const DatosDni = await this.ConsultarDni(
      String(Datos.dni || ""),
      Datos.fechaNacimiento || null
    );
    if (DatosDni.RequiereFechaNacimiento) {
      throw new ErrorAplicacion(
        "Completa la fecha de nacimiento del titular.",
        "FECHA_NACIMIENTO_REQUERIDA"
      );
    }
    const Vencimiento =
      await this.Programacion.Vencimiento(Fecha);

    const Resultado = await Transaccion(async (Cliente) => {
      const Consulta = await Cliente.query(
        `SELECT t.*, n.razon_social, l.direccion, l.ubigeo
         FROM tramites t
         JOIN negocios n ON n.id=t.negocio_id
         JOIN locales l ON l.id=t.local_id
         WHERE t.id=$1
         FOR UPDATE`,
        [TramiteAnteriorId]
      );
      const Anterior = Consulta.rows[0];
      if (!Anterior || Anterior.estado !== "VENCIDO") {
        throw new ErrorAplicacion(
          "Solo se pueden renovar licencias vencidas.",
          "RENOVACION_NO_DISPONIBLE",
          409
        );
      }

      const Codigo = CodigoTramite();
      const NuevoResultado = await Cliente.query(
        `INSERT INTO tramites(
           codigo,tipo,negocio_id,local_id,ruc,dni,nombre_cliente,
           correo,estado,monto_demostracion,cajero_id,renovado_desde_id,
           fecha_pago,fecha_aprobacion,fecha_vencimiento
         )
         VALUES(
           $1,'RENOVACION',$2,$3,$4,$5,$6,$7,'APROBADO',
           $8,$9,$10,$11,$11,$12
         )
         RETURNING *`,
        [
          Codigo,
          Anterior.negocio_id,
          Anterior.local_id,
          Anterior.ruc,
          DatosDni.Dni,
          DatosDni.NombreCompleto,
          Datos.correo || Anterior.correo,
          Configuracion.MontoDemostracion,
          CajeroId,
          Anterior.id,
          Fecha,
          Vencimiento
        ]
      );
      const Nuevo = NuevoResultado.rows[0];
      const Numero = NumeroLicencia(Nuevo.id);
      await Cliente.query(
        "UPDATE tramites SET numero_licencia=$2 WHERE id=$1",
        [Nuevo.id, Numero]
      );

      await Cliente.query(
        `INSERT INTO pagos(
           tramite_id,caja_id,monto_efectivo,monto_digital,
           medio_digital,numero_operacion,total
         )
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [
          Nuevo.id,
          Caja.id,
          Pago.Efectivo,
          Pago.Digital,
          Pago.MedioDigital,
          Pago.Operacion,
          Pago.Total
        ]
      );
      await this.Caja.RegistrarCobroEfectivo(
        Caja.id,
        Pago.Efectivo,
        Codigo,
        Cliente
      );

      return {
        ...Anterior,
        NuevoId: Nuevo.id,
        NuevoCodigo: Codigo,
        NumeroLicencia: Numero
      };
    });

    const Pdf = await GenerarComprobante({
      Tipo: "RENOVACION",
      Codigo: Resultado.NuevoCodigo,
      Fecha: FormatearFecha(Fecha),
      Ruc: Resultado.ruc,
      RazonSocial: Resultado.razon_social,
      Dni: DatosDni.Dni,
      Direccion: Resultado.direccion,
      MontoOficial: 180,
      Total: Pago.Total,
      Efectivo: Pago.Efectivo,
      Digital: Pago.Digital,
      Operacion: Pago.Operacion
    });
    const Clave = await this.Almacen.Guardar(
      Pdf,
      `Boleta-${Resultado.NuevoCodigo}.pdf`,
      "application/pdf",
      "comprobantes"
    );
    await Consultar(
      "UPDATE tramites SET comprobante_clave=$2 WHERE id=$1",
      [Resultado.NuevoId, Clave]
    );
    await Auditar(
      CajeroId,
      "RENOVAR_LICENCIA",
      "TRAMITE",
      Resultado.NuevoId,
      Pago
    );
    return {
      TramiteId: Resultado.NuevoId,
      FechaVencimiento: Vencimiento,
      FechaVencimientoFormateada: FormatearFecha(Vencimiento)
    };
  }

  async HistorialCajero(CajeroId) {
    const Resultado = await Consultar(
      `SELECT t.id,t.codigo,t.tipo,t.ruc,t.estado,
              t.fecha_creacion,t.fecha_pago,
              n.razon_social,l.direccion,
              (t.comprobante_clave IS NOT NULL) comprobante_disponible
       FROM tramites t
       JOIN negocios n ON n.id=t.negocio_id
       JOIN locales l ON l.id=t.local_id
       WHERE t.cajero_id=$1
       ORDER BY t.id DESC
       LIMIT 100`,
      [CajeroId]
    );
    return Resultado.rows;
  }

  async Seguimiento(Ruc) {
    if (!/^\d{11}$/.test(Ruc)) {
      throw new ErrorAplicacion(
        "Ingresa un RUC válido de 11 dígitos.",
        "RUC_INVALIDO"
      );
    }
    await this.Tiempo.ProcesarEventos();
    const Resultado = await Consultar(
      `SELECT DISTINCT ON (t.local_id)
         t.id,t.codigo,t.tipo,t.ruc,t.estado,t.correo,
         t.fecha_pago,t.fecha_aprobacion,t.fecha_vencimiento,
         t.numero_licencia,
         n.razon_social,l.codigo local_codigo,l.direccion,l.ubigeo,
         i1.fecha_programada primera_inspeccion,
         i2.fecha_programada segunda_inspeccion,
         i1.observaciones observaciones_primera,
         i2.observaciones observaciones_segunda
       FROM tramites t
       JOIN negocios n ON n.id=t.negocio_id
       JOIN locales l ON l.id=t.local_id
       LEFT JOIN inspecciones i1
         ON i1.tramite_id=t.id AND i1.numero=1
       LEFT JOIN inspecciones i2
         ON i2.tramite_id=t.id AND i2.numero=2
       WHERE t.ruc=$1
         AND t.estado <> 'PENDIENTE_PAGO'
       ORDER BY t.local_id,t.id DESC`,
      [Ruc]
    );
    return {
      Ruc,
      Registros: Resultado.rows,
      Mensaje: Resultado.rowCount
        ? null
        : "Este RUC no tiene inspecciones registradas"
    };
  }

  async DescargarLicencia(TramiteId, Ruc) {
    await this.Tiempo.ProcesarEventos();
    const Tramite = await Uno(
      `SELECT t.*,n.razon_social,l.direccion,l.ubigeo
       FROM tramites t
       JOIN negocios n ON n.id=t.negocio_id
       JOIN locales l ON l.id=t.local_id
       WHERE t.id=$1 AND t.ruc=$2`,
      [TramiteId, Ruc]
    );
    if (
      !Tramite ||
      !["APROBADO", "VENCIDO"].includes(Tramite.estado)
    ) {
      throw new ErrorAplicacion(
        "La licencia no está disponible.",
        "LICENCIA_NO_DISPONIBLE",
        404
      );
    }
    return GenerarLicencia(
      {
        NumeroLicencia: Tramite.numero_licencia,
        Ruc: Tramite.ruc,
        RazonSocial: Tramite.razon_social,
        Direccion: Tramite.direccion,
        Ubigeo: Tramite.ubigeo,
        FechaAprobacion: FormatearFecha(Tramite.fecha_aprobacion),
        FechaVencimiento: FormatearFecha(Tramite.fecha_vencimiento)
      },
      Tramite.estado === "VENCIDO"
    );
  }
}
