# API principal

## Público

- `GET /api/health`
- `GET /api/tiempo`
- `PUT /api/tiempo`
- `POST /api/auth/login`
- `GET /api/publico/seguimiento/:ruc`
- `GET /api/publico/licencias/:id/:ruc`

## Cajero

- `GET /api/caja/actual`
- `POST /api/caja/apertura`
- `POST /api/caja/inyeccion`
- `POST /api/caja/cierre`
- `GET /api/cajero/ruc/:ruc`
- `POST /api/cajero/dni`
- `POST /api/cajero/solicitudes`
- `POST /api/cajero/solicitudes/:id/pago`
- `GET /api/cajero/renovaciones/:ruc`
- `POST /api/cajero/renovaciones/:id`
- `GET /api/cajero/historial`
- `GET /api/cajero/comprobantes/:id`

## Inspector

- `GET /api/inspector/hoy`
- `GET /api/inspector/inspecciones/:id`
- `GET /api/inspector/inspecciones/:id/plano`
- `POST /api/inspector/inspecciones/:id/aprobar`
- `POST /api/inspector/inspecciones/:id/observar`

## Administrador

- `GET /api/administrador/resumen`
- `POST /api/administrador/solicitudes-caja/:id`
- `POST /api/administrador/cajeros`
- `DELETE /api/administrador/cajeros/:id`
- `PUT /api/administrador/inspector`
- `PUT /api/administrador/alertas/:id`

## SuperAdministrador

- `GET /api/superadministrador/administrador`
- `PUT /api/superadministrador/administrador`
