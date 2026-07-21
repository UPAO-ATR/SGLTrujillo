import { Consultar } from "../BaseDatos/Conexion.js";

export async function Auditar(UsuarioId, Accion, Entidad, EntidadId, Detalle = {}) {
  await Consultar(
    "INSERT INTO auditoria(usuario_id, accion, entidad, entidad_id, detalle) VALUES($1,$2,$3,$4,$5)",
    [UsuarioId || null, Accion, Entidad, EntidadId ? String(EntidadId) : null, Detalle]
  );
}
