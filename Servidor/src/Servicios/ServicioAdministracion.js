// Aplica las reglas de trabajadores y configuración.

import bcrypt from "bcryptjs";
import { RolesUsuario } from "../Dominio/RolesUsuario.js";
import {
  ErrorAplicacion,
  ErrorConflicto,
  ErrorNoEncontrado,
} from "../Dominio/Errores.js";
import { CalcularEdad } from "../Utilidades/Fechas.js";
import { Constantes } from "../Configuracion/Constantes.js";
function Capitalizar(Texto) {
  const Limpio = String(Texto || "")
    .trim()
    .toLowerCase();
  return Limpio ? Limpio.charAt(0).toUpperCase() + Limpio.slice(1) : "";
}
export class ServicioAdministracion {
  constructor(Dependencias) {
    Object.assign(this, Dependencias);
  }
  // Completa los datos y calcula la edad disponible.
  async ConsultarDni(Dni) {
    const Datos = await this.ClienteCodart.ConsultarDni(Dni);
    const Edad = Datos.Edad ?? CalcularEdad(Datos.FechaNacimiento);
    return { ...Datos, Edad, PuedeValidarEdad: Number.isFinite(Edad) };
  }
  // Valida el DNI, la edad y los límites del rol.
  async CrearTrabajador(Dni, Rol, Usuario) {
    if (![RolesUsuario.Inspector, RolesUsuario.Cajera].includes(Rol))
      throw new ErrorAplicacion(
        "Solo se pueden crear inspectores o cajeras.",
        "ROL_INVALIDO",
        400,
      );
    if (await this.RepositorioUsuarios.BuscarPorDni(Dni))
      throw new ErrorConflicto(
        "El DNI ya pertenece a un trabajador registrado.",
      );
    const Datos = await this.ConsultarDni(Dni);
    if (!Datos.PuedeValidarEdad)
      throw new ErrorAplicacion(
        "El proveedor no entregó la fecha de nacimiento necesaria para validar la mayoría de edad.",
        "EDAD_NO_DISPONIBLE",
        409,
      );
    if (Datos.Edad < 18)
      throw new ErrorAplicacion(
        "El trabajador debe ser mayor de edad.",
        "MENOR_DE_EDAD",
        400,
      );
    if (
      Rol === RolesUsuario.Inspector &&
      (await this.RepositorioUsuarios.ContarHabilitadosPorRol(
        RolesUsuario.Inspector,
      )) >= 1
    )
      throw new ErrorConflicto(
        "Debe deshabilitar al inspector actual antes de crear su reemplazo.",
      );
    if (Rol === RolesUsuario.Cajera) {
      const Maximo = Number(
        await this.RepositorioConfiguracion.ObtenerValor(
          "CantidadMaximaCajeras",
          Constantes.MaximoCajerasPredeterminado,
        ),
      );
      if (
        (await this.RepositorioUsuarios.ContarHabilitadosPorRol(
          RolesUsuario.Cajera,
        )) >= Maximo
      )
        throw new ErrorConflicto(
          `Ya se alcanzó el máximo de ${Maximo} cajeras habilitadas.`,
        );
    }
    const Correo = await this.GenerarCorreoInstitucional(Datos, Dni);
    const ContrasenaTemporal =
      Rol === RolesUsuario.Inspector ? "inspector123" : "cajera123";
    const Trabajador = await this.RepositorioUsuarios.Crear({
      Dni,
      Nombres: Datos.Nombres,
      ApellidoPaterno: Datos.ApellidoPaterno,
      ApellidoMaterno: Datos.ApellidoMaterno,
      CorreoInstitucional: Correo,
      ContrasenaHash: await bcrypt.hash(ContrasenaTemporal, 12),
      Rol,
      Habilitado: true,
      HoraEntrada: await this.RepositorioConfiguracion.ObtenerValor(
        "HoraEntradaTrabajadores",
        "08:00",
      ),
    });
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "CREAR_TRABAJADOR",
      "USUARIO",
      Trabajador.id,
      { Rol, Dni, Correo },
    );
    return { Trabajador, ContrasenaTemporal };
  }
  // Amplía la cantidad de dígitos hasta obtener un correo único.
  async GenerarCorreoInstitucional(Datos, Dni) {
    const Base = `${Capitalizar(Datos.ApellidoPaterno)}${String(
      Datos.ApellidoMaterno || "",
    )
      .charAt(0)
      .toUpperCase()}`;
    for (let Cantidad = 3; Cantidad <= 8; Cantidad += 1) {
      const Correo = `${Base}${Dni.slice(-Cantidad)}@sgl.muni.pe`;
      if (!(await this.RepositorioUsuarios.BuscarPorCorreo(Correo)))
        return Correo;
    }
    throw new ErrorConflicto(
      "No fue posible generar un correo institucional único.",
    );
  }
  // Conserva una cajera y un solo inspector habilitado.
  async CambiarHabilitacionTrabajador(Id, Habilitado, Usuario) {
    const Trabajador = await this.RepositorioUsuarios.BuscarPorId(Id);
    if (!Trabajador)
      throw new ErrorNoEncontrado("No se encontró el trabajador.");
    if (
      !Habilitado &&
      Trabajador.rol === RolesUsuario.Cajera &&
      (await this.RepositorioUsuarios.ContarHabilitadosPorRol(
        RolesUsuario.Cajera,
      )) <= 1
    )
      throw new ErrorConflicto(
        "Debe permanecer al menos una cajera habilitada.",
      );
    if (
      Habilitado &&
      Trabajador.rol === RolesUsuario.Inspector &&
      (await this.RepositorioUsuarios.ContarHabilitadosPorRol(
        RolesUsuario.Inspector,
      )) >= 1
    )
      throw new ErrorConflicto("Solo puede existir un inspector habilitado.");
    const Actualizado = await this.RepositorioUsuarios.CambiarHabilitacion(
      Id,
      Habilitado,
    );
    await this.ServicioAuditoria.Registrar(
      Usuario,
      Habilitado ? "HABILITAR_TRABAJADOR" : "DESHABILITAR_TRABAJADOR",
      "USUARIO",
      Id,
      { Rol: Trabajador.rol },
    );
    return Actualizado;
  }
  // Valida cada parámetro antes de guardarlo.
  async ActualizarConfiguracion(Clave, Valor, Usuario) {
    let Normalizado = Valor;
    let Tipo = "NUMERO";
    if (Clave === "CantidadInspeccionesDiarias") {
      Normalizado = Number(Valor);
      if (![6, 7, 8].includes(Normalizado))
        throw new ErrorAplicacion(
          "La cantidad de inspecciones debe ser 6, 7 u 8.",
          "CONFIGURACION_INVALIDA",
          400,
        );
    } else if (Clave === "HoraEntradaTrabajadores") {
      Tipo = "HORA";
      const CoincidenciaHora = String(Valor).match(/^(\d{2}):(\d{2})$/);
      const MinutosEntrada = CoincidenciaHora
        ? Number(CoincidenciaHora[1]) * 60 + Number(CoincidenciaHora[2])
        : Number.NaN;
      if (
        !Number.isFinite(MinutosEntrada) ||
        MinutosEntrada < 8 * 60 ||
        MinutosEntrada > 11 * 60
      )
        throw new ErrorAplicacion(
          "La hora de entrada debe estar entre 08:00 y 11:00.",
          "CONFIGURACION_INVALIDA",
          400,
        );
      await this.RepositorioUsuarios.ActualizarHoraEntradaTodos(Valor);
    } else if (Clave === "CantidadMaximaCajeras") {
      Normalizado = Number(Valor);
      if (!Number.isInteger(Normalizado) || Normalizado < 1 || Normalizado > 20)
        throw new ErrorAplicacion(
          "La cantidad máxima de cajeras debe estar entre 1 y 20.",
          "CONFIGURACION_INVALIDA",
          400,
        );
    } else if (Clave === "TamanoMaximoPlanoMb") {
      Normalizado = Number(Valor);
      if (Normalizado < 1 || Normalizado > 25)
        throw new ErrorAplicacion(
          "El tamaño máximo del plano debe estar entre 1 y 25 MB.",
          "CONFIGURACION_INVALIDA",
          400,
        );
    } else if (Clave === "UmbralSangria") {
      Normalizado = Number(Valor);
      if (Normalizado < 180 || Normalizado > 20000)
        throw new ErrorAplicacion(
          "El umbral de sangría debe estar entre S/ 180 y S/ 20,000.",
          "CONFIGURACION_INVALIDA",
          400,
        );
    }
    const Configuracion = await this.RepositorioConfiguracion.Guardar(
      Clave,
      Normalizado,
      Tipo,
      Usuario.id,
    );
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "CAMBIAR_CONFIGURACION",
      "CONFIGURACION",
      Configuracion.id,
      { Clave, Valor: Normalizado },
    );
    if (Clave === "CantidadInspeccionesDiarias")
      await this.ServicioInspecciones.ReordenarDiasConExceso();
    return Configuracion;
  }
  // Permite crear un único administrador habilitado.
  async CrearAdministrador(Dni, Usuario) {
    if (
      (await this.RepositorioUsuarios.ContarHabilitadosPorRol(
        RolesUsuario.Administrador,
      )) >= 1
    )
      throw new ErrorConflicto("Ya existe un administrador habilitado.");
    if (await this.RepositorioUsuarios.BuscarPorDni(Dni))
      throw new ErrorConflicto("El DNI ya está registrado.");
    const Datos = await this.ConsultarDni(Dni);
    if (!Datos.PuedeValidarEdad || Datos.Edad < 18)
      throw new ErrorAplicacion(
        "El administrador debe ser mayor de edad.",
        "EDAD_INVALIDA",
        400,
      );
    const Correo = await this.GenerarCorreoInstitucional(Datos, Dni);
    const Administrador = await this.RepositorioUsuarios.Crear({
      Dni,
      Nombres: Datos.Nombres,
      ApellidoPaterno: Datos.ApellidoPaterno,
      ApellidoMaterno: Datos.ApellidoMaterno,
      CorreoInstitucional: Correo,
      ContrasenaHash: await bcrypt.hash("Admin@123", 12),
      Rol: RolesUsuario.Administrador,
      Habilitado: true,
    });
    await this.ServicioAuditoria.Registrar(
      Usuario,
      "CREAR_ADMINISTRADOR",
      "USUARIO",
      Administrador.id,
      { Dni, Correo },
    );
    return { Administrador, ContrasenaTemporal: "Admin@123" };
  }
}