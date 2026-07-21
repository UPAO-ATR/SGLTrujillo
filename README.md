# SGL Trujillo — Flujo corregido

Aplicación nueva construida específicamente para el flujo presencial corregido del Sistema de Gestión de Licencias de Funcionamiento.

## Flujo implementado

- El cliente realiza la solicitud o renovación presencialmente mediante un cajero.
- Existen como mínimo dos cajeros y exactamente un inspector, un administrador y un superadministrador activos.
- El cajero solicita autorización para abrir y cerrar caja.
- El administrador autoriza aperturas, inyecciones de sencillo, cierres y arqueos.
- El RUC debe comenzar con 20, estar activo y tener al menos un local activo en el ubigeo 130101.
- Se revisan el local principal y los locales anexos; si hay varios válidos, el cajero selecciona la dirección.
- Se valida DNI, mayoría de edad, correo y plano PDF.
- Se muestra una tasa oficial de S/180 y se registra un cobro académico de S/3.
- El pago puede ser efectivo, Yape/Plin o una combinación exacta de ambos.
- La aplicación genera un QR dinámico demostrativo con el monto digital.
- La primera inspección se programa después de 15 días hábiles y la segunda después de 30.
- Solo se programan cuatro inspecciones por día.
- El inspector solo ve las inspecciones pendientes de la fecha simulada.
- La licencia aprobada tiene 365 días hábiles de vigencia.
- La licencia vencida se descarga con marca de agua.
- Todas las interfaces incluyen un simulador flotante de fecha.
- Las notificaciones se envían mediante Brevo cuando está configurado o se registran en consola en modo local.

## Tecnologías

- React + Vite
- Node.js + Express
- PostgreSQL / Neon
- CODART para RUC y DNI
- Brevo para correo
- Google Cloud Storage opcional
- Render para despliegue

No se utiliza Mercado Pago, un POS móvil ni el S24 Ultra. El pago híbrido se representa y concilia dentro del propio sistema.

## Inicio rápido local

1. Copia `Servidor/.env.ejemplo` como `Servidor/.env`.
2. Completa `URL_BASE_DATOS` y `CLAVE_JWT`.
3. Ejecuta:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\PrepararProyecto.ps1
.\IniciarProyecto.ps1
```

4. Abre `http://localhost:5173`.

## Sustitución y despliegue automáticos

Desde la carpeta descomprimida:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\InstalarEnRepositorioExistente.ps1 -Destino C:\SGLTrujillo
```

El script respalda la versión anterior en una rama, copia el nuevo código, crea el commit y publica en los remotos disponibles. Si Render tiene Auto-Deploy activo, el despliegue comienza con el push.

Para futuras modificaciones:

```powershell
.\PublicarActualizacion.ps1 -Mensaje "Describe el cambio"
```

## Base de datos independiente

La nueva versión crea el esquema PostgreSQL:

```text
sgl_flujo_corregido
```

Por ello puede reutilizar la misma URL de Neon sin mezclar ni borrar las tablas anteriores.

## Usuarios iniciales

| Rol | Correo | Contraseña |
|---|---|---|
| SuperAdministrador | superadmin@sgl.pe | SuperAdmin123! |
| Administrador | admin@sgl.pe | Admin123! |
| Inspector | inspector@sgl.pe | Inspector123! |
| Cajero 1 | cajero1@sgl.pe | Cajero123! |
| Cajero 2 | cajero2@sgl.pe | Cajero123! |

## Datos de demostración

- RUC con un local: `20481234567`
- RUC con dos locales válidos: `20601234567`
- DNI adulto: `71234567`
- DNI menor: `73456789`

Estos registros siguen disponibles en modo demostración aunque CODART tenga un token real.

## Verificación ejecutada

- 6 pruebas de reglas del servidor.
- 1 prueba del cliente API.
- Compilación de producción de React.
- Comprobación de importación del servidor.
- Comprobación de servicio estático con respuesta HTTP 200.
- Validación sintáctica de las 14 tablas PostgreSQL mediante un motor PostgreSQL embebido.

## Aclaración tributaria

La factura y la boleta generadas son documentos académicos demostrativos con campos de referencia. No constituyen comprobantes electrónicos emitidos o autorizados por SUNAT.
