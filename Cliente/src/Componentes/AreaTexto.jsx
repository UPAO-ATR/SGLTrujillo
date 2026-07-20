// Muestra un campo de texto amplio con su etiqueta y validación.

export default function AreaTexto({
  Etiqueta,
  Ayuda,
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
      <textarea
        id={Identificador}
        required={Obligatorio}
        className="min-h-28 w-full resize-y border border-[#aeb8c5] bg-white px-3 py-2"
        {...Propiedades}
      />
      {Ayuda ? (
        <span className="mt-1 block text-sm text-[#536174]">{Ayuda}</span>
      ) : null}
    </label>
  );
}