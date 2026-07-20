// Muestra un botón reutilizable con variantes visuales.

export default function Boton({
  children,
  Tipo = "button",
  Variante = "principal",
  Ocupado = false,
  className = "",
  ...Propiedades
}) {
  const Estilos = {
    principal: "bg-[#174a7e] text-white hover:bg-[#123a63]",
    secundario:
      "border border-[#174a7e] bg-white text-[#174a7e] hover:bg-[#edf4fa]",
    peligro: "bg-[#a62b2b] text-white hover:bg-[#812121]",
    advertencia: "bg-[#d99000] text-[#1f2937] hover:bg-[#b87900]",
    neutro:
      "border border-[#bac3cf] bg-[#eef1f4] text-[#24324a] hover:bg-[#e1e6eb]",
  };

  return (
    <button
      type={Tipo}
      disabled={Ocupado || Propiedades.disabled}
      className={`min-h-11 px-4 py-2 font-semibold transition ${Estilos[Variante]} ${className}`}
      {...Propiedades}
    >
      {Ocupado ? "Procesando..." : children}
    </button>
  );
}