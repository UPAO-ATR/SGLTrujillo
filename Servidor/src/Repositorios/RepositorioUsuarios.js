// Consulta y modifica trabajadores y credenciales.

export class RepositorioUsuarios {
  constructor(BaseDatos) {
    this.BaseDatos = BaseDatos;
  }
  async BuscarPorCorreo(Correo, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM usuarios WHERE LOWER(correo_institucional)=LOWER($1) LIMIT 1",
      [Correo],
    );
    return R.rows[0] || null;
  }
  async BuscarPorId(Id, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM usuarios WHERE id=$1 LIMIT 1",
      [Id],
    );
    return R.rows[0] || null;
  }
  async BuscarPorDni(Dni, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT * FROM usuarios WHERE dni=$1 LIMIT 1",
      [Dni],
    );
    return R.rows[0] || null;
  }
  async ListarPorRol(Rol, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT id,dni,nombres,apellido_paterno,apellido_materno,correo_institucional,rol,habilitado,hora_entrada,fecha_creacion FROM usuarios WHERE rol=$1 ORDER BY habilitado DESC,fecha_creacion DESC",
      [Rol],
    );
    return R.rows;
  }
  async ContarHabilitadosPorRol(Rol, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "SELECT COUNT(*)::int cantidad FROM usuarios WHERE rol=$1 AND habilitado=TRUE",
      [Rol],
    );
    return R.rows[0].cantidad;
  }
  async Crear(Datos, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      `INSERT INTO usuarios(dni,nombres,apellido_paterno,apellido_materno,correo_institucional,contrasena_hash,rol,habilitado,hora_entrada)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,dni,nombres,apellido_paterno,apellido_materno,correo_institucional,rol,habilitado,hora_entrada`,
      [
        Datos.Dni,
        Datos.Nombres,
        Datos.ApellidoPaterno,
        Datos.ApellidoMaterno,
        Datos.CorreoInstitucional,
        Datos.ContrasenaHash,
        Datos.Rol,
        Datos.Habilitado ?? true,
        Datos.HoraEntrada || "08:00",
      ],
    );
    return R.rows[0];
  }
  async CambiarHabilitacion(Id, Habilitado, Cliente = this.BaseDatos) {
    const R = await Cliente.query(
      "UPDATE usuarios SET habilitado=$2,fecha_actualizacion=NOW() WHERE id=$1 RETURNING id,dni,nombres,apellido_paterno,apellido_materno,correo_institucional,rol,habilitado,hora_entrada",
      [Id, Habilitado],
    );
    return R.rows[0] || null;
  }
  async CambiarContrasena(Id, Hash, Cliente = this.BaseDatos) {
    await Cliente.query(
      "UPDATE usuarios SET contrasena_hash=$2,fecha_actualizacion=NOW() WHERE id=$1",
      [Id, Hash],
    );
  }
  async ActualizarHoraEntradaTodos(Hora, Cliente = this.BaseDatos) {
    await Cliente.query(
      "UPDATE usuarios SET hora_entrada=$1,fecha_actualizacion=NOW()",
      [Hora],
    );
  }
}