# Guía de demostración de SGL Trujillo

## Preparación

1. Abra la dirección de Render entre 10 y 15 minutos antes.
2. Abra `/api/health` y espere `OPERATIVO`.
3. Prepare un PDF pequeño para el ciudadano y un JPG para la cajera.
4. Compruebe previamente el RUC y DNI que usarán con CODART.
5. Mantenga los datos internos de respaldo por si un servicio externo falla.

## Ciudadano

1. Entre en `Nueva licencia` sin iniciar sesión.
2. Consulte el RUC.
3. Muestre razón social, domicilio y ubigeo como solo lectura.
4. Ingrese correo y cargue el PDF.
5. Cree el pago de prueba.
6. Muestre la constancia y el código de inspección.
7. Consulte `Revisión de proceso`.

## Inspector

La regla real programa la visita después de 15 días. Para demostrarla el mismo día:

1. Inicie sesión como administrador.
2. Entre en `Inspecciones`.
3. Pulse `Preparar primera visita`.
4. Cierre sesión e ingrese como inspector.
5. Abra la inspección del día.
6. Muestre el plano.
7. Apruebe o registre observaciones.

Cuando exista una segunda visita pendiente, vuelva al panel del administrador y pulse `Preparar segunda visita`. Los botones solo funcionan con `MODO_DEMOSTRACION=true`.

## Cajera

1. Abra la caja con S/ 1,000.00.
2. Cree una solicitud presencial.
3. Cargue PDF, JPG o PNG.
4. Registre efectivo, Yape o Plin.
5. Muestre historial y filtros.
6. Alcance el umbral, realice una sangría y compruebe el arqueo.

## Administrador

1. Muestre inspecciones y filtros de solo lectura.
2. Consulte un DNI.
3. Demuestre que solo existe un inspector habilitado.
4. Cambie una configuración válida.
5. Muestre feriados, alertas y auditoría.

## Super administrador

1. Muestre que es el único rol que crea al administrador.
2. Compruebe que no permite dos administradores habilitados.

## Cierre

1. Descargue una licencia.
2. Explique la vigencia de 360 días.
3. Muestre `AjustesJustosYNecesarios.md` únicamente cuando pregunten por una diferencia respecto del documento.