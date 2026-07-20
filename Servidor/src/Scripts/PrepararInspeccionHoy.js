// Prepara una inspección para la demostración del día.

import { GrupoConexiones } from "../BaseDatos/ConexionBaseDatos.js";
import { Contenedor } from "../Contenedor.js";

const NumeroVisita = Number(process.argv[2] || 1);
if (![1, 2].includes(NumeroVisita))
  throw new Error("Indique 1 para primera visita o 2 para segunda visita.");

try {
  const Resultado =
    await Contenedor.ServicioInspecciones.PrepararInspeccionParaHoy(
      NumeroVisita,
    );
  console.log(
    `Inspección ${Resultado.InspeccionId} preparada para ${Resultado.FechaProgramada} a las ${Resultado.HoraProgramada}.`,
  );
} catch (Error) {
  console.error(Error.message);
  process.exitCode = 1;
} finally {
  await GrupoConexiones.end();
}