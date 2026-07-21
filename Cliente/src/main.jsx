import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import LimiteError from "./Componentes/LimiteError.jsx";
import "./Estilos/Principal.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <LimiteError>
    <App />
  </LimiteError>
);
