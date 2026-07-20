# Informe de verificación técnica

Fecha de verificación: 20 de julio de 2026.

## Resultados ejecutados sobre esta versión

- Instalación limpia de dependencias desde los tres archivos `package-lock.json`: correcta.
- Registro público de npm en todos los archivos de bloqueo: verificado.
- Sintaxis de todos los archivos JavaScript del servidor: correcta.
- Pruebas del servidor: 80 de 80 aprobadas.
- Pruebas del cliente: 7 de 7 aprobadas.
- Cobertura del alcance configurado en servidor: 97.65 % de sentencias, 95.16 % de ramas y 95.23 % de funciones.
- Construcción de producción de React: correcta.
- Simulación del comando de construcción de Render con `NODE_ENV=production`: correcta.
- Importación del servidor con dependencias exclusivamente de producción: correcta.
- React servido por Express desde `/`: verificado.
- Ruta directa de React, por ejemplo `/login`: respuesta 200 verificada.
- Ruta API inexistente: respuesta 404 verificada.
- Herramienta administrativa de preparación de exposición: sintaxis, validación y build verificados.
- Integración CODART: prioridad de consulta real con token y respaldo sin token verificadas.
- Integración Brevo: envío HTTP y modo de respaldo verificados con pruebas aisladas.
- Auditoría de dependencias de producción: 0 vulnerabilidades informadas en servidor y cliente.
- Carga de Google Cloud Storage y Mercado Pago: correcta.
- Generación de constancia, licencia y marca de agua: conservada.

## Alcance exacto de la cobertura

La cobertura indicada corresponde a dominio, utilidades y validadores definidos en `Servidor/vitest.config.js`. No representa una cobertura del 97.65 % de cada controlador, repositorio o servicio externo.

## Resultado del build

El build produjo correctamente:

```text
Cliente/dist/index.html
Cliente/dist/assets/*.css
Cliente/dist/assets/*.js
```

El backend publica esos archivos en producción. Por ello, `render.yaml` crea un solo servicio.

## Verificaciones pendientes por requerir credenciales del equipo

- Migraciones y siembra sobre Neon real.
- Consulta real con el token de CODART.
- Checkout y webhook de Mercado Pago Sandbox.
- Subida y URL firmada de Google Cloud Storage.
- Envío real mediante Brevo.
- Recorrido integral sobre la dirección pública de Render.

Estas comprobaciones están descritas, en orden, en `GuiaDespliegueRender.md`.