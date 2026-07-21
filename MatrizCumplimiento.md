# Matriz de cumplimiento del flujo corregido

| Requisito | Implementación |
|---|---|
| Trámite presencial por cajero | Módulo `Nueva solicitud` del panel Cajero |
| RUC 20 activo | Consulta CODART y validación del prefijo 20 |
| Local principal y anexos | Normalización de locales y filtro por ubigeo 130101 |
| DNI mayor de edad | Consulta CODART; fecha complementaria si el proveedor no la devuelve |
| Correo y plano PDF | Formulario y validación MIME/extensión |
| Monto visible S/180 y demo S/3 | Módulo de pago híbrido |
| Efectivo + Yape/Plin | Registro separado, validación de suma y número de operación |
| Factura/boleta | PDF académico con campos de referencia tributaria |
| Primera inspección +15 días hábiles | Programador con capacidad máxima de 4 |
| Segunda inspección +30 días hábiles | Generada tras observación de primera visita |
| Inspector solo ve el día actual | Panel filtrado por fecha simulada y máximo 4 tarjetas |
| Observaciones mínimo 10 caracteres | Validación cliente y servidor |
| Estados públicos | En proceso, En observación, Rechazado, Aprobado y Vencido |
| Licencia 365 días hábiles | Cálculo de vencimiento y PDF con marca VENCIDA |
| Renovación presencial | Apartado independiente del cajero |
| Caja realista | Apertura, autorización, movimientos, inyección, cierre, arqueo y descuadre |
| Administrador | Cajeros, inspector, autorizaciones y alertas |
| SuperAdministrador | Cambio de correo y restablecimiento del administrador |
| Simulador temporal | Módulo flotante global |
| Notificaciones | Brevo o registro local, activadas al cambiar la fecha |
