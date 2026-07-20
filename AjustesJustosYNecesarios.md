# Ajustes justos y necesarios

Esta versión conserva los flujos de los documentos originales. Los ajustes siguientes resuelven contradicciones, términos ambiguos o necesidades técnicas inevitables. No se agregaron cambios de alcance sin autorización.

| Ajuste | Parte afectada | Aplicación exacta |
|---|---|---|
| Un solo inspector habilitado | RF-19, RF-30, RF-31 y usuarios de prueba de `REQUISITOS FINALES` | Se conserva el historial de reemplazos, pero solo uno puede permanecer habilitado. Se omite el segundo inspector de prueba que contradice esta regla. |
| CODART como proveedor | RF-02, RF-25, RF-31, RF-33 y RNF-15 | Las consultas de RUC y DNI se realizan mediante `ClienteCodart`. Con token se consulta CODART; sin token se permite únicamente el respaldo demostrativo. |
| Despliegue demostrativo en Render | RNF-08 | Se conserva `/api/health`. El plan gratuito se usa para la entrega, sin declarar el 99 % como SLA contractual. |
| Un solo servicio web | RNF-14 y documentación de despliegue | Express publica la API y el build de React desde una misma dirección. No cambia ningún requisito funcional y evita configuración duplicada. |
| Neon como PostgreSQL persistente | RNF-07, RNF-10, RNF-14 y RNF-19 | La base se aloja en Neon Free en la misma zona general que Render. No cambia el modelo de datos ni las transacciones. |
| Brevo como correo | RF-05, RF-18, RF-27, RNF-09 y RNF-15 | Se usa Brevo Free mediante su API transaccional. El cambio solo concreta el proveedor que el documento dejó abierto. |
| Boleta como constancia de pago | RF-07 y referencias a boleta | Se genera una constancia PDF con número, fecha, negocio, importes, medio, código de pago y código de inspección. No se declara comprobante tributario electrónico. |
| Significado del countdown | RF-10, RF-11 y RNF-11 | El contador muestra los días restantes de la vigencia de 360 días. La URL firmada dura pocos minutos y se puede solicitar nuevamente. |
| Formatos del plano presencial | RF-04 y RF-25 | Ciudadano: solo PDF. Cajera: PDF, JPG o PNG, porque el documento permite fotografiar o escanear el plano. |
| Horario configurable | RF-16, RF-18 y RF-35 | La entrada se configura entre 08:00 y 11:00; la salida se calcula sumando ocho horas. Los mensajes usan el horario configurado. |
| Tratamiento de licencia vencida | RF-14 y RNF-19 | El original histórico se conserva. Al descargar una licencia vencida se genera una copia con marca de agua. La renovación produce una licencia nueva. |
| FIFO con prioridad de reprogramados | RF-16 y RF-18 | Las nuevas solicitudes respetan orden de llegada. Las no atendidas pasan al inicio del siguiente día hábil y producen el corrimiento en cascada descrito en la página 5. |
| Reducción de capacidad diaria | RF-36, RNF-10 y RNF-13 | Si la capacidad baja cuando un día ya está lleno, los excedentes se desplazan en cascada. |
| Credencial del super administrador | RF-37 | Se incorpora `superadmin@sgl.muni.pe / SuperAdmin123!` porque el rol es obligatorio, pero no se proporcionó una credencial. |
| Plantilla de licencia sustituible | RF-22 y RF-40 | Se incluye `Servidor/Recursos/IMAGEN_LICENCIA.jpeg`; puede reemplazarse manteniendo el nombre. |
| Nombre de bucket global | RF-04 y RF-40 | Se intenta el nombre literal. Si Google lo rechaza por estar ocupado globalmente, se usa `sgl-trujillo-licencias-planos-2026-upao` y se registra en `GCS_NOMBRE_BUCKET`. |
| Paquetes instalables fuera del entorno de creación | RNF-14 | Los archivos `package-lock.json` usan el registro público de npm y no una dirección interna. |
| Preparación de fechas para exposición | RF-15, RF-20 y RF-23 | Las reglas siguen siendo 15 y 30 días. En modo demostración, el administrador dispone de dos botones auditados para mover una primera o segunda visita pendiente al día actual. |

## Convenciones técnicas

- Código propio en español y CamelCase.
- Los nombres obligatorios de herramientas conservan su formato, por ejemplo `package-lock.json`, `.node-version` y variables de entorno.
- Los archivos de texto terminan con un único salto de línea y sin bloques vacíos al final.