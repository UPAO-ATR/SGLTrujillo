// Solicita confirmación antes de ejecutar una acción sensible.

import Boton from "./Boton.jsx";

export default function Confirmacion({
  Titulo,
  Mensaje,
  AlConfirmar,
  AlCancelar,
  Ocupado,
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md border border-[#8793a3] bg-white p-6">
        <h2 className="text-xl font-bold text-[#17365d]">{Titulo}</h2>
        <p className="mt-3 text-[#39485c]">{Mensaje}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Boton Variante="neutro" onClick={AlCancelar} disabled={Ocupado}>
            Cancelar
          </Boton>
          <Boton Variante="peligro" onClick={AlConfirmar} Ocupado={Ocupado}>
            Confirmar
          </Boton>
        </div>
      </div>
    </div>
  );
}