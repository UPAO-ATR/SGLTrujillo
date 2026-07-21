import Aplicacion from "./Aplicacion.js";
import { Configuracion, ValidarConfiguracion } from "./Configuracion/Configuracion.js";

ValidarConfiguracion();
const Servidor = Aplicacion.listen(Configuracion.Puerto, "0.0.0.0", () => {
  console.log(`SGL Trujillo V2 disponible en el puerto ${Configuracion.Puerto}.`);
});

function Cerrar() {
  Servidor.close(() => process.exit(0));
}
process.on("SIGTERM", Cerrar);
process.on("SIGINT", Cerrar);
