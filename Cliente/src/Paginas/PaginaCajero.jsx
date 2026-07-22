import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Api, AbrirArchivoProtegido } from "../Servicios/ClienteApi.js";
import { Area, Boton, Campo, EtiquetaEstado, Mensaje as Aviso, Seccion, Selector } from "../Componentes/Comunes.jsx";

function Numero(Valor) { const N = Number(Valor); return Number.isFinite(N) ? N : 0; }
function Fecha(Valor) { return Valor ? new Date(`${String(Valor).slice(0, 10)}T12:00:00`).toLocaleDateString("es-PE") : "-"; }

function PagoDemostrativo({ codigo, alPagar, bloqueado = false }) {
  const [Efectivo, DefinirEfectivo] = useState("0");
  const [Digital, DefinirDigital] = useState("3");
  const [Medio, DefinirMedio] = useState("YAPE");
  const [Operacion, DefinirOperacion] = useState("");
  const [Qr, DefinirQr] = useState("");
  const [Procesando, DefinirProcesando] = useState(false);
  const Total = Math.round((Numero(Efectivo) + Numero(Digital)) * 100) / 100;
  const Saldo = Math.round((3 - Total) * 100) / 100;
  useEffect(() => {
    if (Numero(Digital) <= 0) return DefinirQr("");
    QRCode.toDataURL(`SGL TRUJILLO | ${codigo || "TRAMITE"} | ${Medio} | MONTO S/ ${Numero(Digital).toFixed(2)} | DEMOSTRACION ACADEMICA`, { width: 230, margin: 1 }).then(DefinirQr);
  }, [Digital, Medio, codigo]);
  async function Confirmar() {
    DefinirProcesando(true);
    try { await alPagar({ montoEfectivo: Numero(Efectivo), montoDigital: Numero(Digital), medioDigital: Numero(Digital) > 0 ? Medio : null, numeroOperacion: Operacion }); }
    finally { DefinirProcesando(false); }
  }
  return <div className="pago"><div className="resumen-pago"><div><span>Tasa oficial</span><b>S/ 180.00</b></div><div><span>Monto demostrativo</span><b>S/ 3.00</b></div><div><span>Total registrado</span><b>S/ {Total.toFixed(2)}</b></div><div><span>Saldo</span><b className={Saldo === 0 ? "texto-correcto" : "texto-error"}>S/ {Saldo.toFixed(2)}</b></div></div><div className="rejilla dos"><Campo etiqueta="Efectivo" type="number" step="0.01" min="0" max="3" value={Efectivo} onChange={(e) => DefinirEfectivo(e.target.value)} /><Campo etiqueta="Yape/Plin" type="number" step="0.01" min="0" max="3" value={Digital} onChange={(e) => DefinirDigital(e.target.value)} /></div>{Numero(Digital) > 0 && <div className="pago-digital"><div><Selector etiqueta="Medio digital" value={Medio} onChange={(e) => DefinirMedio(e.target.value)}><option value="YAPE">Yape</option><option value="PLIN">Plin</option></Selector><Campo etiqueta="Número de operación" value={Operacion} onChange={(e) => DefinirOperacion(e.target.value)} placeholder="Ej. 784512" /></div><div className="qr">{Qr && <img src={Qr} alt="QR demostrativo con monto" />}<small>QR dinámico demostrativo. La verificación es manual por el cajero.</small></div></div>}<Boton disabled={bloqueado || Procesando || Saldo !== 0 || (Numero(Digital) > 0 && Operacion.trim().length < 4)} onClick={Confirmar}>{Procesando ? "Registrando..." : "Confirmar pago recibido"}</Boton></div>;
}

