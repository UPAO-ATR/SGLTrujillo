# Empieza aquí

No use Docker para el despliegue recomendado. Render construirá React y ejecutará Node.js directamente.

## Orden exacto

1. Suba esta carpeta completa a un repositorio de GitHub llamado `SGLTrujillo`.
2. Cree la base PostgreSQL en Neon y copie su cadena `Pooled`.
3. Genere el token gratuito de CODART.
4. Cree el bucket privado y la cuenta de servicio en Google Cloud Storage.
5. Verifique un remitente y genere una clave API en Brevo.
6. Cree una aplicación y obtenga credenciales de prueba en Mercado Pago.
7. En Render elija `New` y después `Blueprint`, conecte el repositorio y pegue las variables solicitadas.
8. Cuando el servicio muestre `Live`, configure el webhook de Mercado Pago y pruebe `/api/health`.

Todos los clics, nombres y valores están explicados en `GuiaDespliegueRender.md`.

## Archivos que no debe subir

No cree ni suba archivos `.env`, claves JSON de Google Cloud ni capturas donde se vean tokens. Las credenciales se pegan únicamente en las variables de entorno de Render.

## Nombre visible

La aplicación mostrará:

```text
SGL Trujillo
Sistema de Gestión de Licencias de Funcionamiento
Municipalidad Distrital de Trujillo
```

## Saltos de línea

Cada archivo de texto termina con un único salto de línea. Visual Studio Code puede mostrar el número de la línea siguiente vacía; esa línea no contiene código, no se ejecuta y no debe eliminarse manualmente.