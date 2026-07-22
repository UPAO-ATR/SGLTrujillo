import bcrypt from "bcryptjs";
import { Consultar, Transaccion, Uno } from "../BaseDatos/Conexion.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";
import { Auditar } from "./ServicioAuditoria.js";

export class ServicioAdministracion {
  async Resumen() {
    const Solicitudes = await Consultar(
      `SELECT s.*,u.nombre cajero_nombre,
              c.estado caja_estado,c.efectivo_esperado
       FROM solicitudes_caja s
       JOIN usuarios u ON u.id=s.cajero_id
       LEFT JOIN cajas c ON c.id=s.caja_id
       WHERE s.estado='PENDIENTE'
       ORDER BY s.id`
    );
    const Cajeros = await Consultar(
      "SELECT id,nombre,correo,activo FROM usuarios WHERE rol='CAJERO' ORDER BY id"
    );
    const Inspector = await Uno(
      "SELECT id,nombre,correo,activo FROM usuarios WHERE rol='INSPECTOR' AND activo=TRUE"
    );
    const Alertas = await Consultar(
      "SELECT * FROM alertas_admin ORDER BY id DESC LIMIT 50"
    );
    return {
      SolicitudesCaja: Solicitudes.rows,
      Cajeros: Cajeros.rows,
      Inspector,
      Alertas: Alertas.rows
    };
  }

  async ResolverSolicitud(AdministradorId, SolicitudId, Aprobar, Monto = null) {
    const Resultado = await Transaccion(async (Cliente) => {
      const Consulta = await Cliente.query(
        `SELECT s.*,c.efectivo_esperado,c.estado caja_estado
         FROM solicitudes_caja s
         LEFT JOIN cajas c ON c.id=s.caja_id
         WHERE s.id=$1
         FOR UPDATE OF s`,
        [SolicitudId]
      );
      const Solicitud = Consulta.rows[0];
      if (!Solicitud || Solicitud.estado !== "PENDIENTE") {
        throw new ErrorAplicacion(
          "La solicitud de caja ya fue resuelta.",
          "SOLICITUD_RESUELTA",
          409
        );
      }

      if (!Aprobar) {
        await Cliente.query(
          `UPDATE solicitudes_caja
           SET estado='RECHAZADA',
               resuelta_en=NOW(),
               administrador_id=$2
           WHERE id=$1`,
          [SolicitudId, AdministradorId]
        );
        if (Solicitud.tipo === "APERTURA") {
          await Cliente.query(
            "UPDATE cajas SET estado='RECHAZADA' WHERE id=$1",
            [Solicitud.caja_id]
          );
        }
        if (Solicitud.tipo === "CIERRE") {
          await Cliente.query(
            "UPDATE cajas SET estado='ABIERTA', efectivo_contado=NULL WHERE id=$1",
            [Solicitud.caja_id]
          );
        }
        return { Estado: "RECHAZADA", Tipo: Solicitud.tipo };
      }

      if (Solicitud.tipo === "APERTURA") {
        const Inicial = Number(Monto);
        if (!(Inicial >= 0)) {
          throw new ErrorAplicacion(
            "Indica el monto inicial de la caja.",
            "MONTO_INVALIDO"
          );
        }
        await Cliente.query(
          `UPDATE cajas
           SET estado='ABIERTA',
               monto_inicial=$2,
               efectivo_esperado=$2,
               abierta_en=NOW()
           WHERE id=$1`,
          [Solicitud.caja_id, Inicial]
        );
        await Cliente.query(
          `INSERT INTO movimientos_caja(
             caja_id,tipo,monto,detalle
           )
           VALUES($1,'APERTURA',$2,'Fondo inicial autorizado')`,
          [Solicitud.caja_id, Inicial]
        );
      }

      if (Solicitud.tipo === "INYECCION") {
        const Inyeccion = Number(Solicitud.monto);
        await Cliente.query(
          "UPDATE cajas SET efectivo_esperado=efectivo_esperado+$2 WHERE id=$1",
          [Solicitud.caja_id, Inyeccion]
        );
        await Cliente.query(
          `INSERT INTO movimientos_caja(
             caja_id,tipo,monto,detalle
           )
           VALUES($1,'INYECCION',$2,'Inyección de sencillo autorizada')`,
          [Solicitud.caja_id, Inyeccion]
        );
      }

      if (Solicitud.tipo === "CIERRE") {
        const Esperado = Number(Solicitud.efectivo_esperado);
        const Contado = Number(Solicitud.monto_contado);
        const Diferencia =
          Math.round((Contado - Esperado) * 100) / 100;
        await Cliente.query(
          `UPDATE cajas
           SET estado='CERRADA',
               efectivo_contado=$2,
               diferencia=$3,
               cerrada_en=NOW()
           WHERE id=$1`,
          [Solicitud.caja_id, Contado, Diferencia]
        );
        if (Math.abs(Diferencia) > 0.001) {
          await Cliente.query(
            `INSERT INTO alertas_admin(tipo,mensaje)
             VALUES('DESCUADRE_CAJA',$1)`,
            [
              `La caja ${Solicitud.caja_id} presenta un descuadre de S/ ${Diferencia.toFixed(2)}.`
            ]
          );
        }
      }

      await Cliente.query(
        `UPDATE solicitudes_caja
         SET estado='APROBADA',
             resuelta_en=NOW(),
             administrador_id=$2
         WHERE id=$1`,
        [SolicitudId, AdministradorId]
      );
      return { Estado: "APROBADA", Tipo: Solicitud.tipo };
    });

    await Auditar(
      AdministradorId,
      `${Resultado.Estado}_${Resultado.Tipo}`,
      "SOLICITUD_CAJA",
      SolicitudId,
      { Monto }
    );
    return Resultado;
  }