function ModuloCaja({ alCambiar }) {
  const [Datos, DefinirDatos] = useState(null);
  const [MensajeCaja, DefinirMensajeCaja] = useState("");
  const [Monto, DefinirMonto] = useState("100");
  const [Contado, DefinirContado] = useState("0");
  async function Cargar() { try { DefinirDatos(await Api.Get("/caja/actual")); } catch (Error) { DefinirMensajeCaja(Error.message); } }
  useEffect(() => { Cargar(); const F = () => Cargar(); window.addEventListener("tiempoActualizado", F); return () => window.removeEventListener("tiempoActualizado", F); }, []);
  async function Accion(Ruta, Cuerpo = {}) { try { await Api.Post(Ruta, Cuerpo); DefinirMensajeCaja("Solicitud enviada al administrador."); await Cargar(); alCambiar?.(); } catch (Error) { DefinirMensajeCaja(Error.message); } }
  return <Seccion titulo="Caja del día"><Aviso>{MensajeCaja}</Aviso><div className="detalle"><div><span>Fecha</span><b>{Datos?.Fecha || "-"}</b></div><div><span>Estado</span><EtiquetaEstado estado={Datos?.Caja?.estado || "SIN_CAJA"} /></div>{Datos?.Caja && <><div><span>Fondo inicial</span><b>S/ {Numero(Datos.Caja.monto_inicial).toFixed(2)}</b></div><div><span>Efectivo esperado</span><b>S/ {Numero(Datos.Caja.efectivo_esperado).toFixed(2)}</b></div></>}</div>{(!Datos?.Caja || Datos.Caja.estado === "RECHAZADA") && <Boton onClick={() => Accion("/caja/apertura")}>Solicitar apertura</Boton>}{Datos?.Caja?.estado === "SOLICITADA_APERTURA" && <Aviso>La apertura está pendiente de aprobación.</Aviso>}{Datos?.Caja?.estado === "ABIERTA" && <div className="acciones-formulario"><Campo etiqueta="Sencillo solicitado" type="number" step="0.01" min="0.01" value={Monto} onChange={(e) => DefinirMonto(e.target.value)} /><Boton secundario onClick={() => Accion("/caja/inyeccion", { monto: Numero(Monto) })}>Solicitar inyección</Boton><Campo etiqueta="Efectivo contado al cierre" type="number" step="0.01" min="0" value={Contado} onChange={(e) => DefinirContado(e.target.value)} /><Boton secundario onClick={() => Accion("/caja/cierre", { montoContado: Numero(Contado) })}>Solicitar cierre y arqueo</Boton></div>}{Datos?.Caja?.estado === "SOLICITADA_CIERRE" && <Aviso>El cierre está pendiente de aprobación del administrador.</Aviso>}{Datos?.Solicitudes?.length > 0 && <div className="lista-simple"><h3>Solicitudes pendientes</h3>{Datos.Solicitudes.map((Item) => <p key={Item.id}>{Item.tipo}: pendiente</p>)}</div>}</Seccion>;
}

