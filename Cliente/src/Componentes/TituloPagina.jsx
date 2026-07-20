// Muestra el título y la descripción principal de una página.

export default function TituloPagina({ Titulo, Descripcion }) {
  return (
    <header className="mb-7 border-l-4 border-[#f0b429] pl-4">
      <h1 className="text-3xl font-bold tracking-tight text-[#17365d]">
        {Titulo}
      </h1>
      {Descripcion ? (
        <p className="mt-2 max-w-3xl text-[#536174]">{Descripcion}</p>
      ) : null}
    </header>
  );
}