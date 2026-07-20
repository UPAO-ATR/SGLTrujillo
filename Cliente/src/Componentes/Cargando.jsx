// Muestra un indicador mientras termina una operación.

export default function Cargando({ Texto = "Cargando información..." }) {
  return <p className="py-8 text-center font-medium text-[#536174]">{Texto}</p>;
}