import bcrypt from "bcryptjs";
import { Consultar, Uno } from "../BaseDatos/Conexion.js";
import { ErrorAplicacion } from "../Dominio/ErrorAplicacion.js";
import { Auditar } from "./ServicioAuditoria.js";

export class ServicioSuperAdministracion {
  async ObtenerAdministrador() {
    return Uno(
      "SELECT id,nombre,correo,activo FROM usuarios WHERE rol='ADMINISTRADOR' AND activo=TRUE"
    );
  }

  async Modificar(SuperId, Datos) {
    const Admin = await this.ObtenerAdministrador();
    if (!Admin) {
      throw new ErrorAplicacion(
        "No existe administrador activo.",
        "SIN_ADMINISTRADOR",
        404
      );
    }
    if (Datos.correo) {
      await Consultar(
        "UPDATE usuarios SET correo=LOWER($2) WHERE id=$1",
        [Admin.id, Datos.correo]
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
        [Admin.id, await bcrypt.hash(Datos.clave, 11)]
      );
    }
    await Auditar(
      SuperId,
      "MODIFICAR_ADMINISTRADOR",
      "USUARIO",
      Admin.id
    );
    return this.ObtenerAdministrador();
  }
}
