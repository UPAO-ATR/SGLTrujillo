# Guía de demostración literal

## Datos preparados

- RUC con un local de Trujillo: `20481234567`
- RUC con dos locales válidos y uno excluido: `20601234567`
- DNI adulto: `71234567`
- DNI menor para probar rechazo: `73456789`
- Plano: cualquier PDF válido menor de 10 MB

Los RUC y DNI de demostración siguen disponibles aunque CODART esté configurado. Los demás documentos se consultan en CODART.

## Flujo completo

### 1. Abrir caja

1. Inicia sesión con `cajero1@sgl.pe / Cajero123!`.
2. Pulsa `Solicitar apertura`.
3. Cierra sesión e ingresa con `admin@sgl.pe / Admin123!`.
4. En solicitudes de caja, escribe un fondo inicial, por ejemplo S/1000.
5. Aprueba la apertura.

### 2. Registrar solicitud presencial

1. Regresa al cajero.
2. Abre `Nueva solicitud`.
3. Usa el RUC `20601234567` para demostrar la selección entre dos locales de Trujillo.
4. El tercer local, con otro ubigeo, no debe mostrarse.
5. Valida el DNI adulto `71234567`.
6. Escribe un correo real de prueba.
7. Adjunta el plano PDF.
8. Crea la solicitud.

### 3. Registrar pago híbrido

1. Deja S/1 en efectivo y S/2 en Yape/Plin.
2. Observa que el QR cambia con el monto digital.
3. Escribe un número de operación de al menos cuatro caracteres.
4. Confirma el pago.
5. Abre la factura demostrativa.
6. Revisa el correo con la fecha de primera inspección.

### 4. Primera inspección

1. Anota la fecha programada mostrada por el sistema.
2. Usa el simulador flotante y cambia a esa fecha.
3. Inicia sesión como `inspector@sgl.pe / Inspector123!`.
4. Verifica que solo aparezcan las inspecciones de ese día y no más de cuatro.
5. Abre la tarjeta, descarga el plano y escribe una observación de al menos diez caracteres.
6. El sistema mostrará la fecha de segunda inspección.

### 5. Segunda inspección

1. Cambia la fecha simulada a la segunda inspección.
2. Abre nuevamente el panel del inspector.
3. Para mostrar el rechazo, registra otra observación.
4. Para mostrar aprobación, usa otro trámite y pulsa `Aprobar licencia`.

### 6. Seguimiento público

1. Abre `Seguimiento`.
2. Consulta el RUC.
3. Selecciona el local.
4. Muestra los estados En proceso, En observación, Rechazado o Aprobado según el caso.

### 7. Vencimiento y renovación

1. En un trámite aprobado, anota la fecha de vencimiento.
2. Cambia la fecha simulada a ese día.
3. Consulta el RUC y descarga la licencia con la marca `VENCIDA`.
4. Inicia sesión como cajero y abre `Renovación`.
5. Busca el RUC, selecciona el local vencido, registra DNI y pago.
6. Abre la boleta demostrativa y verifica la nueva vigencia.

### 8. Cierre y descuadre

1. En caja, solicita el cierre indicando un efectivo contado distinto del esperado.
2. El administrador aprueba el cierre.
3. Muestra la alerta de descuadre en su panel.

## Aclaración para la defensa

El QR y los comprobantes tributarios son demostrativos. El sistema sí valida montos, registra efectivo y Yape/Plin por separado, controla la caja y conserva el número de operación, pero no afirma emitir un comprobante electrónico autorizado por SUNAT ni confirmar automáticamente una transferencia bancaria.
