# API REST

Todas las respuestas JSON usan `Exito` y `Datos`. Los errores incluyen `Mensaje`, `Codigo` y, cuando corresponde, `Detalles`.

## Salud

- `GET /api/health`

## Públicas y ciudadano

- `GET /api/negocios/ruc/:ruc`
- `POST /api/solicitudes`
- `GET /api/solicitudes/:codigo`
- `POST /api/solicitudes/:id/plano?Codigo=...`
- `GET /api/solicitudes/:id/plano/descargar?Codigo=...`
- `POST /api/solicitudes/:id/checkout?Codigo=...`
- `POST /api/pagos/webhook`
- `POST /api/pagos/:id/confirmarDemostracion?Codigo=...`
- `POST /api/pagos/:id/confirmarPresencial` (solo cajera)
- `GET /api/boletas/:solicitudId/descargar?Codigo=...`
- `GET /api/licencias/ruc/:ruc`
- `GET /api/licencias/:solicitudId/descargar?Codigo=...`

## Autenticación

- `POST /api/auth/login`
- `GET /api/auth/sesion`
- `POST /api/auth/cambiarContrasena`

## Inspector y administrador

- `GET /api/inspecciones`
- `GET /api/inspecciones/:id`
- `PATCH /api/inspecciones/:id`
- `POST /api/inspecciones/:id/observaciones`
- `POST /api/inspecciones/tareas/reprogramar`

El administrador puede consultar; únicamente el inspector puede registrar resultados.

## Cajera

- `GET /api/caja/actual`
- `POST /api/caja/abrir`
- `POST /api/caja/transacciones`
- `POST /api/caja/sangrias`
- `POST /api/caja/arqueo`
- `POST /api/caja/cerrar`

## Administración

- `GET /api/inspectores`
- `POST /api/inspectores`
- `PATCH /api/inspectores/:id/disponibilidad`
- `GET /api/administracion/inspectores`
- `GET /api/administracion/cajeras`
- `GET /api/administracion/trabajadores/dni/:dni`
- `POST /api/administracion/trabajadores`
- `PATCH /api/administracion/trabajadores/:id/habilitacion`
- `GET /api/administracion/configuraciones`
- `PATCH /api/administracion/configuraciones`
- `GET /api/administracion/feriados`
- `POST /api/administracion/feriados`
- `GET /api/administracion/alertas`
- `PATCH /api/administracion/alertas/:id/atendida`
- `GET /api/administracion/auditoria`

## Super administrador

- `POST /api/administracion/administradores`
- `GET /api/administracion/auditoria`

## Archivos temporales en modo local

- `GET /api/archivos/local/:token`