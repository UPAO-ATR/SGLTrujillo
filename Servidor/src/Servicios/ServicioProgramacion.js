import { Consultar, Uno } from "../BaseDatos/Conexion.js";
import { AgregarDiasHabiles, EsHabil } from "../Utilidades/Fechas.js";

export class ServicioProgramacion {
  async Feriados() {
    const Resultado = await Consultar("SELECT fecha::text fecha FROM feriados");
    return new Set(Resultado.rows.map((Fila) => Fila.fecha));
  }

  async ProximaFecha(FechaBase, DiasHabiles) {
    const Feriados = await this.Feriados();
    let Candidata = AgregarDiasHabiles(FechaBase, DiasHabiles, Feriados);
    while (true) {
      if (!EsHabil(Candidata, Feriados)) {
        Candidata = AgregarDiasHabiles(Candidata, 1, Feriados);
        continue;
      }
      const Cantidad = await Uno(
        "SELECT COUNT(*)::int cantidad FROM inspecciones WHERE fecha_programada=$1 AND estado='PENDIENTE'",
        [Candidata]
      );
      if (Number(Cantidad.cantidad) < 4) return Candidata;
      Candidata = AgregarDiasHabiles(Candidata, 1, Feriados);
    }
  }

  async Vencimiento(FechaAprobacion) {
    return AgregarDiasHabiles(
      FechaAprobacion,
      365,
      await this.Feriados()
    );
  }
}
