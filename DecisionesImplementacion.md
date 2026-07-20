# Decisiones de implementación sin cambio de alcance

| Decisión | Parte del documento | Aplicación |
|---|---|---|
| Código de inspección como llave principal | RF-08, RF-09 y RNF-17 | El código de ocho caracteres permite seguimiento; el código de pago también funciona donde el documento lo exige. |
| Acceso temporal al plano | RF-42 y RNF-03 | El ciudadano presenta su código y los usuarios autorizados reciben una URL firmada temporal. |
| Cobro presencial ligado a caja abierta | RF-25, RF-27 y RF-28 | Al confirmar un pago presencial, la operación entra automáticamente en la caja diaria de la cajera. |
| Confirmación presencial protegida | RF-25 y RNF-01 | La cajera confirma efectivo, Yape o Plin mediante una ruta autenticada. |
| Inspector limitado al día actual | RF-20 y RNF-01 | El inspector solo abre o resuelve inspecciones pendientes programadas para hoy. |
| Alerta web por descuadre | RF-27 | Cada diferencia de arqueo crea una alerta visible para el administrador. |
| Renovación presencial separada | RF-26 | La cajera valida la licencia y procesa únicamente el pago directo. |
| Bloqueo transaccional para cupos | RNF-10 | PostgreSQL impide que dos solicitudes ocupen el mismo cupo. |
| Reintentos controlados | RNF-09 | Correo y almacenamiento repiten operaciones críticas sin duplicar el proceso principal. |
| Respaldo automático | RNF-19 | Se crea un respaldo diario y existe un comando manual. |
| React servido por Express | RNF-14 | El build del frontend se publica desde el backend para usar una sola URL en Render. |
| URL pública automática | RF-06, RF-42 y despliegue | Render proporciona `RENDER_EXTERNAL_URL`; el sistema calcula con ella el webhook y las rutas públicas. |