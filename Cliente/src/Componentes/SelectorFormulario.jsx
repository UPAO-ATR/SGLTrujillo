// Muestra una lista de opciones dentro de un formulario.

export default function SelectorFormulario({
  Etiqueta,
  Opciones,
  Obligatorio = false,
  ...Propiedades
}) {
  const Identificador = Propiedades.id || Propiedades.name;

  return (
    <label htmlFor={Identificador} className="block">
      <span className="mb-1 block font-semibold text-[#24324a]">
        {Etiqueta}
        {Obligatorio ? " *" : ""}
      </span>
      <select
        id={Identificador}
        required={Obligatorio}
        className="min-h-11 w-full border border-[#aeb8c5] bg-white px-3 py-2"
        {...Propiedades}
      >
        {Opciones.map((Opcion) => (
          <option key={Opcion.Valor} value={Opcion.Valor}>
            {Opcion.Etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}