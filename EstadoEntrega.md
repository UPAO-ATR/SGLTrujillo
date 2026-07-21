# Estado de la entrega

## Implementado

- Aplicación nueva e independiente del flujo anterior.
- Frontend React responsive.
- Backend Express modular.
- PostgreSQL con esquema aislado `sgl_flujo_corregido`.
- Atención presencial por cajero.
- Apertura, inyección, cierre, arqueo y alerta de descuadre.
- Validación RUC 20, local principal/anexos, ubigeo 130101, DNI adulto, correo y PDF.
- Pago híbrido demostrativo S/3 con efectivo y Yape/Plin.
- QR dinámico demostrativo y número de operación.
- Factura para solicitud y boleta para renovación, ambas académicas.
- Primera inspección a 15 días hábiles, segunda a 30 y capacidad de cuatro por día.
- Inspector limitado a las inspecciones pendientes del día.
- Seguimiento público por RUC y local.
- Estados En proceso, En observación, Rechazado, Aprobado y Vencido.
- Licencia con 365 días hábiles de vigencia y marca de agua vencida.
- Notificaciones para cliente e inspector.
- Administrador y SuperAdministrador limitados a las acciones solicitadas.
- Simulador temporal flotante global.
- Scripts de respaldo, instalación, verificación y publicación.
- Render Blueprint y GitHub Actions.

## Verificado en esta entrega

- 7 pruebas automatizadas aprobadas.
- Construcción limpia con el mismo comando usado por Render.
- Carga del frontend de producción con HTTP 200.
- Importación correcta del servidor.
- Sintaxis de JavaScript revisada.
- Creación sintáctica de las 14 tablas en un motor PostgreSQL embebido.

## Verificación pendiente en la infraestructura del grupo

No se ejecutó una prueba de extremo a extremo contra la base Neon real porque sus credenciales no están incluidas en el archivo entregado. El primer push debe comprobarse mediante `/api/health` y el recorrido indicado en `GuiaDemostracion.md`.

## Límites declarados

- El QR representa una orden académica y la confirmación es manual.
- No existe conexión automática con Yape o Plin.
- Los comprobantes PDF no son documentos tributarios electrónicos autorizados por SUNAT.
- Sin GCS, los archivos locales de Render no son persistentes después de reinicios.
