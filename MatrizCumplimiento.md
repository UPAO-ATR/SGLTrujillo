# Matriz de cumplimiento de la versión literal

Esta matriz permite localizar rápidamente cada requisito en el proyecto. Los estados distinguen entre lógica implementada, integración que necesita credenciales y verificación que solo puede completarse después del despliegue.

## Requisitos funcionales

| Requisito | Estado | Evidencia principal |
|---|---|---|
| RF-01 | Implementado | `Cliente/src/Paginas/PaginaNegocio.jsx`, `Servidor/src/Rutas/RutasPublicas.js` |
| RF-02 | Implementado; CODART real requiere token | `ClienteCodart.js`, `ServicioSolicitudes.ConsultarRuc` |
| RF-03 | Implementado | `ServicioSolicitudes.CrearSolicitud`, panel de renovación en `PaginaNegocio.jsx` |
| RF-04 | Implementado; GCS real requiere credenciales | `SubidaArchivos.js`, `GuardarPlano`, `AlmacenArchivos.js` |
| RF-05 | Implementado | Zod, `ValidarCorreoDesechable.js`, `ServicioNotificaciones.js` |
| RF-06 | Implementado para demostración; checkout real requiere Mercado Pago | selector de medios en `PaginaNegocio.jsx`, `ClienteMercadoPago.js` |
| RF-07 | Implementado | `ServicioPagos.ConfirmarPago`, transacción e idempotencia |
| RF-08 | Implementado | `GenerarCodigoAleatorio`, índice único y constancia PDF |
| RF-09 | Implementado | `PaginaSeguimiento.jsx`, `ConsultarSeguimiento` |
| RF-10 | Implementado; URL GCS real requiere credenciales | `ServicioLicencias`, `GeneradorLicencia.js` |
| RF-11 | Implementado | consulta de licencia y panel de renovación |
| RF-12 | Implementado | renovación `PAGO_DIRECTO` en `ServicioPagos` |
| RF-13 | Implementado | renovación con tipo `NUEVA`, plano y flujo de inspección |
| RF-14 | Implementado | `AplicarMarcaAguaVencida` y copia histórica |
| RF-15 | Implementado | `CrearPrimeraInspeccion`, `CrearSegundaInspeccion` |
| RF-16 | Implementado | cálculo de cupos, horario, feriados y bloqueo transaccional |
| RF-17 | Implementado | estado `PENDIENTE_ESPERA` y tarea programada |
| RF-18 | Implementado | `ReprogramarNoRealizadas` y `ReordenarDesdeFecha` |
| RF-19 | Implementado | login, rol inspector y restricción de un habilitado |
| RF-20 | Implementado | filtro por día actual y retiro al registrar resultado |
| RF-21 | Implementado | detalle, plano, visita y observaciones anteriores |
| RF-22 | Implementado; GCS real requiere credenciales | aprobación y generación automática de licencia |
| RF-23 | Implementado | segunda visita automática y rechazo definitivo |
| RF-24 | Implementado | usuario de cajera y ruta `/login` |
| RF-25 | Implementado | flujo presencial, PDF/JPG/PNG, Yape/Plin/efectivo |
| RF-26 | Implementado | renovación presencial directa desde el panel de cajera |
| RF-27 | Implementado | fondo S/ 1,000, arqueo, bloqueo y alerta al administrador |
| RF-28 | Implementado | historial y filtro por medio de pago |
| RF-29 | Implementado | cálculo de efectivo, bloqueo y sangría obligatoria |
| RF-30 | Implementado | administrador de solo lectura, reemplazo y límite de cajeras |
| RF-31 | Implementado | deshabilitación y creación de un único reemplazo |
| RF-32 | Implementado | filtros, estados y detalle reutilizado en solo lectura |
| RF-33 | Implementado; mayoría de edad depende del dato de CODART | DNI único, autocompletado y validación de edad |
| RF-34 | Implementado | `GenerarCorreoInstitucional` con aumento progresivo de dígitos |
| RF-35 | Implementado | entrada 08:00–11:00 y salida calculada a ocho horas |
| RF-36 | Implementado | valores 6, 7 u 8 y reordenamiento al reducir capacidad |
| RF-37 | Implementado | índice único y servicio exclusivo del super administrador |
| RF-38 | Implementado | cambio de contraseña con contraseña actual y hash nuevo |
| RF-39 | Implementado | auditoría y trigger que prohíbe actualizar o eliminar |
| RF-40 | Implementado | `IMAGEN_LICENCIA.jpeg`, pdfkit y formato de número |
| RF-41 | Implementado | constantes y validadores de transiciones de estado |
| RF-42 | Implementado | rutas REST documentadas en `Servidor/DocumentacionApi.md` |

## Requisitos no funcionales

| Requisito | Estado | Evidencia principal |
|---|---|---|
| RNF-01 | Implementado | JWT, middleware de autenticación y autorización por rol |
| RNF-02 | Implementado | bcrypt, secretos por entorno y HTTPS proporcionado por Render |
| RNF-03 | Implementado | archivos privados y URLs temporales; modo local firmado para demostración |
| RNF-04 | Implementado | firma de webhook, bloqueo transaccional e idempotencia |
| RNF-05 | Implementado | auditoría append-only mediante trigger PostgreSQL |
| RNF-06 | Lógica preparada; rendimiento debe medirse desplegado | `/api/health`, consultas indexadas y generación PDF probada |
| RNF-07 | Lógica preparada; carga simultánea debe probarse desplegada | índices, transacciones y límites configurables |
| RNF-08 | Ajustado con autorización | despliegue Render y `/api/health`; no se promete SLA del 99 % |
| RNF-09 | Implementado | errores controlados, reintentos de correo y almacenamiento |
| RNF-10 | Implementado | transacciones, `pg_advisory_xact_lock` y tareas reentrantes |
| RNF-11 | Implementado | pasos visibles, mensajes en español y acciones explícitas |
| RNF-12 | Implementado | estilos responsivos y tablas con desplazamiento horizontal |
| RNF-13 | Implementado | configuración de tamaño, capacidad, horario, cajeras, sangría y feriados |
| RNF-14 | Implementado | módulos por dominio y documentación técnica |
| RNF-15 | Implementado | clientes independientes para CODART, Mercado Pago, GCS y correo |
| RNF-16 | Build compatible; comprobación manual pendiente | revisar Chrome, Edge, Firefox y Safari tras publicar |
| RNF-17 | Implementado a nivel técnico; no sustituye auditoría legal | mínimos datos, códigos de acceso y autorización |
| RNF-18 | Implementado | zona `America/Lima` y tabla de feriados |
| RNF-19 | Implementado | respaldo JSON de tablas y copia de archivos; verificar tarea en despliegue |

## Interpretación de estados

- **Implementado:** existe lógica de frontend, backend y persistencia correspondiente.
- **Requiere credenciales:** el código está preparado, pero el proveedor externo no puede responder sin sus secretos.
- **Debe probarse desplegado:** depende de red, navegador, concurrencia o infraestructura y no puede certificarse solo con pruebas unitarias.
- **Ajustado:** el cambio y el requisito afectado están documentados en `AjustesJustosYNecesarios.md`.