function NuevaSolicitud({ alCompletar }) {
  const [Ruc, DefinirRuc] = useState("");
  const [DatosRuc, DefinirDatosRuc] = useState(null);
  const [CodigoLocal, DefinirCodigoLocal] = useState("");
  const [Dni, DefinirDni] = useState("");
  const [FechaNacimiento, DefinirFechaNacimiento] = useState("");
  const [DatosDni, DefinirDatosDni] = useState(null);
  const [Correo, DefinirCorreo] = useState("");
  const [Plano, DefinirPlano] = useState(null);
  const [Tramite, DefinirTramite] = useState(null);
  const [ResultadoPago, DefinirResultadoPago] = useState(null);
  const [Mensaje, DefinirMensaje] = useState("");
  async function ConsultarRuc() { try { const R = await Api.Get(`/cajero/ruc/${Ruc}`); DefinirDatosRuc(R.Datos); DefinirCodigoLocal(R.Datos.SeleccionAutomatica || R.Datos.Locales[0]?.Codigo || ""); DefinirMensaje(""); } catch (Error) { DefinirMensaje(Error.message); DefinirDatosRuc(null); } }
  async function ConsultarDni() { try { const R = await Api.Post("/cajero/dni", { dni: Dni, fechaNacimiento: FechaNacimiento || null }); DefinirDatosDni(R.Datos); DefinirMensaje(R.Datos.RequiereFechaNacimiento ? "Completa la fecha de nacimiento y vuelve a validar." : "DNI validado correctamente."); } catch (Error) { DefinirMensaje(Error.message); DefinirDatosDni(null); } }
  async function Crear(Evento) { Evento.preventDefault(); try { const Formulario = new FormData(); Formulario.append("ruc", Ruc); Formulario.append("codigoLocal", CodigoLocal); Formulario.append("dni", Dni); Formulario.append("fechaNacimiento", FechaNacimiento); Formulario.append("correo", Correo); Formulario.append("plano", Plano); const R = await Api.Post("/cajero/solicitudes", Formulario); DefinirTramite(R.Tramite); DefinirMensaje("Solicitud creada. Registra el pago para programar la inspección."); } catch (Error) { DefinirMensaje(Error.message); } }
  async function Pagar(Datos) { try { const R = await Api.Post(`/cajero/solicitudes/${Tramite.id}/pago`, Datos); DefinirResultadoPago(R); DefinirMensaje(`Pago registrado. Primera inspección: ${R.FechaInspeccionFormateada}.`); alCompletar?.(); } catch (Error) { DefinirMensaje(Error.message); throw Error; } }
  if (Tramite && !ResultadoPago) return <Seccion titulo={`Solicitud ${Tramite.codigo} pendiente de pago`}><Aviso tipo="advertencia">{"Solicitud creada. El pago debe confirmarse manualmente desde la pesta\u00f1a Confirmar pagos."}</Aviso><p>{"El cliente realiza el Yape o Plin fuera del sistema. El cajero revisa que el dinero haya llegado y luego registra el n\u00famero de operaci\u00f3n en la pesta\u00f1a externa."}</p></Seccion>;
  if (ResultadoPago) return <Seccion titulo="Solicitud completada"><Aviso tipo="exito">{Mensaje}</Aviso><p>El correo fue registrado para envío y la inspección quedó asignada.</p><Boton onClick={() => AbrirArchivoProtegido(`/cajero/comprobantes/${Tramite.id}`)}>Abrir factura demostrativa</Boton><Boton secundario onClick={() => { DefinirTramite(null); DefinirResultadoPago(null); DefinirDatosRuc(null); DefinirDatosDni(null); DefinirRuc(""); DefinirDni(""); DefinirCorreo(""); DefinirPlano(null); }}>Atender otro cliente</Boton></Seccion>;
  return <Seccion titulo="Nueva solicitud de licencia"><Aviso tipo={Mensaje.includes("correctamente") ? "exito" : "informacion"}>{Mensaje}</Aviso><form onSubmit={Crear}><div className="paso"><h3>1. Empresa y local</h3><div className="fila-accion"><Campo etiqueta="RUC de empresa (20...)" value={Ruc} maxLength="11" onChange={(e) => DefinirRuc(e.target.value.replace(/\D/g,""))} required /><Boton type="button" onClick={ConsultarRuc}>Validar RUC</Boton></div>{DatosRuc && <><div className="detalle"><div><span>Razón social</span><b>{DatosRuc.RazonSocial}</b></div><div><span>Estado</span><b>{DatosRuc.Estado}</b></div></div><Selector etiqueta="Local operativo en Trujillo" value={CodigoLocal} onChange={(e) => DefinirCodigoLocal(e.target.value)}>{DatosRuc.Locales.map((Local) => <option key={`${Local.Codigo}-${Local.Direccion}`} value={Local.Codigo}>{Local.Tipo}: {Local.Direccion}</option>)}</Selector></>}</div><div className="paso"><h3>2. Titular y contacto</h3><div className="fila-accion"><Campo etiqueta="DNI" value={Dni} maxLength="8" onChange={(e) => DefinirDni(e.target.value.replace(/\D/g,""))} required /><Boton type="button" onClick={ConsultarDni}>Validar DNI</Boton></div><Campo etiqueta="Fecha de nacimiento complementaria" type="date" value={FechaNacimiento} onChange={(e) => DefinirFechaNacimiento(e.target.value)} /><Campo etiqueta="Correo de contacto" type="email" value={Correo} onChange={(e) => DefinirCorreo(e.target.value)} required />{DatosDni && <p>Titular: <b>{DatosDni.NombreCompleto}</b>{DatosDni.Edad !== null && `, ${DatosDni.Edad} años`}</p>}</div><div className="paso"><h3>3. Plano</h3><Campo etiqueta="Plano del negocio en PDF" type="file" accept="application/pdf,.pdf" onChange={(e) => DefinirPlano(e.target.files?.[0] || null)} required /></div><Boton disabled={!DatosRuc || !DatosDni || DatosDni.RequiereFechaNacimiento || !Plano}>Crear solicitud y pasar a pago</Boton></form></Seccion>;
}

