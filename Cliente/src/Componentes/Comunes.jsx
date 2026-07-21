export function Mensaje({ tipo = "informacion", children }) {
  if (!children) return null;
  return <div className={`mensaje ${tipo}`}>{children}</div>;
}

export function Campo({ etiqueta, ...propiedades }) {
  return <label className="campo"><span>{etiqueta}</span><input {...propiedades} /></label>;
}

export function Selector({ etiqueta, children, ...propiedades }) {
  return <label className="campo"><span>{etiqueta}</span><select {...propiedades}>{children}</select></label>;
}

export function Area({ etiqueta, ...propiedades }) {
  return <label className="campo"><span>{etiqueta}</span><textarea {...propiedades} /></label>;
}

export function Boton({ secundario = false, peligro = false, ...propiedades }) {
  const Clase = peligro ? "boton peligro" : secundario ? "boton secundario" : "boton";
  return <button className={Clase} {...propiedades} />;
}

export function Seccion({ titulo, acciones, children }) {
  return <section className="seccion"><header><h2>{titulo}</h2>{acciones}</header>{children}</section>;
}

export function EtiquetaEstado({ estado }) {
  return <span className={`estado estado-${String(estado).toLowerCase().replaceAll("_", "-")}`}>{String(estado).replaceAll("_", " ")}</span>;
}

export function Cargando() { return <div className="cargando">Procesando...</div>; }
