import { Component } from "react";

export default class LimiteError extends Component {
  constructor(props) {
    super(props);
    this.state = { Falla: null };
  }

  static getDerivedStateFromError(Falla) {
    return { Falla };
  }

  componentDidCatch(Falla, Informacion) {
    console.error(
      "Error no controlado en la interfaz:",
      Falla,
      Informacion
    );
  }

  Reiniciar = () => {
    localStorage.removeItem("SglToken");
    localStorage.removeItem("SglUsuario");
    window.location.replace("/login");
  };

  render() {
    if (this.state.Falla) {
      return (
        <main className="contenido">
          <section className="seccion">
            <h1>No fue posible mostrar esta pantalla</h1>
            <p>
              La sesión será reiniciada para recuperar el sistema.
            </p>
            <p className="mensaje error">
              {this.state.Falla?.message ||
                "Se produjo un error inesperado."}
            </p>
            <button
              className="boton"
              type="button"
              onClick={this.Reiniciar}
            >
              Reiniciar sesión
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

