// Agrupa contenido relacionado dentro de una sección visual.

export default function Panel({
  Titulo,
  Descripcion,
  children,
  className = "",
}) {
  return (
    <section className={`border border-[#cbd2dc] bg-white ${className}`}>
      {(Titulo || Descripcion) && (
        <header className="border-b border-[#d7dde5] px-5 py-4">
          {Titulo ? (
            <h2 className="text-xl font-bold text-[#17365d]">{Titulo}</h2>
          ) : null}
          {Descripcion ? (
            <p className="mt-1 text-[#536174]">{Descripcion}</p>
          ) : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}