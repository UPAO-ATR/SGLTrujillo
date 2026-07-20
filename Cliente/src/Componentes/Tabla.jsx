// Muestra registros en una tabla reutilizable.

export default function Tabla({
  Columnas,
  Filas,
  MensajeVacio = "No hay registros disponibles.",
}) {
  if (!Filas?.length)
    return <p className="py-6 text-center text-[#536174]">{MensajeVacio}</p>;

  return (
    <div className="TablaResponsiva">
      <table>
        <thead>
          <tr>
            {Columnas.map((Columna) => (
              <th key={Columna.Clave}>{Columna.Titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Filas.map((Fila, Indice) => (
            <tr key={Fila.id || Fila.Id || Indice}>
              {Columnas.map((Columna) => (
                <td key={Columna.Clave}>
                  {Columna.Renderizar
                    ? Columna.Renderizar(Fila)
                    : (Fila[Columna.Clave] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}