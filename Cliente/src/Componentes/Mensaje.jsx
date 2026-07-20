// Muestra mensajes de éxito, advertencia o error.

export default function Mensaje({ Tipo = "informacion", children }) {
  if (!children) return null;

  const Estilos = {
    informacion: "border-[#2c6e9d] bg-[#edf5fa] text-[#193c56]",
    exito: "border-[#237a4b] bg-[#edf8f2] text-[#185635]",
    error: "border-[#a62b2b] bg-[#fbefef] text-[#812121]",
    advertencia: "border-[#c37900] bg-[#fff8e6] text-[#744900]",
  };

  return (
    <div className={`border-l-4 px-4 py-3 ${Estilos[Tipo]}`}>{children}</div>
  );
}