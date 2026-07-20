// Muestra un campo de formulario con etiqueta y mensaje de error.

export default function CampoFormulario({
  Etiqueta,
  Ayuda,
  Error,
  Tipo = "text",
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
      <input
        id={Identificador}
        type={Tipo}
        required={Obligatorio}
        className={`min-h-11 w-full border bg-white px-3 py-2 text-[#172033] ${
          Error ? "border-[#a62b2b]" : "border-[#aeb8c5]"
        }`}
        {...Propiedades}
      />
      {Ayuda && !Error ? (
        <span className="mt-1 block text-sm text-[#536174]">{Ayuda}</span>
      ) : null}
      {Error ? (
        <span className="mt-1 block text-sm text-[#a62b2b]">{Error}</span>
      ) : null}
    </label>
  );
}