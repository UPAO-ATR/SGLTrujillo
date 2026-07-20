// Define los medios de pago permitidos por canal.

export const MediosPago = Object.freeze({
  Tarjeta: "TARJETA",
  Yape: "YAPE",
  Plin: "PLIN",
  Cip: "CIP",
  Efectivo: "EFECTIVO",
});
export const MediosPagoCiudadano = [
  MediosPago.Tarjeta,
  MediosPago.Yape,
  MediosPago.Plin,
  MediosPago.Cip,
];
export const MediosPagoCajera = [
  MediosPago.Yape,
  MediosPago.Plin,
  MediosPago.Efectivo,
];