function Renovacion({ alCompletar }) {
  const [Ruc, DefinirRuc] = useState("");
  const [Licencias, DefinirLicencias] = useState([]);
  const [Elegida, DefinirElegida] = useState(null);
  const [Dni, DefinirDni] = useState("");
  const [FechaNacimiento, DefinirFechaNacimiento] = useState("");
  const [Correo, DefinirCorreo] = useState("");
  const [Mensaje, DefinirMensaje] = useState("");
  const [Completada, DefinirCompletada] = useState(null);
  async function Buscar() { try { const R = await Api.Get(`/cajero/renovaciones/${Ruc}`); DefinirLicencias(R.Licencias); DefinirElegida(null); DefinirMensaje(R.Licencias.length ? "Selecciona el local." : "No hay licencias aprobadas o vencidas para este RUC."); } catch (Error) { DefinirMensaje(Error.message); } }
  async function Renovar(DatosPago) { try { const R = await Api.Post(`/cajero/renovaciones/${Elegida.id}`, { ...DatosPago, dni: Dni, fechaNacimiento: FechaNacimiento || null, correo: Correo || Elegida.correo }); DefinirCompletada(R); DefinirMensaje(`Renovación completada. Vigencia hasta ${R.FechaVencimientoFormateada}.`); alCompletar?.(); } catch (Error) { DefinirMensaje(Error.message); throw Error; } }
  return <Seccion titulo="Renovación de licencia"><Aviso>{Mensaje}</Aviso><div className="fila-accion"><Campo etiqueta="RUC" value={Ruc} maxLength="11" onChange={(e) => DefinirRuc(e.target.value.replace(/\D/g,""))} /><Boton onClick={Buscar}>Buscar licencias</Boton></div>{Licencias.length > 0 && <div className="tarjetas">{Licencias.map((Item) => <button key={Item.id} className={`tarjeta seleccionable ${Elegida?.id === Item.id ? "seleccionada" : ""}`} onClick={() => DefinirElegida(Item)}><b>{Item.direccion}</b><EtiquetaEstado estado={Item.estado} /><span>Vence: {Fecha(Item.fecha_vencimiento)}</span></button>)}</div>}{Elegida?.estado === "APROBADO" && <Aviso tipo="advertencia">La licencia sigue activa y vence el {Fecha(Elegida.fecha_vencimiento)}. No se permite renovarla todavía.</Aviso>}{Elegida?.estado === "VENCIDO" && !Completada && <><div className="rejilla dos"><Campo etiqueta="DNI del titular" value={Dni} maxLength="8" onChange={(e) => DefinirDni(e.target.value.replace(/\D/g,""))} /><Campo etiqueta="Fecha de nacimiento complementaria" type="date" value={FechaNacimiento} onChange={(e) => DefinirFechaNacimiento(e.target.value)} /><Campo etiqueta="Correo de contacto" type="email" value={Correo} onChange={(e) => DefinirCorreo(e.target.value)} placeholder={Elegida.correo} /></div><PagoDemostrativo codigo={Elegida.codigo} bloqueado={Dni.length !== 8} alPagar={Renovar} /></>}{Completada && <><Aviso tipo="exito">{Mensaje}</Aviso><Boton onClick={() => AbrirArchivoProtegido(`/cajero/comprobantes/${Completada.TramiteId}`)}>Abrir boleta demostrativa</Boton></>}</Seccion>;
}