  async CrearCajero(AdministradorId, Datos) {
    if (!/^\S+@\S+\.\S+$/.test(Datos.correo || "")) {
      throw new ErrorAplicacion(
        "El correo del cajero no es válido.",
        "CORREO_INVALIDO"
      );
    }
    if (String(Datos.clave || "").length < 8) {
      throw new ErrorAplicacion(
        "La contraseña debe tener al menos 8 caracteres.",
        "CLAVE_CORTA"
      );
    }
    const Hash = await bcrypt.hash(Datos.clave, 11);
    try {
      const Resultado = await Consultar(
        `INSERT INTO usuarios(nombre,correo,clave_hash,rol)
         VALUES($1,LOWER($2),$3,'CAJERO')
         RETURNING id,nombre,correo,activo`,
        [Datos.nombre, Datos.correo, Hash]
      );
      await Auditar(
        AdministradorId,
        "CREAR_CAJERO",
        "USUARIO",
        Resultado.rows[0].id
      );
      return Resultado.rows[0];
    } catch (Error) {
      if (Error.code === "23505") {
        throw new ErrorAplicacion(
          "El correo ya está registrado.",
          "CORREO_EXISTENTE",
          409
        );
      }
      throw Error;
    }
  }

  async QuitarCajero(AdministradorId, CajeroId) {
    const Cantidad = await Uno(
      "SELECT COUNT(*)::int cantidad FROM usuarios WHERE rol='CAJERO' AND activo=TRUE"
    );
    if (Number(Cantidad.cantidad) <= 2) {
      throw new ErrorAplicacion(
        "El sistema debe conservar como mínimo dos cajeros activos.",
        "MINIMO_CAJEROS",
        409
      );
    }
    await Consultar(
      "UPDATE usuarios SET activo=FALSE WHERE id=$1 AND rol='CAJERO'",
      [CajeroId]
    );
    await Auditar(
      AdministradorId,
      "QUITAR_CAJERO",
      "USUARIO",
      CajeroId
    );
    return { Exito: true };
  }

  async ModificarInspector(AdministradorId, Datos) {
    const Inspector = await Uno(
      "SELECT id FROM usuarios WHERE rol='INSPECTOR' AND activo=TRUE"
    );
    if (!Inspector) {
      throw new ErrorAplicacion(
        "No existe inspector activo.",
        "SIN_INSPECTOR",
        404
      );
    }
    if (Datos.correo) {
      await Consultar(
        "UPDATE usuarios SET correo=LOWER($2) WHERE id=$1",
        [Inspector.id, Datos.correo]
      );
    }
    if (Datos.clave) {
      if (String(Datos.clave).length < 8) {
        throw new ErrorAplicacion(
          "La contraseña debe tener al menos 8 caracteres.",
          "CLAVE_CORTA"
        );
      }
      await Consultar(
        "UPDATE usuarios SET clave_hash=$2 WHERE id=$1",
        [Inspector.id, await bcrypt.hash(Datos.clave, 11)]
      );
    }
    await Auditar(
      AdministradorId,
      "MODIFICAR_INSPECTOR",
      "USUARIO",
      Inspector.id
    );
    return Uno(
      "SELECT id,nombre,correo,activo FROM usuarios WHERE id=$1",
      [Inspector.id]
    );
  }

  async MarcarAlerta(AlertaId) {
    await Consultar(
      "UPDATE alertas_admin SET leida=TRUE WHERE id=$1",
      [AlertaId]
    );
    return { Exito: true };
  }
}
