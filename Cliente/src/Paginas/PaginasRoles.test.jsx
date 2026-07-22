import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PaginaAdministrador from "./PaginaAdministrador.jsx";
import PaginaCajero from "./PaginaCajero.jsx";
import PaginaInspector from "./PaginaInspector.jsx";
import PaginaSuperAdministrador from "./PaginaSuperAdministrador.jsx";

const Paginas = [
  ["cajero", PaginaCajero],
  ["inspector", PaginaInspector],
  ["administrador", PaginaAdministrador],
  ["superadministrador", PaginaSuperAdministrador]
];

describe("paneles por rol", () => {
  it.each(Paginas)("renderiza el panel de %s", (_, Pagina) => {
    expect(() => renderToString(<Pagina />)).not.toThrow();
  });
});