function PagoPendienteManual({ tramite, alConfirmar }) {
 const [Efectivo, DefinirEfectivo] = useState("0");
 const [Digital, DefinirDigital] = useState("3");
 const [Medio, DefinirMedio] = useState("YAPE");
 const [Operacion, DefinirOperacion] = useState("");
 const [Procesando, DefinirProcesando] = useState(false);
 const Total = Math.round((Numero(Efectivo) + Numero(Digital)) * 100) / 100;
 const Saldo = Math.round((3 - Total) * 100) / 100;
 const Listo = Saldo === 0 && (Numero(Digital) <= 0 || Operacion.trim().length >= 4);

 async function Confirmar() {
  DefinirProcesando(true);
  try {
   await alConfirmar(tramite, {
    montoEfectivo: Numero(Efectivo),
    montoDigital: Numero(Digital),
    medioDigital: Numero(Digital) > 0 ? Medio : null,
    numeroOperacion: Numero(Digital) > 0 ? Operacion.trim() : null
   });
  } finally {
   DefinirProcesando(false);
  }
 }

 return <div className="paso"><h3>{`Tr\u00e1mite ${tramite.codigo}`}</h3><div className="detalle"><div><span>RUC</span><b>{tramite.ruc}</b></div><div><span>Raz\u00f3n social</span><b>{tramite.razon_social}</b></div><div><span>Local</span><b>{tramite.direccion}</b></div><div><span>Estado</span><EtiquetaEstado estado={tramite.estado} /></div></div><Aviso tipo="informacion">{"Primero verifica en el celular que el Yape o Plin haya llegado. Este bot\u00f3n reemplaza la validaci\u00f3n autom\u00e1tica del QR."}</Aviso><figure style={{ margin: "18px auto", maxWidth: "320px", textAlign: "center" }}><img src="/QRYapeSGL.png" alt="QR de Yape para pago manual" style={{ display: "block", width: "100%", height: "auto", border: "1px solid #d1d5db" }} /><figcaption style={{ marginTop: "8px" }}>{"QR est\u00e1tico de Yape. El cajero confirma manualmente el pago recibido."}</figcaption></figure><div className="resumen-pago"><div><span>Tasa oficial</span><b>S/ 180.00</b></div><div><span>Monto demostrativo</span><b>S/ 3.00</b></div><div><span>Total registrado</span><b>S/ {Total.toFixed(2)}</b></div><div><span>Saldo</span><b className={Saldo === 0 ? "texto-correcto" : "texto-error"}>S/ {Saldo.toFixed(2)}</b></div></div><div className="rejilla dos"><Campo etiqueta="Efectivo" type="number" step="0.01" min="0" max="3" value={Efectivo} onChange={(e) => DefinirEfectivo(e.target.value)} /><Campo etiqueta="Yape/Plin recibido" type="number" step="0.01" min="0" max="3" value={Digital} onChange={(e) => DefinirDigital(e.target.value)} /></div>{Numero(Digital) > 0 && <div className="rejilla dos"><Selector etiqueta="Medio digital" value={Medio} onChange={(e) => DefinirMedio(e.target.value)}><option value="YAPE">Yape</option><option value="PLIN">Plin</option></Selector><Campo etiqueta={"N\u00famero de operaci\u00f3n"} value={Operacion} onChange={(e) => DefinirOperacion(e.target.value)} placeholder="Ej. 784512" /></div>}<Boton disabled={!Listo || Procesando} onClick={Confirmar}>{Procesando ? "Registrando..." : "Pago verificado: continuar tr\u00e1mite"}</Boton></div>;
}

