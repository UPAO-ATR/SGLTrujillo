// Muestra el estado actual con un formato uniforme.

const Etiquetas = {
  PAGADO_PENDIENTE: "Pago pendiente",
  EN_PROCESO: "En proceso",
  INSPECCIONADO_OBSERVACIONES: "Con observaciones",
  RECHAZADO: "Rechazado",
  APROBADO: "Aprobado",
  PENDIENTE: "Pendiente",
  PENDIENTE_ESPERA: "En espera de cupo",
  REALIZADA: "Realizada",
  FALLIDA: "Fallida",
  ACTIVA: "Activa",
  VENCIDA: "Vencida",
};

export default function Estado({ Valor }) {
  const Colores = {
    APROBADO: "border-[#237a4b] text-[#185635]",
    ACTIVA: "border-[#237a4b] text-[#185635]",
    REALIZADA: "border-[#237a4b] text-[#185635]",
    RECHAZADO: "border-[#a62b2b] text-[#812121]",
    FALLIDA: "border-[#a62b2b] text-[#812121]",
    VENCIDA: "border-[#a62b2b] text-[#812121]",
    INSPECCIONADO_OBSERVACIONES: "border-[#c37900] text-[#744900]",
  };

  return (
    <span
      className={`inline-block border px-2 py-1 text-sm font-semibold ${Colores[Valor] || "border-[#607086] text-[#39485c]"}`}
    >
      {Etiquetas[Valor] || Valor || "Sin estado"}
    </span>
  );
}