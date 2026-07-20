// Indica el avance del ciudadano dentro de un trámite.

export default function Pasos({ PasosDisponibles, PasoActual }) {
  return (
    <ol className="grid gap-2 border border-[#cbd2dc] bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
      {PasosDisponibles.map((Paso, Indice) => {
        const Activo = Indice === PasoActual;
        const Completado = Indice < PasoActual;
        return (
          <li
            key={Paso}
            className={`border-l-4 px-3 py-2 ${
              Activo
                ? "border-[#174a7e] bg-[#edf4fa] font-bold"
                : Completado
                  ? "border-[#237a4b] text-[#185635]"
                  : "border-[#cbd2dc] text-[#647184]"
            }`}
          >
            {Indice + 1}. {Paso}
          </li>
        );
      })}
    </ol>
  );
}