function ConfirmacionPagos({ version, alCompletar }) {
 const [Pendientes, DefinirPendientes] = useState([]);
 const [MensajePagos, DefinirMensajePagos] = useState("");

 async function Cargar() {
  try {
   const R = await Api.Get("/cajero/historial");
   DefinirPendientes(R.Tramites.filter((Item) => Item.estado === "PENDIENTE_PAGO"));
  } catch (Error) {
   DefinirMensajePagos(Error.message);
  }
 }

 useEffect(() => {
  Cargar();
 }, [version]);

 async function Confirmar(Tramite, DatosPago) {
  try {
   const R = await Api.Post(`/cajero/solicitudes/${Tramite.id}/pago`, DatosPago);
   DefinirMensajePagos(`Pago confirmado. Primera inspecci\u00f3n: ${R.FechaInspeccionFormateada}.`);
   await Cargar();
   alCompletar?.();
  } catch (Error) {
   DefinirMensajePagos(Error.message);
   throw Error;
  }
 }

 return <Seccion titulo={"Confirmaci\u00f3n manual de pagos"}><Aviso tipo={MensajePagos.includes("confirmado") ? "exito" : "informacion"}>{MensajePagos}</Aviso><p>{"Esta pantalla es independiente del registro de la solicitud. El cajero solo confirma cuando comprueba en su celular que el dinero fue recibido."}</p>{Pendientes.length === 0 ? <Aviso>{"No hay solicitudes pendientes de pago para este cajero."}</Aviso> : Pendientes.map((Item) => <PagoPendienteManual key={Item.id} tramite={Item} alConfirmar={Confirmar} />)}</Seccion>;
}
function Historial({ version }) {
  const [Datos, DefinirDatos] = useState([]);
  useEffect(() => { Api.Get("/cajero/historial").then((r) => DefinirDatos(r.Tramites)).catch(() => {}); }, [version]);
  return <Seccion titulo="Historial de atención"><div className="tabla-contenedor"><table><thead><tr><th>Código</th><th>Tipo</th><th>RUC</th><th>Local</th><th>Estado</th><th>Comprobante</th></tr></thead><tbody>{Datos.map((Item) => <tr key={Item.id}><td>{Item.codigo}</td><td>{Item.tipo}</td><td>{Item.ruc}</td><td>{Item.direccion}</td><td><EtiquetaEstado estado={Item.estado} /></td><td>{Item.comprobante_disponible && <button className="enlace-texto" onClick={() => AbrirArchivoProtegido(`/cajero/comprobantes/${Item.id}`)}>Abrir</button>}</td></tr>)}</tbody></table></div></Seccion>;
}

export default function PaginaCajero() {
  const [Pestana, DefinirPestana] = useState("solicitud");
  const [Version, DefinirVersion] = useState(0);
  return <div className="pagina"><h1>Atención presencial de licencias</h1><p>La caja debe estar autorizada antes de registrar solicitudes o renovaciones.</p><ModuloCaja alCambiar={() => DefinirVersion((v) => v + 1)} /><div className="pestanas"><button className={Pestana === "solicitud" ? "activa" : ""} onClick={() => DefinirPestana("solicitud")}>Nueva solicitud</button><button className={Pestana === "renovacion" ? "activa" : ""} onClick={() => DefinirPestana("renovacion")}>Renovación</button><button className={Pestana === "pagos" ? "activa" : ""} onClick={() => DefinirPestana("pagos")}>Confirmar pagos</button><button className={Pestana === "historial" ? "activa" : ""} onClick={() => DefinirPestana("historial")}>Historial</button></div>{Pestana === "solicitud" && <NuevaSolicitud alCompletar={() => DefinirVersion((v) => v + 1)} />}{Pestana === "renovacion" && <Renovacion alCompletar={() => DefinirVersion((v) => v + 1)} />}{Pestana === "pagos" && <ConfirmacionPagos version={Version} alCompletar={() => DefinirVersion((v) => v + 1)} />}{Pestana === "historial" && <Historial version={Version} />}</div>;
}
