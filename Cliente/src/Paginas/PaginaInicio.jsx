import { Link } from "react-router-dom";

export default function PaginaInicio() {
  return <div className="portada">
    <div className="portada-texto">
      <p className="sobrelinea">Municipalidad Distrital de Trujillo</p>
      <h1>Sistema de Gestión de Licencias de Funcionamiento</h1>
      <p>Consulta el estado de una licencia por RUC o ingresa al módulo interno para realizar la atención presencial.</p>
      <div className="acciones"><Link className="boton enlace" to="/seguimiento">Consultar mi trámite</Link><Link className="boton secundario enlace" to="/login">Ingresar al sistema</Link></div>
    </div>
    <div className="portada-proceso"><h2>Flujo presencial</h2><ol><li>El cliente entrega sus datos al cajero.</li><li>El cajero valida RUC, DNI, local y plano PDF.</li><li>Se registra el pago efectivo, Yape/Plin o combinado.</li><li>El sistema programa la inspección y notifica por correo.</li><li>El inspector aprueba, observa o rechaza.</li></ol></div>
  </div>;
}
